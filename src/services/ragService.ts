/**
 * RAG Query Service
 *
 * This service handles:
 * 1. Semantic search against the menu vector database
 * 2. Context assembly for the LLM
 * 3. Response generation with grounding
 *
 * This is the core "intelligence" of the chatbot.
 */

import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs';
import path from 'path';
import {
  MenuItem,
  ChatRequest,
  ChatResponse,
  ChatMessage,
  RetrievedContext,
  ChatAnalytics,
  ChatIntent,
} from '../types/menu';

// Check environment variables (warn instead of crash for demo mode)
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasPinecone = !!process.env.PINECONE_API_KEY;

if (!hasOpenAI) {
  console.warn('⚠️  OPENAI_API_KEY not set. AI chatbot will run in demo mode with canned responses.');
}
if (!hasPinecone) {
  console.warn('⚠️  PINECONE_API_KEY not set. RAG search will be disabled.');
}

export const isRAGEnabled = hasOpenAI && hasPinecone;

// Initialize clients only if keys are available
const openai = hasOpenAI
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : (null as unknown as OpenAI);

const pinecone = hasPinecone
  ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  : (null as unknown as Pinecone);

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'restaurant-menu';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini'; // Fast & cost-effective

// Configuration
const TOP_K_RESULTS = 20; // Retrieve many items so the LLM has full context to reason with
const SIMILARITY_THRESHOLD = 0.30; // Low threshold — let the LLM do the smart filtering
const MAX_CONVERSATION_HISTORY = 6; // Messages to include for context

/**
 * System prompt - the AI's personality and rules
 * See SYSTEM_PROMPT.md for the full documented version
 */
const SYSTEM_PROMPT = `You are a friendly, smart, and experienced menu assistant at The Golden Fork. You help customers find the perfect dish — even when their request is vague, complex, or involves exclusions.

## GOLDEN RULE: NEVER SAY "I DON'T SEE" IF YOU CAN REASON THROUGH THE MENU

You have the full ingredient list for every dish in the menu context. USE IT. When a customer describes what they want (or don't want), you MUST:
1. Read through ALL items in the menu context
2. Check the **Ingredients** line for each dish
3. Eliminate dishes that contain excluded ingredients
4. Recommend dishes that match their criteria
5. Explain WHY each recommendation fits

## How to Handle Different Request Types

### EXCLUSION REQUESTS ("no X", "without Y", "I can't eat Z")
- Scan every dish's Ingredients list for the excluded items
- Recommend dishes that do NOT contain those ingredients
- Example: "no onion no garlic" → check each Ingredients list, skip any with onion or garlic
- Example: "no beef and pork" → find chicken, seafood, duck, lamb, or vegetarian dishes

### PREFERENCE REQUESTS ("something light", "feeling sick", "not too heavy")
- "Light" / "not heavy" → salads, soups, grilled vegetables, fish dishes, small plates
- "Feeling sick" / "comfort food" → soups, simple grilled items, rice-based dishes
- "Celebrating" / "special occasion" → premium dishes, chef's specials, lobster, steak
- "Quick" / "simple" → appetizers, salads, sides
- Use common sense about what food matches the mood

### DIETARY + EXCLUSION COMBOS ("vegetarian but no nuts", "vegan no soy")
- First filter by dietary flag (e.g., isVegetarian)
- Then check Ingredients list to exclude the specific items
- Always recommend at least 1-2 dishes, explaining what makes them safe

### CULTURAL / RELIGIOUS REQUESTS ("halal", "kosher")
- If asked for halal: recommend dishes without pork/alcohol, note that you cannot guarantee halal certification — suggest confirming with staff
- If contradictory (e.g., "halal pork"): politely explain pork is not halal, offer alternative meat dishes
- Always be respectful and knowledgeable

### VAGUE REQUESTS ("what's good", "surprise me", "I'm hungry")
- Recommend 2-3 popular or chef-recommended items across different categories
- Include price range variety
- Ask one follow-up: "Do you prefer meat, seafood, or something plant-based?"

### TOP SELLERS / POPULAR ITEMS
- When asked about "popular", "best sellers", "what's good today", "top selling" → recommend the chef's choice items (if available) plus signature dishes like the Grilled Ribeye, Pan-Seared Duck, Herb-Crusted Salmon, and Lobster Risotto
- Frame them as "guest favorites" and "most popular on our menu"

## Response Rules

1. **ALWAYS RECOMMEND SOMETHING**: You have the menu with full ingredients. There is almost always something that works. Only say "I don't see anything" as an absolute last resort after checking every item.
2. **STRICT MENU ADHERENCE**: Only recommend items from the provided menu context. Never invent dishes.
3. **SHOW YOUR REASONING**: "The Herb-Crusted Salmon would work great — it's made with salmon, quinoa, asparagus, and dill, so no onion or garlic at all."
4. **DIETARY SAFETY**: Take allergies seriously. When flagging items, mention specific allergens from the menu data. Always advise confirming with their server for severe allergies.
5. **WARM TONE**: Be personable but polished — like an experienced server who genuinely wants to help. Keep responses concise (2-4 sentences, max 3 recommendations).
6. **SMART PAIRINGS**: Proactively suggest wine/beverage pairings when available.
7. **BOUNDARIES**: You cannot process orders, make reservations, or confirm real-time availability. Direct these to staff.
8. **PRICE AWARENESS**: When recommending, naturally mention prices so customers can choose within their budget.

## When the Menu Context is Limited
If the retrieved menu items don't seem to cover the customer's request well, work with what you have. Cross-reference ingredients creatively. If truly nothing matches, suggest the closest options and explain the trade-off.`;

