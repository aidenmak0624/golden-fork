/**
 * WebSocket Server for Real-time Order Updates
 *
 * Handles bidirectional communication between:
 * - Kitchen Display System (KDS)
 * - Customer order status pages
 * - Manager dashboard
 *
 * Run this as a separate process: npx ts-node src/lib/websocket/server.ts
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const PORT = process.env.WS_PORT || 3002;

// Client types for routing messages
type ClientType = 'kitchen' | 'customer' | 'manager';

interface ConnectedClient {
  ws: WebSocket;
  type: ClientType;
  tableId?: string; // For customer clients
  connectedAt: Date;
}

interface OrderEvent {
  type:
    | 'new_order'
    | 'order_status_change'
    | 'order_cancelled'
    | 'orders_sync';
  orderId?: string;
  order?: any;
  orders?: any[];
  status?: string;
  tableId?: string;
  timestamp: string;
}

// Store connected clients
const clients = new Map<string, ConnectedClient>();

// Create HTTP server (can be extended for health checks)
const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        connections: clients.size,
        uptime: process.uptime(),
      })
    );
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Generate unique client ID
function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Broadcast to specific client types
function broadcast(event: OrderEvent, targetTypes: ClientType[], tableId?: string) {
  const message = JSON.stringify(event);

  clients.forEach((client, clientId) => {
    if (!targetTypes.includes(client.type)) return;

    // For customer clients, only send if tableId matches
    if (client.type === 'customer' && tableId && client.tableId !== tableId) {
      return;
    }

    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

// Broadcast to all clients
function broadcastAll(event: OrderEvent) {
  broadcast(event, ['kitchen', 'customer', 'manager']);
}

wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const url = new URL(req.url || '', `http://localhost:${PORT}`);
  const clientType = (url.searchParams.get('type') as ClientType) || 'customer';
  const tableId = url.searchParams.get('table') || undefined;

  // Register client
  clients.set(clientId, {
    ws,
    type: clientType,
    tableId,
    connectedAt: new Date(),
  });

  console.log(
    `Client connected: ${clientId} (${clientType}${tableId ? `, table ${tableId}` : ''})`
  );
  console.log(`Total connections: ${clients.size}`);

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: 'connected',
      clientId,
      message: `Connected as ${clientType}`,
      timestamp: new Date().toISOString(),
    })
  );

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, message);
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
    console.log(`Total connections: ${clients.size}`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`Client error (${clientId}):`, error);
    clients.delete(clientId);
  });
});

// Message handler
function handleMessage(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client) return;

  console.log(`Message from ${clientId}:`, message.type);

  switch (message.type) {
    case 'new_order':
      // New order from checkout system
      handleNewOrder(message.order);
      break;

    case 'status_update':
      // Status change from KDS
      handleStatusUpdate(message.orderId, message.status, message.tableId);
      break;

    case 'request_sync':
      // Client requesting current orders
      handleSyncRequest(clientId, client.type);
      break;

    case 'ping':
      // Keep-alive ping
      client.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    default:
      console.log(`Unknown message type: ${message.type}`);
  }
}

// Handle new order
function handleNewOrder(order: any) {
  const event: OrderEvent = {
    type: 'new_order',
    order,
    orderId: order.id,
    tableId: order.tableId,
    timestamp: new Date().toISOString(),
  };

  // Notify kitchen and managers
  broadcast(event, ['kitchen', 'manager']);

  // Notify specific customer
  broadcast(event, ['customer'], order.tableId);

  console.log(`New order broadcasted: ${order.id} (Table ${order.tableId})`);
}

// Handle status update
function handleStatusUpdate(orderId: string, status: string, tableId?: string) {
  const event: OrderEvent = {
    type: 'order_status_change',
    orderId,
    status,
    tableId,
    timestamp: new Date().toISOString(),
  };

  // Notify all relevant parties
  broadcast(event, ['kitchen', 'manager']);

  // Notify specific customer
  if (tableId) {
    broadcast(event, ['customer'], tableId);
  }

  console.log(`Order status updated: ${orderId} -> ${status}`);
}

// Handle sync request
function handleSyncRequest(clientId: string, clientType: ClientType) {
  const client = clients.get(clientId);
  if (!client) return;

  // In production, fetch from database
  // For now, send empty sync
  const event: OrderEvent = {
    type: 'orders_sync',
    orders: [], // Replace with actual orders from DB
    timestamp: new Date().toISOString(),
  };

  client.ws.send(JSON.stringify(event));
}

// Start server
server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('WebSocket Server Started');
  console.log('='.repeat(50));
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Client connection URLs:');
  console.log(`  Kitchen: ws://localhost:${PORT}?type=kitchen`);
  console.log(`  Manager: ws://localhost:${PORT}?type=manager`);
  console.log(`  Customer: ws://localhost:${PORT}?type=customer&table=12`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');

  // Close all connections
  clients.forEach((client) => {
    client.ws.close(1001, 'Server shutting down');
  });

  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

// Export for programmatic use
export { broadcast, broadcastAll, handleNewOrder, handleStatusUpdate };
