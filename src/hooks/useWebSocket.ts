'use client';

/**
 * WebSocket Hook
 *
 * Provides real-time connection to the order WebSocket server.
 * Automatically reconnects on disconnect.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

type ClientType = 'kitchen' | 'customer' | 'manager';

interface OrderEvent {
  type: string;
  orderId?: string;
  order?: any;
  orders?: any[];
  status?: string;
  tableId?: string;
  timestamp: string;
}

interface UseWebSocketOptions {
  clientType: ClientType;
  tableId?: string;
  onNewOrder?: (order: any) => void;
  onStatusChange?: (orderId: string, status: string) => void;
  onOrdersSync?: (orders: any[]) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: OrderEvent | null;
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

export function useWebSocket({
  clientType,
  tableId,
  onNewOrder,
  onStatusChange,
  onOrdersSync,
  autoReconnect = true,
  reconnectInterval = 3000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<OrderEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Build WebSocket URL
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';
    const params = new URLSearchParams({ type: clientType });
    if (tableId) params.set('table', tableId);

    try {
      const ws = new WebSocket(`${wsUrl}?${params}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);

        // Request initial sync
        ws.send(JSON.stringify({ type: 'request_sync' }));
      };

      ws.onmessage = (event) => {
        try {
          const data: OrderEvent = JSON.parse(event.data);
          setLastMessage(data);

          // Route to appropriate handlers
          switch (data.type) {
            case 'new_order':
              onNewOrder?.(data.order);
              break;
            case 'order_status_change':
              if (data.orderId && data.status) {
                onStatusChange?.(data.orderId, data.status);
              }
              break;
            case 'orders_sync':
              onOrdersSync?.(data.orders || []);
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);

      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    }
  }, [clientType, tableId, onNewOrder, onStatusChange, onOrdersSync, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Keep-alive ping
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect,
  };
}

export default useWebSocket;