/**
 * Create embedding for a query string
 */
async function createQueryEmbedding(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });
  return response.data[0].embedding;
}

/**
 * Detect if a query needs broad menu context
 * (vague requests, exclusion queries, mood-based queries)
 */
function needsBroadRetrieval(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  const broadPatterns = [
    /\bno\b.*\band\b/,           // "no X and Y" — exclusion combo
    /\bwithout\b/,               // "without onion"
    /\bnot too\b/,               // "not too heavy"
    /\blight\b/,                 // "something light"
    /\bsimple\b/,               // "something simple"
    /\bcomfort\b/,               // "comfort food"
    /\bfeeling\b/,              // "not feeling well"
    /\bsick\b/,                 // "feeling sick"
    /\bbut no\b/,               // "vegetarian but no nuts"
    /\bexcept\b/,               // "anything except..."
    /\bavoid\b/,                // "I avoid..."
    /\bcan'?t eat\b/,          // "I can't eat..."
    /\bdon'?t eat\b/,          // "I don't eat..."
    /\bwhat'?s good\b/,        // "what's good"
    /\bsurprise\b/,            // "surprise me"
    /\bpopular\b/,             // "popular items"
    /\bbest sell/,             // "best sellers"
    /\btop\b.*\bsell/,        // "top selling"
    /\brecommend/,             // "what do you recommend"
    /\bchef/,                  // "chef's choice"
    /\bspecial/,               // "any specials"
    /\bhealthy\b/,             // "something healthy"
    /\bkids?\b/,               // "for kids"
    /\bcheap\b|\baffordable\b|\bbudget\b/, // price-sensitive
    /\bcelebrat/,              // "celebrating"
    /\bhalal\b|\bkosher\b/,   // religious dietary
    /\bi (love|like|prefer|want|enjoy)\b/, // preference statements
  ];
  return broadPatterns.some(pattern => pattern.test(lowerQuery));
}

/**
 * Rewrite the query to improve semantic search results
 * Converts exclusion/mood-based queries into positive search terms
 */
