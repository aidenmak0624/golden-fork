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
"[project]/src/lib/db/feedback.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Feedback Database (In-Memory)
 *
 * Stores customer feedback and reviews.
 * Can be swapped for a real database in production.
 */ __turbopack_context__.s([
    "createFeedback",
    ()=>createFeedback,
    "getAIInsights",
    ()=>getAIInsights,
    "getChatLogs",
    ()=>getChatLogs,
    "getFeedbackById",
    ()=>getFeedbackById,
    "getFeedbackByOrderId",
    ()=>getFeedbackByOrderId,
    "getFeedbackStats",
    ()=>getFeedbackStats,
    "listFeedback",
    ()=>listFeedback,
    "logChat",
    ()=>logChat,
    "seedTestData",
    ()=>seedTestData
]);
// Generate unique IDs
function generateId(prefix) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
// In-memory stores
const feedbackStore = new Map();
const chatLogStore = new Map();
function createFeedback(data) {
    const feedback = {
        id: generateId('FB'),
        orderId: data.orderId,
        tableId: data.tableId,
        rating: data.rating,
        foodRating: data.foodRating,
        serviceRating: data.serviceRating,
        ambienceRating: data.ambienceRating,
        comment: data.comment,
        menuItemFeedback: data.menuItemFeedback || [],
        wouldRecommend: data.wouldRecommend,
        createdAt: new Date()
    };
    feedbackStore.set(feedback.id, feedback);
    return feedback;
}
function getFeedbackById(id) {
    return feedbackStore.get(id);
}
function getFeedbackByOrderId(orderId) {
    for (const feedback of feedbackStore.values()){
        if (feedback.orderId === orderId) {
            return feedback;
        }
    }
    return undefined;
}
function listFeedback(options) {
    let feedbackList = Array.from(feedbackStore.values());
    // Sort by creation date (newest first)
    feedbackList.sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // Apply filters
    if (options?.minRating) {
        feedbackList = feedbackList.filter((f)=>f.rating >= options.minRating);
    }
    if (options?.maxRating) {
        feedbackList = feedbackList.filter((f)=>f.rating <= options.maxRating);
    }
    // Apply limit
    if (options?.limit) {
        feedbackList = feedbackList.slice(0, options.limit);
    }
    return feedbackList;
}
function getFeedbackStats() {
    const feedbackList = Array.from(feedbackStore.values());
    if (feedbackList.length === 0) {
        return {
            totalReviews: 0,
            averageRating: 0,
            averageFoodRating: 0,
            averageServiceRating: 0,
            averageAmbienceRating: 0,
            recommendationRate: 0,
            ratingDistribution: {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            },
            recentTrend: 'stable',
            trendPercentage: 0
        };
    }
    const totalReviews = feedbackList.length;
    const averageRating = feedbackList.reduce((sum, f)=>sum + f.rating, 0) / totalReviews;
    const foodRatings = feedbackList.filter((f)=>f.foodRating).map((f)=>f.foodRating);
    const serviceRatings = feedbackList.filter((f)=>f.serviceRating).map((f)=>f.serviceRating);
    const ambienceRatings = feedbackList.filter((f)=>f.ambienceRating).map((f)=>f.ambienceRating);
    const averageFoodRating = foodRatings.length > 0 ? foodRatings.reduce((sum, r)=>sum + r, 0) / foodRatings.length : 0;
    const averageServiceRating = serviceRatings.length > 0 ? serviceRatings.reduce((sum, r)=>sum + r, 0) / serviceRatings.length : 0;
    const averageAmbienceRating = ambienceRatings.length > 0 ? ambienceRatings.reduce((sum, r)=>sum + r, 0) / ambienceRatings.length : 0;
    const recommendCount = feedbackList.filter((f)=>f.wouldRecommend).length;
    const recommendationRate = recommendCount / totalReviews * 100;
    // Rating distribution
    const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
    };
    feedbackList.forEach((f)=>{
        ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
    });
    // Calculate trend (compare last 7 days to previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentFeedback = feedbackList.filter((f)=>new Date(f.createdAt) >= sevenDaysAgo);
    const previousFeedback = feedbackList.filter((f)=>new Date(f.createdAt) >= fourteenDaysAgo && new Date(f.createdAt) < sevenDaysAgo);
    const recentAvg = recentFeedback.length > 0 ? recentFeedback.reduce((sum, f)=>sum + f.rating, 0) / recentFeedback.length : 0;
    const previousAvg = previousFeedback.length > 0 ? previousFeedback.reduce((sum, f)=>sum + f.rating, 0) / previousFeedback.length : 0;
    let recentTrend = 'stable';
    let trendPercentage = 0;
    if (previousAvg > 0) {
        trendPercentage = (recentAvg - previousAvg) / previousAvg * 100;
        if (trendPercentage > 5) recentTrend = 'up';
        else if (trendPercentage < -5) recentTrend = 'down';
    }
    return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        averageFoodRating: Math.round(averageFoodRating * 10) / 10,
        averageServiceRating: Math.round(averageServiceRating * 10) / 10,
        averageAmbienceRating: Math.round(averageAmbienceRating * 10) / 10,
        recommendationRate: Math.round(recommendationRate),
        ratingDistribution,
        recentTrend,
        trendPercentage: Math.round(trendPercentage)
    };
}
function logChat(entry) {
    const chatLog = {
        id: generateId('CHAT'),
        ...entry,
        timestamp: new Date()
    };
    chatLogStore.set(chatLog.id, chatLog);
    return chatLog;
}
function getChatLogs(options) {
    let logs = Array.from(chatLogStore.values());
    // Sort by timestamp (newest first)
    logs.sort((a, b)=>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    // Filter by table
    if (options?.tableId) {
        logs = logs.filter((l)=>l.tableId === options.tableId);
    }
    // Apply limit
    if (options?.limit) {
        logs = logs.slice(0, options.limit);
    }
    return logs;
}
function getAIInsights() {
    const chatLogs = getChatLogs({
        limit: 100
    });
    const feedbackList = listFeedback({
        limit: 100
    });
    // Generate recent chats for display
    const recentChats = chatLogs.slice(0, 20).map((log)=>({
            id: log.id,
            userMessage: log.userMessage,
            intent: log.intent || 'general',
            dietaryMentions: log.dietaryMentions,
            timestamp: log.timestamp,
            tableId: log.tableId
        }));
    // Analyze dietary trends from chat logs
    const dietaryCounts = {};
    chatLogs.forEach((log)=>{
        log.dietaryMentions.forEach((mention)=>{
            dietaryCounts[mention] = (dietaryCounts[mention] || 0) + 1;
        });
    });
    const dietaryTrends = Object.entries(dietaryCounts).map(([term, count])=>({
            term,
            count,
            trend: count > 10 ? 'up' : count > 5 ? 'stable' : 'down',
            percentChange: Math.floor(Math.random() * 30) - 5
        })).sort((a, b)=>b.count - a.count).slice(0, 5);
    // Find unmatched requests (items asked for but not on menu)
    const unmatchedCounts = {};
    chatLogs.forEach((log)=>{
        if (log.intent === 'item_not_found' || log.userMessage.toLowerCase().includes('do you have')) {
            // Extract potential item from message
            const match = log.userMessage.match(/(?:do you have|looking for|want)\s+(.+?)(?:\?|$)/i);
            if (match) {
                const item = match[1].trim();
                unmatchedCounts[item] = (unmatchedCounts[item] || 0) + 1;
            }
        }
    });
    const unmatchedRequests = Object.entries(unmatchedCounts).map(([term, count])=>({
            term,
            count,
            trend: 'stable'
        })).sort((a, b)=>b.count - a.count).slice(0, 5);
    // Popular queries
    const queryCounts = {};
    chatLogs.forEach((log)=>{
        // Normalize and count similar queries
        const normalized = log.userMessage.toLowerCase().substring(0, 50);
        queryCounts[normalized] = (queryCounts[normalized] || 0) + 1;
    });
    const popularQueries = Object.entries(queryCounts).filter(([_, count])=>count > 1).map(([term, count])=>({
            term: term.charAt(0).toUpperCase() + term.slice(1),
            count,
            trend: 'stable'
        })).sort((a, b)=>b.count - a.count).slice(0, 5);
    // Generate feedback insights
    const feedbackInsights = [];
    // Positive feedback patterns
    const highRatedFeedback = feedbackList.filter((f)=>f.rating >= 4);
    if (highRatedFeedback.length > 0) {
        const positiveComments = highRatedFeedback.filter((f)=>f.comment).map((f)=>f.comment);
        if (positiveComments.length > 0) {
            feedbackInsights.push({
                type: 'positive',
                category: 'Overall Experience',
                message: `${highRatedFeedback.length} customers rated 4+ stars`,
                count: highRatedFeedback.length
            });
        }
    }
    // Negative feedback patterns
    const lowRatedFeedback = feedbackList.filter((f)=>f.rating <= 2);
    if (lowRatedFeedback.length > 0) {
        feedbackInsights.push({
            type: 'negative',
            category: 'Needs Attention',
            message: `${lowRatedFeedback.length} reviews with rating 2 or below`,
            count: lowRatedFeedback.length
        });
    }
    // Menu item specific feedback
    const menuItemRatings = {};
    feedbackList.forEach((f)=>{
        f.menuItemFeedback?.forEach((mf)=>{
            if (!menuItemRatings[mf.menuItemId]) {
                menuItemRatings[mf.menuItemId] = {
                    total: 0,
                    count: 0,
                    name: mf.menuItemName
                };
            }
            menuItemRatings[mf.menuItemId].total += mf.rating;
            menuItemRatings[mf.menuItemId].count += 1;
        });
    });
    // Find top and bottom rated items
    const itemAverages = Object.entries(menuItemRatings).map(([id, data])=>({
            id,
            name: data.name,
            average: data.total / data.count,
            count: data.count
        })).filter((item)=>item.count >= 2);
    const topItems = itemAverages.filter((i)=>i.average >= 4).slice(0, 3);
    const bottomItems = itemAverages.filter((i)=>i.average <= 2.5).slice(0, 3);
    if (topItems.length > 0) {
        feedbackInsights.push({
            type: 'positive',
            category: 'Top Rated Items',
            message: 'Customers love these dishes',
            count: topItems.length,
            menuItems: topItems.map((i)=>i.name)
        });
    }
    if (bottomItems.length > 0) {
        feedbackInsights.push({
            type: 'suggestion',
            category: 'Items to Improve',
            message: 'Consider reviewing these dishes',
            count: bottomItems.length,
            menuItems: bottomItems.map((i)=>i.name)
        });
    }
    return {
        recentChats,
        dietaryTrends: dietaryTrends.length > 0 ? dietaryTrends : getDefaultDietaryTrends(),
        unmatchedRequests: unmatchedRequests.length > 0 ? unmatchedRequests : [],
        popularQueries: popularQueries.length > 0 ? popularQueries : getDefaultPopularQueries(),
        feedbackInsights
    };
}
// Default data when no real data exists
function getDefaultDietaryTrends() {
    return [
        {
            term: 'Gluten-free',
            count: 0,
            trend: 'stable',
            percentChange: 0
        },
        {
            term: 'Vegan',
            count: 0,
            trend: 'stable',
            percentChange: 0
        },
        {
            term: 'Vegetarian',
            count: 0,
            trend: 'stable',
            percentChange: 0
        }
    ];
}
function getDefaultPopularQueries() {
    return [
        {
            term: 'No queries yet',
            count: 0,
            trend: 'stable'
        }
    ];
}
function seedTestData() {
    // Seed some chat logs
    const testChats = [
        {
            userMessage: "What's gluten-free on the menu?",
            dietaryMentions: [
                'gluten-free'
            ],
            intent: 'dietary_inquiry',
            tableId: '5'
        },
        {
            userMessage: "I'm vegan, what do you recommend?",
            dietaryMentions: [
                'vegan'
            ],
            intent: 'recommendation',
            tableId: '8'
        },
        {
            userMessage: 'Do you have any nut-free desserts?',
            dietaryMentions: [
                'nut-free'
            ],
            intent: 'dietary_inquiry',
            tableId: '3'
        },
        {
            userMessage: "What's your most popular dish?",
            dietaryMentions: [],
            intent: 'recommendation',
            tableId: '12'
        },
        {
            userMessage: 'Any dairy-free pasta options?',
            dietaryMentions: [
                'dairy-free'
            ],
            intent: 'dietary_inquiry',
            tableId: '7'
        },
        {
            userMessage: 'Do you have vegan cheese?',
            dietaryMentions: [
                'vegan'
            ],
            intent: 'item_not_found',
            tableId: '2'
        }
    ];
    testChats.forEach((chat)=>{
        logChat({
            sessionId: generateId('SESSION'),
            tableId: chat.tableId,
            userMessage: chat.userMessage,
            assistantResponse: 'Response here...',
            intent: chat.intent,
            dietaryMentions: chat.dietaryMentions,
            menuItemsMentioned: []
        });
    });
    // Seed some feedback
    const testFeedback = [
        {
            orderId: 'ORD-TEST-1',
            tableId: '5',
            rating: 5,
            foodRating: 5,
            serviceRating: 5,
            comment: 'Amazing food!',
            wouldRecommend: true
        },
        {
            orderId: 'ORD-TEST-2',
            tableId: '8',
            rating: 4,
            foodRating: 4,
            serviceRating: 5,
            comment: 'Great service',
            wouldRecommend: true
        },
        {
            orderId: 'ORD-TEST-3',
            tableId: '3',
            rating: 3,
            foodRating: 3,
            serviceRating: 4,
            comment: 'Good but slow',
            wouldRecommend: true
        },
        {
            orderId: 'ORD-TEST-4',
            tableId: '12',
            rating: 5,
            foodRating: 5,
            serviceRating: 4,
            wouldRecommend: true
        },
        {
            orderId: 'ORD-TEST-5',
            tableId: '7',
            rating: 2,
            foodRating: 2,
            serviceRating: 3,
            comment: 'Food was cold',
            wouldRecommend: false
        }
    ];
    testFeedback.forEach((fb)=>createFeedback(fb));
}
}),
"[project]/src/app/api/insights/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
/**
 * AI Insights API Route
 *
 * GET /api/insights - Get AI-generated insights from orders, chats, and feedback
 * POST /api/insights/chat-log - Log a chat interaction for analytics
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$feedback$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db/feedback.ts [app-route] (ecmascript)");
;
;
// Seed test data on first load (for demo purposes)
let seeded = false;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const seed = searchParams.get('seed') === 'true';
        // Optionally seed test data
        if (seed && !seeded) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$feedback$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seedTestData"])();
            seeded = true;
        }
        const insights = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$feedback$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAIInsights"])();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            insights
        });
    } catch (error) {
        console.error('Error getting AI insights:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to get AI insights'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        // Validate required fields
        if (!body.sessionId || !body.userMessage || !body.assistantResponse) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'sessionId, userMessage, and assistantResponse are required'
            }, {
                status: 400
            });
        }
        // Log the chat
        const chatLog = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$feedback$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logChat"])({
            sessionId: body.sessionId,
            tableId: body.tableId,
            userMessage: body.userMessage,
            assistantResponse: body.assistantResponse,
            intent: body.intent,
            dietaryMentions: body.dietaryMentions || [],
            menuItemsMentioned: body.menuItemsMentioned || []
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            chatLog
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Error logging chat:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to log chat'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__91e70fc6._.js.map