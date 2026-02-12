module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/punycode [external] (punycode, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/string_decoder [external] (string_decoder, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("string_decoder", () => require("string_decoder"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/node:stream/web [external] (node:stream/web, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:stream/web", () => require("node:stream/web"));

module.exports = mod;
}),
"[project]/src/services/ragService.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createAnalyticsRecord",
    ()=>createAnalyticsRecord,
    "healthCheck",
    ()=>healthCheck,
    "processChat",
    ()=>processChat
]);
/**
 * RAG Query Service
 *
 * This service handles:
 * 1. Semantic search against the menu vector database
 * 2. Context assembly for the LLM
 * 3. Response generation with grounding
 *
 * This is the core "intelligence" of the chatbot.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$pinecone$2d$database$2f$pinecone$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@pinecone-database/pinecone/dist/index.js [app-route] (ecmascript)");
;
;
// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
}
if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY environment variable is not set');
}
// Initialize clients
const openai = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["OpenAI"]({
    apiKey: process.env.OPENAI_API_KEY
});
const pinecone = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$pinecone$2d$database$2f$pinecone$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Pinecone"]({
    apiKey: process.env.PINECONE_API_KEY
});
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
 */ const SYSTEM_PROMPT = `You are a friendly and knowledgeable menu assistant at [RESTAURANT_NAME]. Your role is to help customers discover dishes they'll love based on their preferences, dietary needs, and curiosity about our menu.

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
 */ async function createQueryEmbedding(query) {
    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: query
    });
    return response.data[0].embedding;
}
/**
 * Retrieve relevant menu items based on the query
 */ async function retrieveMenuItems(query, filters) {
    const index = pinecone.index(INDEX_NAME);
    // Create query embedding
    const queryEmbedding = await createQueryEmbedding(query);
    // Build metadata filter if dietary restrictions specified
    const metadataFilter = {};
    if (filters) {
        if (filters.glutenFree) metadataFilter.isGlutenFree = true;
        if (filters.vegetarian) metadataFilter.isVegetarian = true;
        if (filters.vegan) metadataFilter.isVegan = true;
        if (filters.dairyFree) metadataFilter.isDairyFree = true;
        if (filters.noNuts) metadataFilter.containsNuts = false;
    }
    // DEBUG: Log the query and filters
    console.log('🔍 RAG Query:', {
        query,
        filters,
        metadataFilter
    });
    // Query Pinecone
    const results = await index.query({
        vector: queryEmbedding,
        topK: TOP_K_RESULTS,
        includeMetadata: true,
        filter: Object.keys(metadataFilter).length > 0 ? metadataFilter : undefined
    });
    // DEBUG: Log raw Pinecone results
    console.log('📊 Pinecone Results:', {
        matchCount: results.matches?.length || 0,
        matches: results.matches?.map((m)=>({
                id: m.id,
                score: m.score?.toFixed(3),
                name: m.metadata?.name,
                isGlutenFree: m.metadata?.isGlutenFree
            }))
    });
    // Parse results and filter by threshold
    const retrievedItems = [];
    for (const match of results.matches || []){
        if (match.score && match.score >= SIMILARITY_THRESHOLD && match.metadata) {
            try {
                const fullItem = JSON.parse(match.metadata.fullItem);
                retrievedItems.push({
                    item: fullItem,
                    score: match.score
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
 */ function formatMenuContext(items) {
    if (items.length === 0) {
        return 'No specific menu items matched the query. Please inform the customer you need more details about what they\'re looking for.';
    }
    const contextParts = items.map(({ item, score })=>{
        const tags = [];
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
 * Build the messages array for the chat completion
 */ function buildMessages(systemPrompt, menuContext, userMessage, conversationHistory) {
    const messages = [
        {
            role: 'system',
            content: `${systemPrompt}\n\n---\n\n## Current Menu Context\n\n${menuContext}`
        }
    ];
    // Add conversation history (limited to recent messages)
    if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
        for (const msg of recentHistory){
            if (msg.role === 'user' || msg.role === 'assistant') {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        }
    }
    // Add current user message
    messages.push({
        role: 'user',
        content: userMessage
    });
    return messages;
}
/**
 * Detect the intent of the user's message (for analytics)
 */ function detectIntent(message) {
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
 */ function detectDietaryFiltersFromMessage(message) {
    const lowerMessage = message.toLowerCase();
    const filters = {};
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
async function processChat(request) {
    const startTime = Date.now();
    try {
        // Step 1: Determine dietary filters
        // Use explicit filters if provided, otherwise auto-detect from message
        const dietaryFilters = request.dietaryFilters || detectDietaryFiltersFromMessage(request.message);
        // Step 2: Retrieve relevant menu items
        const retrievedContext = await retrieveMenuItems(request.message, dietaryFilters);
        // Step 3: Format context for the LLM
        const menuContext = formatMenuContext(retrievedContext);
        // Step 4: Build messages array
        const messages = buildMessages(SYSTEM_PROMPT, menuContext, request.message, request.conversationHistory);
        // Step 5: Generate response
        const completion = await openai.chat.completions.create({
            model: CHAT_MODEL,
            messages,
            temperature: 0.4,
            max_tokens: 400,
            presence_penalty: 0.1
        });
        const assistantMessage = completion.choices[0]?.message?.content || "I apologize, but I'm having trouble processing your request. Could you please try again?";
        const processingTimeMs = Date.now() - startTime;
        return {
            message: assistantMessage,
            retrievedItems: retrievedContext.map((rc)=>rc.item),
            suggestedItems: retrievedContext.slice(0, 3).map((rc)=>rc.item),
            processingTimeMs
        };
    } catch (error) {
        console.error('RAG processing error:', error);
        throw new Error('Failed to process chat request');
    }
}
function createAnalyticsRecord(request, response, sessionId) {
    const dietaryMentions = [];
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
        retrievedItemIds: response.retrievedItems?.map((item)=>item.id) || [],
        responseTimeMs: response.processingTimeMs || 0,
        timestamp: new Date(),
        detectedIntent: detectIntent(request.message),
        mentionedDietaryNeeds: dietaryMentions
    };
}
async function healthCheck() {
    let openaiOk = false;
    let pineconeOk = false;
    let indexStats = null;
    try {
        // Test OpenAI
        await openai.models.list();
        openaiOk = true;
    } catch (e) {
        console.error('OpenAI health check failed:', e);
    }
    try {
        // Test Pinecone
        const index = pinecone.index(INDEX_NAME);
        const stats = await index.describeIndexStats();
        pineconeOk = true;
        indexStats = {
            totalVectors: stats.totalRecordCount || 0
        };
    } catch (e) {
        console.error('Pinecone health check failed:', e);
    }
    return {
        openai: openaiOk,
        pinecone: pineconeOk,
        indexStats
    };
}
}),
"[project]/src/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
/**
 * Chat API Route
 *
 * POST /api/chat
 *
 * Handles customer chat requests to the AI menu assistant.
 * This is the main endpoint the frontend calls.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ragService$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/ragService.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const body = await request.json();
        // Validate required fields
        if (!body.message || typeof body.message !== 'string') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Message is required and must be a string'
            }, {
                status: 400
            });
        }
        // Sanitize and limit message length
        const sanitizedMessage = body.message.trim().slice(0, 1000);
        if (sanitizedMessage.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Message cannot be empty'
            }, {
                status: 400
            });
        }
        // Build chat request
        const chatRequest = {
            message: sanitizedMessage,
            conversationHistory: validateConversationHistory(body.conversationHistory),
            tableId: body.tableId,
            sessionId: body.sessionId || generateSessionId(),
            dietaryFilters: body.dietaryFilters
        };
        // Process the chat
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ragService$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["processChat"])(chatRequest);
        // Create analytics record (async, don't block response)
        const analytics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ragService$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createAnalyticsRecord"])(chatRequest, response, chatRequest.sessionId);
        // Store analytics (fire and forget)
        storeAnalytics(analytics).catch((err)=>console.error('Failed to store analytics:', err));
        // Return response
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: response.message,
            suggestedItems: response.suggestedItems?.map((item)=>({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    category: item.category,
                    description: item.description
                })),
            processingTimeMs: response.processingTimeMs
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Chat API error:', errorMessage);
        console.error('Full error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'An error occurred while processing your request',
            details: ("TURBOPACK compile-time truthy", 1) ? errorMessage : "TURBOPACK unreachable"
        }, {
            status: 500
        });
    }
}
/**
 * Validate and sanitize conversation history
 */ function validateConversationHistory(history) {
    if (!Array.isArray(history)) return undefined;
    return history.filter((msg)=>typeof msg === 'object' && msg !== null && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string').slice(-10) // Limit to last 10 messages
    .map((msg)=>({
            role: msg.role,
            content: msg.content.slice(0, 1000)
        }));
}
/**
 * Generate a session ID for tracking conversations
 */ function generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Store analytics record
 * Replace this with your actual database implementation
 */ async function storeAnalytics(analytics) {
    // Example with Supabase:
    // await db.from('chat_analytics').insert(analytics);
    // Example with PostgreSQL:
    // await db.query(
    //   'INSERT INTO chat_analytics (id, session_id, user_message, ...) VALUES ($1, $2, ...)',
    //   [analytics.id, analytics.sessionId, analytics.userMessage, ...]
    // );
    // For now, just log
    console.log('Analytics:', {
        intent: analytics.detectedIntent,
        dietaryMentions: analytics.mentionedDietaryNeeds,
        responseTime: analytics.responseTimeMs
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__175ed5c3._.js.map