function rewriteQueryForSearch(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const queries: string[] = [query]; // Always include original

  // For exclusion queries, add positive versions
  if (/\bno\b.*\b(beef|pork)\b/.test(lowerQuery) || /\bwithout\b.*\b(beef|pork)\b/.test(lowerQuery)) {
    queries.push('chicken dishes poultry');
    queries.push('seafood fish salmon');
    queries.push('duck lamb');
  }
  if (/\bno\b.*\b(meat)\b/.test(lowerQuery) || /\bvegetarian\b/.test(lowerQuery)) {
    queries.push('vegetarian vegan plant-based dishes');
    queries.push('salad vegetables mushroom');
  }
  if (/\blight\b|\bnot.*heavy\b|\bsick\b|\bnot feeling well\b/.test(lowerQuery)) {
    queries.push('salad soup light appetizer grilled fish');
    queries.push('rice vegetables simple broth');
  }
  if (/\bspicy\b|\bhot\b|\bkick\b/.test(lowerQuery)) {
    queries.push('spicy hot chili Thai curry');
  }
  if (/\bsweet\b|\bdessert\b/.test(lowerQuery)) {
    queries.push('dessert cake chocolate sweet');
  }
  if (/\bpopular\b|\bbest\b|\btop\b|\brecommend\b|\bchef\b|\bspecial\b/.test(lowerQuery)) {
    queries.push('signature dish popular favorite chef recommendation steak salmon duck lobster');
  }
  if (/\bhalal\b/.test(lowerQuery)) {
    queries.push('chicken lamb seafood fish grilled');
  }

  return queries;
}

/**
 * Retrieve relevant menu items based on the query
 * Uses multi-query strategy for complex/vague requests
 */
async function retrieveMenuItems(
  query: string,
  filters?: ChatRequest['dietaryFilters']
): Promise<RetrievedContext[]> {
  const index = pinecone.index(INDEX_NAME);

  // Build metadata filter if dietary restrictions specified
  const metadataFilter: Record<string, any> = {};
  if (filters) {
    if (filters.glutenFree) metadataFilter.isGlutenFree = true;
    if (filters.vegetarian) metadataFilter.isVegetarian = true;
    if (filters.vegan) metadataFilter.isVegan = true;
    if (filters.dairyFree) metadataFilter.isDairyFree = true;
    if (filters.noNuts) metadataFilter.containsNuts = false;
  }

  // Determine search queries
  const isBroadQuery = needsBroadRetrieval(query);
  const searchQueries = isBroadQuery ? rewriteQueryForSearch(query) : [query];

  console.log('🔍 RAG Query:', { query, isBroadQuery, searchQueries: searchQueries.length, filters, metadataFilter });

  // Execute all queries in parallel
  const allResults = await Promise.all(
    searchQueries.map(async (searchQuery) => {
      const queryEmbedding = await createQueryEmbedding(searchQuery);
      return index.query({
        vector: queryEmbedding,
        topK: isBroadQuery ? TOP_K_RESULTS : TOP_K_RESULTS,
        includeMetadata: true,
        filter: Object.keys(metadataFilter).length > 0 ? metadataFilter : undefined,
      });
    })
  );

  // Merge and deduplicate results, keeping highest score per item
  const itemMap = new Map<string, { score: number; metadata: any }>();

  for (const results of allResults) {
    for (const match of results.matches || []) {
      if (match.score && match.score >= SIMILARITY_THRESHOLD && match.metadata) {
        const existing = itemMap.get(match.id);
        if (!existing || match.score > existing.score) {
          itemMap.set(match.id, { score: match.score, metadata: match.metadata });
        }
      }
    }
  }

  // Parse results
  const retrievedItems: RetrievedContext[] = [];
  itemMap.forEach(({ score, metadata }, id) => {
    try {
      const fullItem = JSON.parse(metadata.fullItem as string) as MenuItem;
      retrievedItems.push({ item: fullItem, score });
    } catch (e) {
      console.warn('Failed to parse menu item from metadata:', e);
    }
  });

  // Sort by score descending
  retrievedItems.sort((a, b) => b.score - a.score);

  console.log('📊 Pinecone Results:', {
    totalQueries: searchQueries.length,
    uniqueItems: retrievedItems.length,
    topItems: retrievedItems.slice(0, 5).map(r => ({ name: r.item.name, score: r.score.toFixed(3) }))
  });

  return retrievedItems;
}

/**
 * Format retrieved menu items into context for the LLM
 */
