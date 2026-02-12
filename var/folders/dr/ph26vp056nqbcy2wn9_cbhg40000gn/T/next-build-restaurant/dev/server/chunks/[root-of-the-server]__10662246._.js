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
"[project]/src/types/orders.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Order Type Definitions
 *
 * Shared types for orders across the application.
 */ __turbopack_context__.s([
    "canTransitionTo",
    ()=>canTransitionTo,
    "isKDSStatus",
    ()=>isKDSStatus,
    "validStatusTransitions",
    ()=>validStatusTransitions
]);
const validStatusTransitions = {
    pending: [
        'confirmed',
        'cancelled'
    ],
    confirmed: [
        'preparing',
        'cancelled'
    ],
    preparing: [
        'ready',
        'cancelled'
    ],
    ready: [
        'served',
        'cancelled'
    ],
    served: [
        'paid'
    ],
    paid: [],
    cancelled: []
};
function canTransitionTo(currentStatus, newStatus) {
    return validStatusTransitions[currentStatus]?.includes(newStatus) ?? false;
}
function isKDSStatus(status) {
    return [
        'pending',
        'preparing',
        'ready'
    ].includes(status);
}
}),
"[project]/src/lib/db/orders.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cancelOrder",
    ()=>cancelOrder,
    "clearAllOrders",
    ()=>clearAllOrders,
    "confirmOrderPayment",
    ()=>confirmOrderPayment,
    "createOrder",
    ()=>createOrder,
    "deleteOrder",
    ()=>deleteOrder,
    "getActiveOrders",
    ()=>getActiveOrders,
    "getOrderById",
    ()=>getOrderById,
    "getOrderByStripeSessionId",
    ()=>getOrderByStripeSessionId,
    "getOrderStats",
    ()=>getOrderStats,
    "listOrders",
    ()=>listOrders,
    "ordersStore",
    ()=>orders,
    "updateOrderStatus",
    ()=>updateOrderStatus,
    "updateOrderStripeSession",
    ()=>updateOrderStripeSession
]);
/**
 * Orders Database Store
 *
 * In-memory order storage with persistence simulation.
 * In production, replace with Prisma, Drizzle, or direct database calls.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/orders.ts [app-route] (ecmascript)");
;
// In-memory store
const orders = new Map();
// Generate unique order ID
function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ORD-${timestamp}-${random}`.toUpperCase();
}
// Generate unique item ID
function generateItemId() {
    return `ITEM-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
}
async function createOrder(data) {
    const orderId = generateOrderId();
    const now = new Date();
    // Calculate totals
    const subtotal = data.items.reduce((sum, item)=>sum + item.price * item.quantity, 0);
    const taxRate = 0.0875; // 8.75%
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    const orderItems = data.items.map((item)=>({
            id: generateItemId(),
            menuItemId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes
        }));
    const order = {
        id: orderId,
        tableId: data.tableId,
        items: orderItems,
        status: 'pending',
        paymentStatus: 'pending',
        priority: data.priority || 'normal',
        subtotal,
        tax,
        total,
        specialInstructions: data.specialInstructions,
        chatSessionId: data.chatSessionId,
        createdAt: now,
        updatedAt: now
    };
    orders.set(orderId, order);
    console.log(`[DB] Order created: ${orderId}`);
    return order;
}
async function getOrderById(orderId) {
    return orders.get(orderId) || null;
}
async function getOrderByStripeSessionId(sessionId) {
    for (const order of orders.values()){
        if (order.stripeSessionId === sessionId) {
            return order;
        }
    }
    return null;
}
async function updateOrderStripeSession(orderId, stripeSessionId) {
    const order = orders.get(orderId);
    if (!order) return null;
    order.stripeSessionId = stripeSessionId;
    order.updatedAt = new Date();
    orders.set(orderId, order);
    console.log(`[DB] Order ${orderId} linked to Stripe session: ${stripeSessionId}`);
    return order;
}
async function confirmOrderPayment(orderId, stripePaymentIntentId, customerEmail, customerPhone) {
    const order = orders.get(orderId);
    if (!order) return null;
    order.status = 'confirmed';
    order.paymentStatus = 'paid';
    order.stripePaymentIntentId = stripePaymentIntentId;
    order.customerEmail = customerEmail || order.customerEmail;
    order.customerPhone = customerPhone || order.customerPhone;
    order.confirmedAt = new Date();
    order.updatedAt = new Date();
    orders.set(orderId, order);
    console.log(`[DB] Order ${orderId} payment confirmed`);
    return order;
}
async function updateOrderStatus(orderId, newStatus, validate = true) {
    const order = orders.get(orderId);
    if (!order) return null;
    // Validate transition
    if (validate && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["canTransitionTo"])(order.status, newStatus)) {
        console.error(`[DB] Invalid status transition: ${order.status} -> ${newStatus}`);
        return null;
    }
    const now = new Date();
    order.status = newStatus;
    order.updatedAt = now;
    // Record timestamps for specific statuses
    switch(newStatus){
        case 'confirmed':
            order.confirmedAt = now;
            break;
        case 'preparing':
            order.preparedAt = now;
            break;
        case 'ready':
            order.readyAt = now;
            break;
        case 'served':
            order.servedAt = now;
            break;
    }
    orders.set(orderId, order);
    console.log(`[DB] Order ${orderId} status updated: ${newStatus}`);
    return order;
}
async function listOrders(options) {
    let result = Array.from(orders.values());
    // Filter by status
    if (options?.status) {
        const statuses = Array.isArray(options.status) ? options.status : [
            options.status
        ];
        result = result.filter((order)=>statuses.includes(order.status));
    }
    // Filter by table
    if (options?.tableId) {
        result = result.filter((order)=>order.tableId === options.tableId);
    }
    // Sort
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';
    result.sort((a, b)=>{
        const aVal = new Date(a[sortBy]).getTime();
        const bVal = new Date(b[sortBy]).getTime();
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    const total = result.length;
    // Pagination
    if (options?.offset) {
        result = result.slice(options.offset);
    }
    if (options?.limit) {
        result = result.slice(0, options.limit);
    }
    return {
        orders: result,
        total
    };
}
async function getActiveOrders() {
    const activeStatuses = [
        'pending',
        'confirmed',
        'preparing',
        'ready'
    ];
    const result = await listOrders({
        status: activeStatuses
    });
    return result.orders;
}
async function cancelOrder(orderId) {
    return updateOrderStatus(orderId, 'cancelled', false);
}
async function deleteOrder(orderId) {
    return orders.delete(orderId);
}
async function clearAllOrders() {
    orders.clear();
    console.log('[DB] All orders cleared');
}
async function getOrderStats() {
    const all = Array.from(orders.values());
    return {
        total: all.length,
        pending: all.filter((o)=>o.status === 'pending' || o.status === 'confirmed').length,
        preparing: all.filter((o)=>o.status === 'preparing').length,
        ready: all.filter((o)=>o.status === 'ready').length,
        completed: all.filter((o)=>o.status === 'served' || o.status === 'paid').length
    };
}
;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

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
"[project]/src/lib/websocket/emit.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "emitNewOrder",
    ()=>emitNewOrder,
    "emitOrderEvent",
    ()=>emitOrderEvent,
    "emitStatusUpdate",
    ()=>emitStatusUpdate
]);
/**
 * WebSocket Event Emitter
 *
 * Utility for emitting events to the WebSocket server from backend code.
 * Used by webhooks and API routes to broadcast real-time updates.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ws$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/ws/wrapper.mjs [app-route] (ecmascript) <locals>");
;
const WS_URL = process.env.WS_INTERNAL_URL || 'ws://localhost:3002';
async function emitOrderEvent(event) {
    return new Promise((resolve)=>{
        try {
            const ws = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ws$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"](`${WS_URL}?type=manager`);
            ws.on('open', ()=>{
                ws.send(JSON.stringify(event));
                ws.close();
                resolve(true);
            });
            ws.on('error', (error)=>{
                console.error('Failed to emit WebSocket event:', error);
                resolve(false);
            });
            // Timeout after 5 seconds
            setTimeout(()=>{
                if (ws.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ws$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].OPEN) {
                    ws.close();
                }
                resolve(false);
            }, 5000);
        } catch (error) {
            console.error('Failed to connect to WebSocket server:', error);
            resolve(false);
        }
    });
}
async function emitNewOrder(order) {
    return emitOrderEvent({
        type: 'new_order',
        order,
        orderId: order.id,
        tableId: order.tableId
    });
}
async function emitStatusUpdate(orderId, status, tableId) {
    return emitOrderEvent({
        type: 'status_update',
        orderId,
        status,
        tableId
    });
}
const __TURBOPACK__default__export__ = {
    emitOrderEvent,
    emitNewOrder,
    emitStatusUpdate
};
}),
"[project]/src/app/api/orders/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
/**
 * Orders API Route
 *
 * GET /api/orders - List orders with optional filters
 * POST /api/orders - Create a new order
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db/orders.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$websocket$2f$emit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/websocket/emit.ts [app-route] (ecmascript)");
;
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const statusParam = searchParams.get('status');
        const tableId = searchParams.get('tableId');
        const active = searchParams.get('active');
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');
        // If requesting active orders (for KDS)
        if (active === 'true') {
            const orders = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getActiveOrders"])();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                orders,
                total: orders.length
            });
        }
        // Parse status filter
        let status;
        if (statusParam) {
            const statuses = statusParam.split(',');
            status = statuses.length === 1 ? statuses[0] : statuses;
        }
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["listOrders"])({
            status,
            tableId: tableId || undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(result);
    } catch (error) {
        console.error('Error listing orders:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to list orders'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        // Validate request
        if (!body.tableId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'tableId is required'
            }, {
                status: 400
            });
        }
        if (!body.items || body.items.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'At least one item is required'
            }, {
                status: 400
            });
        }
        // Validate items
        for (const item of body.items){
            if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Each item must have id, name, price, and quantity'
                }, {
                    status: 400
                });
            }
        }
        // Create the order
        const order = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createOrder"])(body);
        // Emit WebSocket event for real-time updates
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$websocket$2f$emit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emitNewOrder"])({
                id: order.id,
                tableId: order.tableId,
                items: order.items.map((item)=>({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        specialInstructions: item.notes
                    })),
                status: order.status,
                priority: order.priority,
                createdAt: order.createdAt
            });
        } catch (wsError) {
            console.warn('WebSocket emit failed (server may not be running):', wsError);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            order
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to create order'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__10662246._.js.map