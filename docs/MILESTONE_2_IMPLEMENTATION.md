# Milestone 2: Full Implementation Plan

**Status:** ✅ IMPLEMENTED
**Goal:** Make the restaurant system fully functional end-to-end
**Completed:** February 2026

## Overview

This milestone connects all the UI pieces to create a working restaurant ordering system with real-time order management and table-to-dashboard communication.

---

## 1. Order System Implementation

### 1.1 Create Orders API

**File:** `src/app/api/orders/route.ts`

```typescript
// POST /api/orders - Create new order
// GET /api/orders - List orders (for dashboard)
// PATCH /api/orders/[id] - Update order status

interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid';
  totalAmount: number;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
  stripeSessionId?: string;
  chatSessionId?: string; // Links to chat history
}

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}
```

**Tasks:**
- [ ] Create Order model/type definitions
- [ ] POST handler to create orders
- [ ] GET handler with filters (status, table, date range)
- [ ] PATCH handler for status updates
- [ ] Integrate with Stripe webhook to confirm paid orders

### 1.2 Connect Order Button to Backend

**File:** `src/app/order/page.tsx`

**Current State:** Cart checkout redirects to Stripe but doesn't create an order record.

**Implementation:**
```typescript
// In handleCheckout function:
const handleCheckout = async () => {
  // 1. Create order in database FIRST
  const orderResponse = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      tableId,
      items: cart,
      chatSessionId: sessionId, // Link to chat
      specialInstructions,
    }),
  });
  const order = await orderResponse.json();

  // 2. Create Stripe session with order reference
  const checkoutResponse = await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({
      orderId: order.id,
      items: cart,
      tableId,
    }),
  });

  // 3. Redirect to Stripe
  const { url } = await checkoutResponse.json();
  window.location.href = url;
};
```

**Tasks:**
- [ ] Update checkout flow to create order first
- [ ] Add orderId to Stripe metadata
- [ ] Update webhook to mark order as 'confirmed' on payment success
- [ ] Handle payment failure/cancellation

---

## 2. Real-Time Order Updates (WebSocket)

### 2.1 WebSocket Server Enhancement

**File:** `src/lib/websocket/server.ts`

**Events to Implement:**
```typescript
// Server -> Client Events
interface ServerEvents {
  'order:new': Order;           // New order placed
  'order:updated': Order;       // Status changed
  'order:items-added': Order;   // Items added to existing order
  'chat:message': ChatMessage;  // New chat message from table
}

// Client -> Server Events
interface ClientEvents {
  'order:update-status': { orderId: string; status: OrderStatus };
  'order:acknowledge': { orderId: string };
  'dashboard:subscribe': { restaurantId: string };
  'table:subscribe': { tableId: string };
}
```

**Tasks:**
- [ ] Add authentication/authorization to WebSocket
- [ ] Implement room-based broadcasting (dashboard room, table rooms)
- [ ] Add reconnection logic with exponential backoff
- [ ] Store connection state for offline handling

### 2.2 Connect Dashboard to WebSocket

**File:** `src/app/dashboard/page.tsx`

**Implementation:**
```typescript
// Use the existing useRealtimeOrders hook
const { orders, isConnected, updateOrderStatus } = useRealtimeOrders();

// Listen for new orders
useEffect(() => {
  // Play notification sound
  // Show toast notification
  // Update order list
}, [orders]);
```

**Tasks:**
- [ ] Initialize WebSocket on dashboard mount
- [ ] Display connection status indicator
- [ ] Add audio notification for new orders
- [ ] Implement order status update buttons
- [ ] Show real-time order count badge

### 2.3 Connect Order Page to WebSocket

**File:** `src/app/order/page.tsx`

**Implementation:**
```typescript
// Subscribe to order status updates after placing order
const { orderStatus, estimatedTime } = useOrderTracking(orderId);

// Show status updates to customer
<OrderStatusBadge status={orderStatus} />
<p>Estimated ready: {estimatedTime}</p>
```

**Tasks:**
- [ ] Add order tracking after checkout
- [ ] Display status updates to customer
- [ ] Show estimated preparation time

---

## 3. Chat History & Dashboard Integration

### 3.1 Chat Persistence API

**File:** `src/app/api/chat/history/route.ts`

```typescript
// GET /api/chat/history?tableId=5&sessionId=xxx
// Returns chat history for a table/session

interface ChatHistory {
  sessionId: string;
  tableId: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastMessageAt: Date;
  orderId?: string; // Link to order if one was placed
}
```

**Tasks:**
- [ ] Create chat history storage (database table)
- [ ] Save messages in /api/chat route
- [ ] GET endpoint for retrieving history
- [ ] Add expiration/cleanup for old sessions

### 3.2 Dashboard Chat Panel

**File:** `src/components/dashboard/TableChatPanel.tsx`

**Features:**
- View active chat sessions by table
- See full conversation history
- Quick responses/templates
- Link chat to order for context

**Implementation:**
```typescript
interface TableChatPanelProps {
  tableId: string;
  onSendMessage?: (message: string) => void;
}

// Display in dashboard sidebar or modal
<TableChatPanel
  tableId={selectedTable}
  onSendMessage={handleStaffResponse}
/>
```

**Tasks:**
- [ ] Create TableChatPanel component
- [ ] Fetch and display chat history
- [ ] Real-time message updates via WebSocket
- [ ] Staff response capability (optional)
- [ ] Link to associated order

### 3.3 Real-Time Chat Sync

