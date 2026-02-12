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
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[project]/src/lib/stripe.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "STRIPE_PUBLISHABLE_KEY",
    ()=>STRIPE_PUBLISHABLE_KEY,
    "STRIPE_WEBHOOK_SECRET",
    ()=>STRIPE_WEBHOOK_SECRET,
    "stripe",
    ()=>stripe
]);
/**
 * Stripe Configuration
 *
 * Initializes Stripe client for server-side operations.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$stripe$2f$esm$2f$stripe$2e$esm$2e$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/stripe/esm/stripe.esm.node.js [app-route] (ecmascript)");
;
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}
const stripe = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$stripe$2f$esm$2f$stripe$2e$esm$2e$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"](process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true
});
const STRIPE_PUBLISHABLE_KEY = ("TURBOPACK compile-time value", "pk_test_51SvU8TBwzEO3WwsT1CGXpeaaW5iI58uA84M8HYeV9gtqlj0bxFClgDlF0Z0aneW8ZJBGGnfsQEKMfNzoCZx3Hes300OvMlzkqo");
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
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
"[project]/src/app/api/checkout/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
/**
 * Checkout API Route
 *
 * POST /api/checkout
 *
 * Creates a Stripe Checkout Session for the customer's order.
 * If orderId is provided, links to existing order; otherwise creates new order.
 * Returns the session URL for redirecting to Stripe's hosted checkout.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stripe$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/stripe.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db/orders.ts [app-route] (ecmascript)");
;
;
;
async function POST(request) {
    try {
        const body = await request.json();
        // Validate request
        if (!body.items || body.items.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Cart is empty'
            }, {
                status: 400
            });
        }
        if (!body.tableId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Table ID is required'
            }, {
                status: 400
            });
        }
        // Calculate totals
        const subtotal = body.items.reduce((sum, item)=>sum + item.price * item.quantity, 0);
        const taxRate = 0.0875; // 8.75% tax
        const tax = subtotal * taxRate;
        const total = subtotal + tax;
        // Get or create order
        let orderId = body.orderId;
        if (!orderId) {
            // Create order in database
            const order = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createOrder"])({
                tableId: body.tableId,
                items: body.items.map((item)=>({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        notes: item.notes
                    })),
                specialInstructions: body.specialInstructions,
                chatSessionId: body.chatSessionId
            });
            orderId = order.id;
            console.log('Order created:', orderId);
        } else {
            // Verify order exists
            const existingOrder = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getOrderById"])(orderId);
            if (!existingOrder) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Order not found'
                }, {
                    status: 404
                });
            }
        }
        // Create line items for Stripe
        const lineItems = body.items.map((item)=>({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        description: item.description || undefined,
                        metadata: {
                            menuItemId: item.id
                        }
                    },
                    unit_amount: Math.round(item.price * 100)
                },
                quantity: item.quantity
            }));
        // Add tax as a line item
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Tax',
                    description: 'Sales tax (8.75%)',
                    metadata: {
                        menuItemId: 'tax'
                    }
                },
                unit_amount: Math.round(tax * 100)
            },
            quantity: 1
        });
        // Get the base URL for redirects
        const baseUrl = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
        // Create Stripe Checkout Session
        const session = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stripe$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stripe"].checkout.sessions.create({
            payment_method_types: [
                'card'
            ],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${baseUrl}/order/confirmation?session_id={CHECKOUT_SESSION_ID}&table=${body.tableId}&order=${orderId}`,
            cancel_url: `${baseUrl}/order?table=${body.tableId}&canceled=true`,
            customer_email: body.customerEmail || undefined,
            metadata: {
                orderId,
                tableId: body.tableId,
                specialInstructions: body.specialInstructions || '',
                itemCount: String(body.items.length),
                orderItems: JSON.stringify(body.items.map((i)=>({
                        id: i.id,
                        name: i.name,
                        qty: i.quantity
                    })))
            },
            // Collect phone number for order updates
            phone_number_collection: {
                enabled: true
            },
            // Allow promo codes
            allow_promotion_codes: true,
            // Set expiration (30 minutes)
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60
        });
        // Update order with Stripe session ID
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateOrderStripeSession"])(orderId, session.id);
        console.log('Order linked to Stripe session:', orderId, session.id);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            sessionId: session.id,
            orderId,
            url: session.url,
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error('Checkout error:', error);
        if (error instanceof Error) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: error.message
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to create checkout session'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b1d505ce._.js.map