function formatMenuContext(items: RetrievedContext[]): string {
  if (items.length === 0) {
    return 'No menu items were retrieved. Ask the customer what type of food they enjoy (meat, seafood, vegetarian, etc.) so you can help find the right dish.';
  }

  const contextParts = items.map(({ item, score }) => {
    const tags: string[] = [];
    if (item.isGlutenFree) tags.push('[GF]');
    if (item.isVegetarian) tags.push('[V]');
    if (item.isVegan) tags.push('[VG]');
    if (item.isDairyFree) tags.push('[DF]');
    if (item.isSpicy) tags.push('[Spicy]');
    if (item.containsNuts) tags.push('[Contains Nuts]');

    // Include ALL ingredient info clearly so the LLM can reason about exclusions
    return `
**${item.name}** ${tags.join(' ')} - $${item.price.toFixed(2)}
Category: ${item.category}
${item.description}
INGREDIENTS: ${item.ingredients.join(', ')}
${item.allergens.length > 0 ? `ALLERGENS: ${item.allergens.join(', ')}` : 'ALLERGENS: None'}
${item.pairings ? `Pairs with: ${item.pairings.join(', ')}` : ''}
${item.chefNote ? `Chef's note: ${item.chefNote}` : ''}
    `.trim();
  });

  return `## Menu Items Available (${items.length} items)\nIMPORTANT: Read the INGREDIENTS list carefully to match the customer's needs. Exclude dishes with ingredients they want to avoid.\n\n${contextParts.join('\n\n---\n\n')}`;
}

/**
 * Load today's Chef's Choice from disk
 */
function loadChefsChoice(): string {
  try {
    const filePath = path.join(process.cwd(), 'data', 'chefs-choice.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      const today = new Date().toISOString().split('T')[0];
      if (data.date === today && data.items && data.items.length > 0) {
        const items = data.items
          .map((item: { name: string; reason: string; description: string }) =>
            `- **${item.name}**${item.reason ? ` — ${item.reason}` : ''}${item.description ? ` (${item.description})` : ''}`
          )
          .join('\n');
        return `\n\n## 🌟 Chef's Choice Today\n${data.message ? `_"${data.message}"_\n` : ''}${items}\n\nWhen customers ask about chef's picks, chef's choice, chef's recommendations, or today's specials, enthusiastically recommend these dishes and explain why the chef selected them today.`;
      }
    }
  } catch {
    // ignore
  }
  return '';
}

/**
 * Build the messages array for the chat completion
 */
function buildMessages(
  systemPrompt: string,
  menuContext: string,
  userMessage: string,
  conversationHistory?: ChatMessage[]
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${systemPrompt}\n\n---\n\n## Current Menu Context\n\n${menuContext}${loadChefsChoice()}`,
    },
  ];

  // Add conversation history (limited to recent messages)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  return messages;
}

/**
 * Detect the intent of the user's message (for analytics)
 */
