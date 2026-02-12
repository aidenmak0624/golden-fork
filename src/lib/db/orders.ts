/**
 * Orders Database Store
 *
 * In-memory order storage with persistence simulation.
 * In production, replace with Prisma, Drizzle, or direct database calls.
 */

import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  OrderPriority,
  CreateOrderRequest,
  canTransitionTo,
} from '../../types/orders';

// In-memory store
const orders: Map<string, Order> = new Map();

// Generate unique order ID
function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

// Generate unique item ID
function generateItemId(): string {
  return `ITEM-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
}

/**
 * Create a new order
 */
export async function createOrder(data: CreateOrderRequest): Promise<Order> {
  const orderId = generateOrderId();
  const now = new Date();

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.0875; // 8.75%
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const orderItems: OrderItem[] = data.items.map((item) => ({
    id: generateItemId(),
    menuItemId: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    notes: item.notes,
  }));

  const order: Order = {
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
    updatedAt: now,
  };

  orders.set(orderId, order);
  console.log(`[DB] Order created: ${orderId}`);

  return order;
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  return orders.get(orderId) || null;
}

/**
 * Get order by Stripe session ID
 */
export async function getOrderByStripeSessionId(sessionId: string): Promise<Order | null> {
  for (const order of orders.values()) {
    if (order.stripeSessionId === sessionId) {
      return order;
    }
  }
  return null;
}

/**
 * Update order with Stripe session info
 */
export async function updateOrderStripeSession(
  orderId: string,
  stripeSessionId: string
): Promise<Order | null> {
  const order = orders.get(orderId);
  if (!order) return null;

  order.stripeSessionId = stripeSessionId;
  order.updatedAt = new Date();
  orders.set(orderId, order);

  console.log(`[DB] Order ${orderId} linked to Stripe session: ${stripeSessionId}`);
  return order;
}

/**
 * Confirm order payment
 */
export async function confirmOrderPayment(
  orderId: string,
  stripePaymentIntentId: string,
  customerEmail?: string,
  customerPhone?: string
): Promise<Order | null> {
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

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  validate: boolean = true
): Promise<Order | null> {
  const order = orders.get(orderId);
  if (!order) return null;

  // Validate transition
  if (validate && !canTransitionTo(order.status, newStatus)) {
    console.error(`[DB] Invalid status transition: ${order.status} -> ${newStatus}`);
    return null;
  }

  const now = new Date();
  order.status = newStatus;
  order.updatedAt = now;

  // Record timestamps for specific statuses
  switch (newStatus) {
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

/**
 * List orders with optional filters
 */
export async function listOrders(options?: {
  status?: OrderStatus | OrderStatus[];
  tableId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}): Promise<{ orders: Order[]; total: number }> {
  let result = Array.from(orders.values());

  // Filter by status
  if (options?.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status];
    result = result.filter((order) => statuses.includes(order.status));
  }

  // Filter by table
  if (options?.tableId) {
    result = result.filter((order) => order.tableId === options.tableId);
  }

  // Sort
  const sortBy = options?.sortBy || 'createdAt';
  const sortOrder = options?.sortOrder || 'desc';
  result.sort((a, b) => {
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

  return { orders: result, total };
}

/**
 * Get active orders (for KDS)
 */
export async function getActiveOrders(): Promise<Order[]> {
  const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready'];
  const result = await listOrders({ status: activeStatuses });
  return result.orders;
}

/**
 * Cancel order
 */
export async function cancelOrder(orderId: string): Promise<Order | null> {
  return updateOrderStatus(orderId, 'cancelled', false);
}

/**
 * Delete order (for testing/cleanup)
 */
export async function deleteOrder(orderId: string): Promise<boolean> {
  return orders.delete(orderId);
}

/**
 * Clear all orders (for testing)
 */
export async function clearAllOrders(): Promise<void> {
  orders.clear();
  console.log('[DB] All orders cleared');
}

/**
 * Get order statistics
 */
export async function getOrderStats(): Promise<{
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
}> {
  const all = Array.from(orders.values());
  return {
    total: all.length,
    pending: all.filter((o) => o.status === 'pending' || o.status === 'confirmed').length,
    preparing: all.filter((o) => o.status === 'preparing').length,
    ready: all.filter((o) => o.status === 'ready').length,
    completed: all.filter((o) => o.status === 'served' || o.status === 'paid').length,
  };
}

// Export the store for direct access if needed
export { orders as ordersStore };
