'use client';

/**
 * Real-time Orders Hook
 *
 * Manages WebSocket connection for live order updates.
 * Fetches real orders from the API and listens for real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Order types matching the API
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  specialInstructions?: string;
  price?: number;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  priority: 'normal' | 'rush';
  createdAt: Date;
  updatedAt?: Date;
  total?: number;
}

interface UseRealtimeOrdersOptions {
  pollingInterval?: number; // ms, for REST fallback
  websocketUrl?: string;
  activeOnly?: boolean; // Only fetch active orders (for KDS)
}

interface UseRealtimeOrdersReturn {
  orders: Order[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useRealtimeOrders({
  pollingInterval = 5000,
  websocketUrl,
  activeOnly = true,
}: UseRealtimeOrdersOptions = {}): UseRealtimeOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isMounted = useRef(true);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      const url = activeOnly ? '/api/orders?active=true' : '/api/orders';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();

      if (isMounted.current) {
        // Convert date strings to Date objects
        const ordersWithDates = (data.orders || []).map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined,
          // Map items to match KDS format
          items: order.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            specialInstructions: item.notes,
            price: item.price,
          })),
        }));

        setOrders(ordersWithDates);
        setError(null);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (isMounted.current) {
        setError('Failed to fetch orders');
        setIsLoading(false);
      }
    }
  }, [activeOnly]);

  // Update order status via API
  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: Order['status']) => {
      // Optimistic update
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        )
      );

      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update status');
        }

        // Refetch to ensure consistency
        await fetchOrders();
      } catch (err) {
        console.error('Error updating order status:', err);
        // Revert on error
        await fetchOrders();
        setError(err instanceof Error ? err.message : 'Failed to update status');
      }
    },
    [fetchOrders]
  );

  // WebSocket connection
  useEffect(() => {
    const wsUrl =
      websocketUrl ||
      (process.env.NEXT_PUBLIC_WS_URL as string) ||
      'ws://localhost:3002';

    try {
      const ws = new WebSocket(`${wsUrl}?type=kitchen`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);

        // Request initial sync
        ws.send(JSON.stringify({ type: 'request_sync' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'new_order':
              // Add new order to the list
              if (data.order) {
                const newOrder: Order = {
                  ...data.order,
                  createdAt: new Date(data.order.createdAt),
                  items: data.order.items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    specialInstructions: item.specialInstructions || item.notes,
                  })),
                };

                setOrders((prev) => {
                  // Avoid duplicates
                  if (prev.some((o) => o.id === newOrder.id)) {
                    return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
                  }
                  return [...prev, newOrder];
                });
              }
              break;

            case 'order_status_change':
              // Update order status
              if (data.orderId && data.status) {
                setOrders((prev) =>
                  prev.map((order) =>
                    order.id === data.orderId
                      ? { ...order, status: data.status }
                      : order
                  )
                );
              }
              break;

            case 'orders_sync':
              // Full orders sync
              if (data.orders) {
                const syncedOrders = data.orders.map((order: any) => ({
                  ...order,
                  createdAt: new Date(order.createdAt),
                  items: order.items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    specialInstructions: item.specialInstructions || item.notes,
                  })),
                }));
                setOrders(syncedOrders);
              }
              break;

            case 'connected':
              console.log('WebSocket server acknowledged connection');
              break;

            case 'pong':
              // Keep-alive response
              break;

            default:
              console.log('Unknown WebSocket message:', data.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.warn('WebSocket error (will fall back to polling):', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      wsRef.current = ws;

      // Keep-alive ping
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      return () => {
        clearInterval(pingInterval);
        ws.close();
      };
    } catch (err) {
      console.warn('Failed to connect to WebSocket (will use polling):', err);
      setIsConnected(false);
    }
  }, [websocketUrl]);

  // Initial fetch and polling
  useEffect(() => {
    isMounted.current = true;

    // Initial fetch
    fetchOrders();

    // Set up polling as fallback/supplement
    const pollInterval = setInterval(() => {
      fetchOrders();
    }, pollingInterval);

    return () => {
      isMounted.current = false;
      clearInterval(pollInterval);
    };
  }, [fetchOrders, pollingInterval]);

  return {
    orders,
    isConnected,
    isLoading,
    error,
    updateOrderStatus,
    refetch: fetchOrders,
  };
}

export default useRealtimeOrders;
