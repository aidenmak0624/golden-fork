'use client';

/**
 * Order Tracking Hook
 *
 * Tracks a specific order's status for customers.
 * Uses polling and WebSocket for real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'paid'
  | 'cancelled';

export interface TrackedOrder {
  id: string;
  tableId: string;
  status: OrderStatus;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  createdAt: Date;
  updatedAt?: Date;
  confirmedAt?: Date;
  preparedAt?: Date;
  readyAt?: Date;
}

interface UseOrderTrackingOptions {
  pollingInterval?: number;
  websocketUrl?: string;
}

interface UseOrderTrackingReturn {
  order: TrackedOrder | null;
  status: OrderStatus | null;
  isLoading: boolean;
  error: string | null;
  estimatedTime: string | null;
  refetch: () => Promise<void>;
}

// Status display configuration
export const statusDisplayConfig: Record<
  OrderStatus,
  { label: string; description: string; color: string; step: number }
> = {
  pending: {
    label: 'Order Received',
    description: 'Your order is being processed',
    color: 'text-amber-600',
    step: 1,
  },
  confirmed: {
    label: 'Payment Confirmed',
    description: 'Your order has been confirmed and sent to the kitchen',
    color: 'text-blue-600',
    step: 2,
  },
  preparing: {
    label: 'Being Prepared',
    description: 'The kitchen is preparing your order',
    color: 'text-orange-600',
    step: 3,
  },
  ready: {
    label: 'Ready!',
    description: 'Your order is ready for pickup',
    color: 'text-green-600',
    step: 4,
  },
  served: {
    label: 'Served',
    description: 'Your order has been served',
    color: 'text-green-700',
    step: 5,
  },
  paid: {
    label: 'Complete',
    description: 'Thank you for your order!',
    color: 'text-gray-600',
    step: 5,
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Your order has been cancelled',
    color: 'text-red-600',
    step: 0,
  },
};

export function useOrderTracking(
  orderId: string | null,
  { pollingInterval = 10000, websocketUrl }: UseOrderTrackingOptions = {}
): UseOrderTrackingReturn {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Fetch order from API
  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();

      if (isMounted.current && data.order) {
        const trackedOrder: TrackedOrder = {
          ...data.order,
          createdAt: new Date(data.order.createdAt),
          updatedAt: data.order.updatedAt ? new Date(data.order.updatedAt) : undefined,
          confirmedAt: data.order.confirmedAt ? new Date(data.order.confirmedAt) : undefined,
          preparedAt: data.order.preparedAt ? new Date(data.order.preparedAt) : undefined,
          readyAt: data.order.readyAt ? new Date(data.order.readyAt) : undefined,
        };
        setOrder(trackedOrder);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [orderId]);

  // Calculate estimated time based on status
  const getEstimatedTime = useCallback((): string | null => {
    if (!order) return null;

    switch (order.status) {
      case 'pending':
      case 'confirmed':
        return '15-20 minutes';
      case 'preparing':
        return '5-10 minutes';
      case 'ready':
        return 'Ready now!';
      case 'served':
      case 'paid':
        return 'Complete';
      case 'cancelled':
        return 'Cancelled';
      default:
        return null;
    }
  }, [order]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!orderId) return;

    const wsUrl =
      websocketUrl ||
      (process.env.NEXT_PUBLIC_WS_URL as string) ||
      'ws://localhost:3002';

    try {
      const tableId = order?.tableId || 'unknown';
      const ws = new WebSocket(`${wsUrl}?type=customer&table=${tableId}`);

      ws.onopen = () => {
        console.log('Order tracking WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'order_status_change' && data.orderId === orderId) {
            setOrder((prev) =>
              prev ? { ...prev, status: data.status, updatedAt: new Date() } : prev
            );
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = () => {
        console.warn('Order tracking WebSocket error');
      };

      ws.onclose = () => {
        console.log('Order tracking WebSocket disconnected');
      };

      return () => {
        ws.close();
      };
    } catch (err) {
      console.warn('Failed to connect to order tracking WebSocket:', err);
    }
  }, [orderId, order?.tableId, websocketUrl]);

  // Initial fetch and polling
  useEffect(() => {
    isMounted.current = true;

    fetchOrder();

    // Poll for updates
    const interval = setInterval(fetchOrder, pollingInterval);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchOrder, pollingInterval]);

  return {
    order,
    status: order?.status || null,
    isLoading,
    error,
    estimatedTime: getEstimatedTime(),
    refetch: fetchOrder,
  };
}

export default useOrderTracking;
