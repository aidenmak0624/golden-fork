/**
 * WebSocket Event Emitter
 *
 * Utility for emitting events to the WebSocket server from backend code.
 * Used by webhooks and API routes to broadcast real-time updates.
 */

import WebSocket from 'ws';

const WS_URL = process.env.WS_INTERNAL_URL || 'ws://localhost:3002';

interface OrderEvent {
  type: 'new_order' | 'status_update' | 'order_cancelled';
  orderId?: string;
  order?: any;
  status?: string;
  tableId?: string;
}

/**
 * Emit an event to the WebSocket server
 */
export async function emitOrderEvent(event: OrderEvent): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(`${WS_URL}?type=manager`);

      ws.on('open', () => {
        ws.send(JSON.stringify(event));
        ws.close();
        resolve(true);
      });

      ws.on('error', (error) => {
        console.error('Failed to emit WebSocket event:', error);
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
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

/**
 * Emit a new order event
 */
export async function emitNewOrder(order: any): Promise<boolean> {
  return emitOrderEvent({
    type: 'new_order',
    order,
    orderId: order.id,
    tableId: order.tableId,
  });
}

/**
 * Emit an order status update
 */
export async function emitStatusUpdate(
  orderId: string,
  status: string,
  tableId?: string
): Promise<boolean> {
  return emitOrderEvent({
    type: 'status_update',
    orderId,
    status,
    tableId,
  });
}

export default { emitOrderEvent, emitNewOrder, emitStatusUpdate };
