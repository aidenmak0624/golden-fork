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
const TOP_K_RESULTS = 12; // Retrieve more items to increase chances of finding dietary matches
const SIMILARITY_THRESHOLD = 0.40; // Lowered threshold for broader dietary/attribute matching
const MAX_CONVERSATION_HISTORY = 6; // Messages to include for context

/**
 * System prompt - the AI's personality and rules
 * See SYSTEM_PROMPT.md for the full documented version
 */
const SYSTEM_PROMPT = `You are a friendly and knowledgeable menu assistant at [RESTAURANT_NAME]. Your role is to help customers discover dishes they'll love based on their preferences, dietary needs, and curiosity about our menu.

## Your Core Rules

1. **STRICT MENU ADHERENCE**: Only recommend items from the provided menu context. Never invent dishes.

2. **DIETARY SAFETY & AWARENESS**: 
   - Take all allergies and dietary restrictions seriously
   - When you see dietary flags in the menu context (like "GLUTEN-FREE", "VEGAN", "SPICY"), highlight them prominently
   - If a customer asks "What's gluten-free?", check the menu context for items marked GLUTEN-FREE and recommend those
   - If they say "I'm vegetarian", filter to items marked VEGETARIAN or VEGAN
   - If they mention "spicy", recommend items marked SPICY and explain the heat level
   - Always advise confirming with their server for severe allergies

3. **WARM & PROFESSIONAL TONE**: Be personable but polished—like an experienced server. Keep responses concise (2-4 sentences typically).

4. **HELPFUL RECOMMENDATIONS**: Explain WHY a dish fits their request, not just what it is. Reference dietary attributes and pairings. Offer 2-3 options without overwhelming.

5. **SMART PAIRINGS**: If a dish has "Pairs well with" in its description, proactively suggest those beverages or sides.

6. **BOUNDARIES**: You cannot process orders, make reservations, or confirm real-time availability. Direct these to staff.

When responding:
- Ground ALL recommendations in the provided menu context
- Use dietary keywords you see in the context (GLUTEN-FREE, VEGAN, SPICY, etc.) to match customer needs
- If something isn't in the context, honestly say you don't see it on the menu
- Ask ONE clarifying question if the request is vague
- Use natural language, not robotic lists`;

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
 * Retrieve relevant menu items based on the query
 */
async function retrieveMenuItems(
  query: string,
  filters?: ChatRequest['dietaryFilters']
): Promise<RetrievedContext[]> {
  const index = pinecone.index(INDEX_NAME);

  // Create query embedding
  const queryEmbedding = await createQueryEmbedding(query);

  // Build metadata filter if dietary restrictions specified
  const metadataFilter: Record<string, any> = {};
  if (filters) {
    if (filters.glutenFree) metadataFilter.isGlutenFree = true;
    if (filters.vegetarian) metadataFilter.isVegetarian = true;
    if (filters.vegan) metadataFilter.isVegan = true;
    if (filters.dairyFree) metadataFilter.isDairyFree = true;
    if (filters.noNuts) metadataFilter.containsNuts = false;
  }

  // DEBUG: Log the query and filters
  console.log('🔍 RAG Query:', { query, filters, metadataFilter });

  // Query Pinecone
  const results = await index.query({
    vector: queryEmbedding,
    topK: TOP_K_RESULTS,
    includeMetadata: true,
    filter: Object.keys(metadataFilter).length > 0 ? metadataFilter : undefined,
  });

  // DEBUG: Log raw Pinecone results
  console.log('📊 Pinecone Results:', {
    matchCount: results.matches?.length || 0,
    matches: results.matches?.map(m => ({
      id: m.id,
      score: m.score?.toFixed(3),
      name: m.metadata?.name,
      isGlutenFree: m.metadata?.isGlutenFree,
    }))
  });

  // Parse results and filter by threshold
  const retrievedItems: RetrievedContext[] = [];

  for (const match of results.matches || []) {
    if (match.score && match.score >= SIMILARITY_THRESHOLD && match.metadata) {
      try {
        const fullItem = JSON.parse(match.metadata.fullItem as string) as MenuItem;
        retrievedItems.push({
          item: fullItem,
          score: match.score,
        });
      } catch (e) {
        console.warn('Failed to parse menu item from metadata:', e);
      }
    }
  }

  // DEBUG: Log filtered results
  console.log('✅ Items after threshold filter:', retrievedItems.length);

  return retrievedItems;
}

/**
 * Format retrieved menu items into context for the LLM
 */
function formatMenuContext(items: RetrievedContext[]): string {
  if (items.length === 0) {
    return 'No specific menu items matched the query. Please inform the customer you need more details about what they\'re looking for.';
  }

  const contextParts = items.map(({ item, score }) => {
    const tags: string[] = [];
    if (item.isGlutenFree) tags.push('[GF]');
    if (item.isVegetarian) tags.push('[V]');
    if (item.isVegan) tags.push('[VG]');
    if (item.isDairyFree) tags.push('[DF]');
    if (item.isSpicy) tags.push('[Spicy]');
    if (item.containsNuts) tags.push('[Contains Nuts]');

    return `
**${item.name}** ${tags.join(' ')} - $${item.price.toFixed(2)}
${item.description}
Ingredients: ${item.ingredients.join(', ')}
${item.allergens.length > 0 ? `Allergens: ${item.allergens.join(', ')}` : ''}
${item.pairings ? `Pairs with: ${item.pairings.join(', ')}` : ''}
${item.chefNote ? `Chef's note: ${item.chefNote}` : ''}
Category: ${item.category}
    `.trim();
  });

  return `## Available Menu Items (Most Relevant to Query)\n\n${contextParts.join('\n\n---\n\n')}`;
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

  if (/what (should|would you recommend|do you suggest)/i.test(message)) {
    return 'recommendation';
  }
  if (/gluten.?free|vegetarian|vegan|dairy.?free|allerg/i.test(message)) {
    return 'dietary_inquiry';
  }
  if (/tell me (about|more)|what('s| is) (the|in)/i.test(message)) {
    return 'item_details';
  }
  if (/how much|price|cost/i.test(message)) {
    return 'price_inquiry';
  }
  if (/pair|goes? with|complement|wine/i.test(message)) {
    return 'pairing_request';
  }
  if (/do you have|is there|any/i.test(message)) {
    return 'availability';
  }
  if (!/food|eat|dish|menu|hungry|appetizer|main|dessert|drink|order/i.test(message)) {
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

  // Detect vegetarian queries
  if (/vegetarian|no meat|meatless|meat.?free/i.test(lowerMessage) && !/vegan/i.test(lowerMessage)) {
    filters.vegetarian = true;
  }

  // Detect vegan queries
  if (/vegan|plant.?based|no animal/i.test(lowerMessage)) {
    filters.vegan = true;
  }

  // Detect dairy-free queries
  if (/dairy.?free|no dairy|lactose|without dairy/i.test(lowerMessage)) {
    filters.dairyFree = true;
  }

  // Detect nut-free queries
  if (/nut.?free|no nuts|nut allergy|without nuts/i.test(lowerMessage)) {
    filters.noNuts = true;
  }

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
      temperature: 0.4, // Balanced: some creativity but mostly factual
      max_tokens: 400, // Keep responses concise
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
