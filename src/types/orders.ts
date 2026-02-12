/**
 * Order Type Definitions
 *
 * Shared types for orders across the application.
 */

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderPriority = 'normal' | 'rush';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  priority: OrderPriority;
  subtotal: number;
  tax: number;
  total: number;
  specialInstructions?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  chatSessionId?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  preparedAt?: Date;
  readyAt?: Date;
  servedAt?: Date;
}

export interface CreateOrderRequest {
  tableId: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }[];
  specialInstructions?: string;
  chatSessionId?: string;
  priority?: OrderPriority;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface OrdersListResponse {
  orders: Order[];
  total: number;
}

export interface OrderResponse {
  order: Order;
}

// Status transition validation
export const validStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: ['paid'],
  paid: [],
  cancelled: [],
};

export function canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return validStatusTransitions[currentStatus]?.includes(newStatus) ?? false;
}

// Kitchen display statuses (subset for KDS)
export type KDSStatus = 'pending' | 'preparing' | 'ready';

export function isKDSStatus(status: OrderStatus): status is KDSStatus {
  return ['pending', 'preparing', 'ready'].includes(status);
}