**WebSocket Events:**
```typescript
// When customer sends message
socket.emit('chat:message', {
  tableId: '5',
  sessionId: 'session-123',
  message: { role: 'user', content: 'Is the pasta gluten-free?' }
});

// Dashboard receives
socket.on('chat:message', (data) => {
  // Update chat panel for table 5
  // Show notification badge
});
```

**Tasks:**
- [ ] Emit chat messages to WebSocket
- [ ] Dashboard subscription to table chats
- [ ] Notification when new message arrives
- [ ] Mark messages as read/acknowledged

---

## 4. KDS Board (Kitchen Display System)

### 4.1 Replace Mock Data with Real Orders

**File:** `src/components/dashboard/KDSBoard.tsx`

**Current State:** Uses hardcoded mock orders.

**Implementation:**
```typescript
// Replace mock data with real-time orders
const { orders, updateOrderStatus } = useRealtimeOrders();

// Filter orders by status for different columns
const pendingOrders = orders.filter(o => o.status === 'pending');
const preparingOrders = orders.filter(o => o.status === 'preparing');
const readyOrders = orders.filter(o => o.status === 'ready');
```

**Tasks:**
- [ ] Remove mock data from KDSBoard
- [ ] Connect to useRealtimeOrders hook
- [ ] Implement drag-and-drop status changes
- [ ] Add order timing (elapsed time since created)
- [ ] Color coding for priority (time-based)
- [ ] Audio alert for orders waiting too long

### 4.2 Order Status Workflow

```
Customer Places Order
        ↓
    [PENDING] ← New order, awaiting confirmation
        ↓
   [CONFIRMED] ← Payment verified, sent to kitchen
        ↓
   [PREPARING] ← Kitchen started cooking
        ↓
     [READY] ← Food ready for pickup/service
        ↓
    [SERVED] ← Delivered to table
        ↓
     [PAID] ← Transaction complete
```

**Tasks:**
- [ ] Implement status transition buttons
- [ ] Validate status transitions (can't skip steps)
- [ ] Timestamp each status change
- [ ] Notify customer on status change

---

## 5. Database Schema

### Recommended Tables

```sql
-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  table_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  stripe_session_id VARCHAR(255),
  chat_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  menu_item_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  notes TEXT
);

-- Chat history
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  table_id VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user' | 'assistant' | 'staff'
  content TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order status history (for analytics)
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  changed_by VARCHAR(255) -- staff user or 'system'
);
```

**Options:**
- Supabase (PostgreSQL + Realtime)
- PlanetScale (MySQL)
- Prisma + any SQL database
- MongoDB

---

## 6. Implementation Priority

### Phase 1: Core Order Flow (Week 1)
1. [x] Create Orders API (CRUD)
2. [x] Connect order button to create orders
3. [x] Update Stripe webhook to confirm orders
4. [x] Display real orders in KDS Board

### Phase 2: Real-Time Updates (Week 2)
5. [x] Enhance WebSocket server
6. [x] Connect dashboard to WebSocket
7. [x] Implement order status updates
8. [x] Add customer order tracking

### Phase 3: Chat Integration (Week 3)
9. [ ] Create chat history API
10. [ ] Build TableChatPanel component
11. [ ] Real-time chat sync via WebSocket
12. [ ] Link chat sessions to orders

### Phase 4: Polish & Testing (Week 4)
13. [ ] Error handling & edge cases
14. [ ] Loading states & optimistic updates
15. [ ] Mobile responsiveness
16. [ ] End-to-end testing

---

## 7. Files to Create/Modify

### New Files
```
src/app/api/orders/route.ts              # Orders CRUD
src/app/api/orders/[id]/route.ts         # Single order operations
src/app/api/orders/[id]/status/route.ts  # Status updates
src/app/api/chat/history/route.ts        # Chat history
src/components/dashboard/TableChatPanel.tsx
src/components/order/OrderTracking.tsx
src/hooks/useOrderTracking.ts
src/types/orders.ts
```

### Files to Modify
```
src/app/order/page.tsx                   # Add order creation
src/app/dashboard/page.tsx               # Connect WebSocket
src/components/dashboard/KDSBoard.tsx    # Use real data
src/components/chat/ChatWidget.tsx       # Emit to WebSocket
src/lib/websocket/server.ts              # Add order events
src/hooks/useRealtimeOrders.ts           # Enhance functionality
src/app/api/checkout/route.ts            # Link to orders
src/app/api/webhooks/stripe/route.ts     # Update order status
```

---

## 8. Testing Checklist

### Order Flow
- [ ] Customer can browse menu and add items to cart
- [ ] Checkout creates order and redirects to Stripe
- [ ] Payment success updates order to 'confirmed'
- [ ] Payment failure/cancel handles gracefully
- [ ] Order appears on dashboard KDS Board

### Real-Time Updates
- [ ] Dashboard receives new orders instantly
- [ ] Status updates reflect on dashboard and customer view
- [ ] WebSocket reconnects after disconnect
- [ ] Multiple dashboard users see same state

### Chat Integration
- [ ] Chat messages persist across page reloads
- [ ] Dashboard can view table chat history
- [ ] New messages trigger notifications
- [ ] Chat links to correct order

---

## 9. Environment Variables (Additional)

```env
# Database (choose one)
DATABASE_URL=postgresql://...
# or
SUPABASE_URL=...
SUPABASE_ANON_KEY=...

# WebSocket
WS_PORT=3001
WS_SECRET=your-websocket-secret

# Optional: Push notifications
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

**Ready to implement?** Start with Phase 1: Create the Orders API and connect the order button!