function detectIntent(message: string): ChatIntent {
  const lowerMessage = message.toLowerCase();

  if (/what (should|would you recommend|do you suggest)|recommend|suggest|popular|best|top.?sell|chef.?s/i.test(message)) {
    return 'recommendation';
  }
  if (/gluten.?free|vegetarian|vegan|dairy.?free|allerg|halal|kosher|no .*(meat|pork|beef|nuts|dairy|gluten)/i.test(message)) {
    return 'dietary_inquiry';
  }
  if (/tell me (about|more)|what('s| is) (the|in)|describe|ingredients/i.test(message)) {
    return 'item_details';
  }
  if (/how much|price|cost|cheap|afford|budget|expensive/i.test(message)) {
    return 'price_inquiry';
  }
  if (/pair|goes? with|complement|wine|drink|cocktail|beverage/i.test(message)) {
    return 'pairing_request';
  }
  if (/do you have|is there|any|looking for|want|prefer|love|enjoy|feel like|mood/i.test(message)) {
    return 'availability';
  }
  if (!/food|eat|dish|menu|hungry|appetizer|main|dessert|drink|order|salad|steak|fish|chicken|soup|pasta|curry|rice|light|heavy|spicy/i.test(message)) {
    return 'off_topic';
  }
  return 'general_question';
}

/**
 * Auto-detect dietary filters from the user's message
 * This ensures dietary queries are properly filtered even without explicit frontend filters
 */
function detectDietaryFiltersFromMessage(message: string): ChatRequest['dietaryFilters'] {
  const lowerMessage = message.toLowerCase();
  const filters: ChatRequest['dietaryFilters'] = {};

  // Detect gluten-free queries
  if (/gluten.?free|no gluten|without gluten|celiac|coeliac/i.test(lowerMessage)) {
    filters.glutenFree = true;
  }

  // Detect vegetarian queries — but NOT if they also have exclusions that make Pinecone filter too strict
  // e.g. "vegetarian but no onion" — we want vegetarian filter ON but let LLM handle onion exclusion
  if (/vegetarian|no meat|meatless|meat.?free/i.test(lowerMessage) && !/vegan/i.test(lowerMessage)) {
    filters.vegetarian = true;
  }

  // Detect vegan queries
  if (/vegan|plant.?based|no animal/i.test(lowerMessage)) {
    filters.vegan = true;
  }

  // Detect dairy-free queries
  if (/dairy.?free|no dairy|lactose|without dairy|no cheese/i.test(lowerMessage)) {
    filters.dairyFree = true;
  }

  // Detect nut-free queries
  if (/nut.?free|no nuts|nut allergy|without nuts|peanut allergy|no peanut/i.test(lowerMessage)) {
    filters.noNuts = true;
  }

  // IMPORTANT: For complex exclusion queries ("no beef and pork", "no onion no garlic"),
  // DON'T apply Pinecone metadata filters — these need LLM-level ingredient reasoning.
  // Only use Pinecone filters for broad dietary categories.

  // Return undefined if no dietary filters detected
  return Object.keys(filters).length > 0 ? filters : undefined;
}

/**
 * Main function: Process a chat request and generate a response
 */
export async function processChat(request: ChatRequest): Promise<ChatResponse> {
  const startTime = Date.now();

  // Demo mode: return helpful canned response if APIs aren't configured
  if (!isRAGEnabled) {
    const demoMessage = getDemoResponse(request.message);
    return {
      message: demoMessage,
      retrievedItems: [],
      suggestedItems: [],
      processingTimeMs: Date.now() - startTime,
    };
  }

  try {
    // Step 1: Determine dietary filters
    // Use explicit filters if provided, otherwise auto-detect from message
    const dietaryFilters = request.dietaryFilters || detectDietaryFiltersFromMessage(request.message);

    // Step 2: Retrieve relevant menu items
    const retrievedContext = await retrieveMenuItems(
      request.message,
      dietaryFilters
    );

    // Step 3: Format context for the LLM
    const menuContext = formatMenuContext(retrievedContext);

    // Step 4: Build messages array
    const messages = buildMessages(
      SYSTEM_PROMPT,
      menuContext,
      request.message,
      request.conversationHistory
    );

    // Step 5: Generate response
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: 0.3, // Lower temp for more reliable ingredient reasoning
      max_tokens: 500, // Enough for 2-3 recommendations with reasoning
      presence_penalty: 0.1, // Slight penalty for repetition
    });

    const assistantMessage = completion.choices[0]?.message?.content ||
      "I apologize, but I'm having trouble processing your request. Could you please try again?";

    const processingTimeMs = Date.now() - startTime;

    return {
      message: assistantMessage,
      retrievedItems: retrievedContext.map((rc) => rc.item),
      suggestedItems: retrievedContext.slice(0, 3).map((rc) => rc.item), // Top 3 as suggestions
      processingTimeMs,
    };
  } catch (error) {
    console.error('RAG processing error:', error);
    throw new Error('Failed to process chat request');
  }
}

/**
 * Create analytics record for a chat interaction
 */
export function createAnalyticsRecord(
  request: ChatRequest,
  response: ChatResponse,
  sessionId: string
): ChatAnalytics {
  const dietaryMentions: string[] = [];
  const lowerMessage = request.message.toLowerCase();

  if (lowerMessage.includes('gluten')) dietaryMentions.push('gluten-free');
  if (lowerMessage.includes('vegetarian')) dietaryMentions.push('vegetarian');
  if (lowerMessage.includes('vegan')) dietaryMentions.push('vegan');
  if (lowerMessage.includes('dairy')) dietaryMentions.push('dairy-free');
  if (lowerMessage.includes('nut')) dietaryMentions.push('nut-free');
  if (lowerMessage.includes('allerg')) dietaryMentions.push('allergy-concern');

  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    tableId: request.tableId,
    userMessage: request.message,
    assistantResponse: response.message,
    retrievedItemIds: response.retrievedItems?.map((item) => item.id) || [],
    responseTimeMs: response.processingTimeMs || 0,
    timestamp: new Date(),
    detectedIntent: detectIntent(request.message),
    mentionedDietaryNeeds: dietaryMentions,
  };
}

/**
 * Demo response when API keys aren't configured
 */
function getDemoResponse(message: string): string {
  const lower = message.toLowerCase();

  if (/gluten.?free/i.test(lower)) {
    return "Great question! We have several gluten-free options including our Thai Red Curry, Herb-Crusted Salmon, and Grilled Ribeye Steak. I'd particularly recommend the Thai Red Curry — it's packed with flavor and naturally gluten-free. Would you like to know more about any of these?\n\n*(Demo mode — connect OpenAI & Pinecone API keys for full AI recommendations)*";
  }
  if (/vegetarian|vegan/i.test(lower)) {
    return "We have wonderful plant-based options! The Thai Red Curry with seasonal vegetables is a guest favorite, and our Caesar Salad can be made vegetarian. For something heartier, try the Wild Mushroom Fettuccine. Shall I tell you more?\n\n*(Demo mode — connect OpenAI & Pinecone API keys for full AI recommendations)*";
  }
  if (/recommend|suggest|popular|best/i.test(lower)) {
    return "I'd love to help! Our most popular dishes are the Grilled Ribeye Steak — beautifully charred with a rich flavor — and the Pan-Seared Duck Breast with its cherry reduction. For seafood lovers, the Herb-Crusted Salmon is exceptional. What sounds appealing to you?\n\n*(Demo mode — connect OpenAI & Pinecone API keys for full AI recommendations)*";
  }
  if (/dessert|sweet/i.test(lower)) {
    return "For dessert, you can't go wrong with our Chocolate Lava Cake — it has a warm, molten center that's absolutely heavenly. We also have a lovely Crème Brûlée and a seasonal fruit tart. Any of those catch your eye?\n\n*(Demo mode — connect OpenAI & Pinecone API keys for full AI recommendations)*";
  }
  if (/wine|drink|pair/i.test(lower)) {
    return "Great choice thinking about pairings! Our Cabernet Sauvignon goes beautifully with the Ribeye, while the Chardonnay is perfect alongside our Salmon. For something lighter, try our house Pinot Grigio. What dish are you pairing with?\n\n*(Demo mode — connect OpenAI & Pinecone API keys for full AI recommendations)*";
  }

  return "Welcome to The Golden Fork! I'm your AI menu assistant. I can help you find dishes based on your preferences, dietary needs, or recommend our most popular items. What are you in the mood for tonight?\n\n*(Demo mode — connect OpenAI & Pinecone API keys for full AI recommendations)*";
}

/**
 * Health check for the RAG service
 */
export async function healthCheck(): Promise<{
  openai: boolean;
  pinecone: boolean;
  indexStats: { totalVectors: number } | null;
}> {
  if (!isRAGEnabled) {
    return { openai: false, pinecone: false, indexStats: null };
  }

  let openaiOk = false;
  let pineconeOk = false;
  let indexStats = null;

  try {
    await openai.models.list();
    openaiOk = true;
  } catch (e) {
    console.error('OpenAI health check failed:', e);
  }

  try {
    const index = pinecone.index(INDEX_NAME);
    const stats = await index.describeIndexStats();
    pineconeOk = true;
    indexStats = { totalVectors: stats.totalRecordCount || 0 };
  } catch (e) {
    console.error('Pinecone health check failed:', e);
  }

  return { openai: openaiOk, pinecone: pineconeOk, indexStats };
}
