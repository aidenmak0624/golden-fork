# Restaurant RAG System

AI-powered menu assistant using Retrieval-Augmented Generation (RAG) for the Smart Restaurant Ordering System.

## Quick Start

### 1. Install Dependencies

```bash
npm install openai @pinecone-database/pinecone dotenv
# For TypeScript
npm install -D typescript ts-node @types/node
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```env
# OpenAI (Required)
OPENAI_API_KEY=sk-your-key-here

# Pinecone (Required)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=restaurant-menu

# Optional
CHAT_MODEL=gpt-4o-mini  # or gpt-4o, claude-3-haiku, etc.
```

### 3. Create Pinecone Index

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create a new index with:
   - **Name:** `restaurant-menu`
   - **Dimensions:** `1536` (for text-embedding-3-small)
   - **Metric:** `cosine`

### 4. Seed the Menu

```bash
npx ts-node scripts/seed-menu.ts
# Or to clear and re-seed:
npx ts-node scripts/seed-menu.ts --clear
```

### 5. Test the API

```bash
# Start your Next.js server
npm run dev

# Test the chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What gluten-free options do you have?"}'
```

---

## Project Structure

```
restaurant_rag_revised_system/
├── SYSTEM_PROMPT.md              # AI personality & behavior guide
├── README.md                     # This file
├── data/
│   └── sample-menu.json          # Sample menu for testing
├── scripts/
│   └── seed-menu.ts              # Script to index menu data
└── src/
    ├── types/
    │   └── menu.ts               # TypeScript type definitions
    ├── services/
    │   ├── embeddingService.ts   # Vector embedding & indexing
    │   └── ragService.ts         # Query processing & generation
    ├── hooks/
    │   └── useRealtimeOrders.ts  # WebSocket/polling hook for live orders
    ├── components/
    │   ├── chat/
    │   │   └── ChatWidget.tsx    # Floating AI chat for customers
    │   └── dashboard/
    │       ├── DashboardLayout.tsx   # Admin dashboard shell
    │       ├── KDSBoard.tsx          # Kitchen Display Kanban board
    │       └── analytics/
    │           ├── SalesVelocityChart.tsx   # Orders per hour
    │           ├── MenuEngineeringChart.tsx # Profit vs popularity
    │           └── AIInsightsPanel.tsx      # Customer query trends
    └── app/
        ├── api/
        │   ├── chat/route.ts             # Customer chat endpoint
        │   ├── health/route.ts           # System health check
        │   └── admin/index-menu/route.ts # Menu management
        ├── order/page.tsx        # Customer ordering page
        └── dashboard/page.tsx    # Manager dashboard
```

---

## API Reference

### POST `/api/chat`

Customer-facing chat endpoint.

**Request:**
```json
{
  "message": "What vegetarian dishes do you recommend?",
  "tableId": "12",
  "sessionId": "optional-session-id",
  "conversationHistory": [
    {"role": "user", "content": "previous message"},
    {"role": "assistant", "content": "previous response"}
  ],
  "dietaryFilters": {
    "glutenFree": false,
    "vegetarian": true
  }
}
```

**Response:**
```json
{
  "message": "I'd recommend our Thai Red Curry Vegetables...",
  "suggestedItems": [
    {"id": "main-006", "name": "Thai Red Curry Vegetables", "price": 19.99}
  ],
  "processingTimeMs": 892
}
```

### POST `/api/admin/index-menu`

Re-index menu items (admin only).

**Request:**
```json
{
  "menuItems": [...],
  "clearExisting": true
}
```

### GET `/api/health`

System health check.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "openai": {"status": "connected"},
    "pinecone": {"status": "connected", "totalVectors": 23}
  }
}
```

---

## How RAG Works (For Developers)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Customer Question                          │
│            "What's good for someone who's gluten-free?"         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. EMBED: Convert question to vector using OpenAI embeddings   │
│     [0.023, -0.156, 0.891, ...] (1536 dimensions)               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. RETRIEVE: Search Pinecone for similar menu item vectors     │
│     → Returns: Grilled Ribeye (0.87), Herb Salmon (0.84), ...   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. AUGMENT: Build prompt with retrieved menu context           │
│     [System Prompt] + [Menu Items] + [User Question]            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. GENERATE: LLM creates grounded response                     │
│     "Our Grilled Ribeye is completely GF and very popular..."   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Customization

### Change the AI's Personality

Edit `SYSTEM_PROMPT.md` or modify `SYSTEM_PROMPT` in `ragService.ts`.

### Add More Menu Items

1. Edit `data/sample-menu.json` or create your own
2. Run `npx ts-node scripts/seed-menu.ts --clear`

### Adjust Retrieval Settings

In `ragService.ts`:

```typescript
const TOP_K_RESULTS = 8;          // More items = more context
const SIMILARITY_THRESHOLD = 0.65; // Lower = more permissive matching
```

### Use a Different LLM

Change `CHAT_MODEL` in `.env`:
- `gpt-4o-mini` - Fast & cheap (recommended)
- `gpt-4o` - More capable, higher cost
- Or integrate Claude via Anthropic SDK

---

## Cost Estimation

| Service | Free Tier | Typical Usage |
|---------|-----------|---------------|
| OpenAI Embeddings | - | ~$0.02 per 1M tokens |
| OpenAI GPT-4o-mini | - | ~$0.15 per 1M tokens |
| Pinecone | 100K vectors | Free for most restaurants |

**Estimated monthly cost for busy restaurant:** $10-30/month

---

## Troubleshooting

### "Index not found" error
Create the index in Pinecone console with dimension `1536`.

### Slow responses
- Reduce `TOP_K_RESULTS`
- Use `gpt-4o-mini` instead of `gpt-4o`
- Check Pinecone region (use closest)

### AI recommends wrong items
- Lower `SIMILARITY_THRESHOLD`
- Ensure menu items have detailed descriptions
- Add more dietary tags

---

## Frontend Components

### Customer Chat Widget

A mobile-first floating chat interface for AI menu assistance.

```tsx
import ChatWidget from '@/components/chat/ChatWidget';

<ChatWidget
  tableId="12"
  restaurantName="The Golden Fork"
  onAddToCart={(item) => addToCart(item)}
/>
```

Features:
- Floating button that expands to full chat
- Quick prompt suggestions
- Item cards with "Add to Cart" buttons
- Conversation history
- Mobile-optimized design

### Manager Dashboard

Access at `/dashboard` after starting the dev server.

**Live Orders (KDS)**
- Kanban board: New → In Progress → Ready
- Drag-and-drop order management
- Audio alerts for new orders
- Rush order priority indicators
- Time tracking with color-coded warnings

**Analytics Dashboard**
- **Sales Velocity**: Orders per hour chart with historical comparison
- **Menu Engineering**: Profitability vs. Popularity scatter plot
  - Stars (high profit, high sales) - promote these
  - Puzzles (high profit, low sales) - market better
  - Plowhorses (low profit, high sales) - optimize costs
  - Dogs (low profit, low sales) - consider removing

**AI Insights**
- Dietary request trends (gluten-free, vegan, etc.)
- Unmatched requests (items customers asked for but aren't on menu)
- Popular query log with intent detection
- Actionable suggestions ("50 people asked for vegan cheese this week")

### Customer Ordering Page

Access at `/order?table=12` to simulate a customer experience.

Features:
- Category-based menu browsing
- Search functionality
- Dietary tags (GF, V, VG, Spicy)
- Cart management
- Integrated AI chat widget

---

## Stripe Payment Integration

### Setup

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. Add to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test Payments

Use Stripe's test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### Webhook Setup (Local Development)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
npm run stripe:listen
```

### Payment Flow

1. Customer adds items to cart
2. Click "Pay" → Creates Stripe Checkout Session
3. Redirect to Stripe hosted checkout
4. On success → Webhook creates order → Redirect to confirmation page
5. Customer sees real-time order status

---

## WebSocket Real-time Updates

### Start the WebSocket Server

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start WebSocket server
npm run dev:ws

# Or run both together
npm run dev:all
```

### Connection URLs

- **Kitchen Display**: `ws://localhost:3002?type=kitchen`
- **Manager Dashboard**: `ws://localhost:3002?type=manager`
- **Customer (Table 5)**: `ws://localhost:3002?type=customer&table=5`

### Events

| Event | Description |
|-------|-------------|
| `new_order` | New order placed |
| `order_status_change` | Status updated (pending → preparing → ready) |
| `orders_sync` | Full order list sync |

### Health Check

```bash
curl http://localhost:3002/health
```

---

## Install All Dependencies

```bash
npm install
```

This installs:
- `stripe` - Payment processing
- `ws` - WebSocket server
- `recharts` - Analytics charts
- `lucide-react` - Icons
- `concurrently` - Run multiple scripts

---

## Full Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Create Pinecone index (dimension: 1536, metric: cosine)

# 4. Seed the menu
npm run seed

# 5. Start everything
npm run dev:all

# 6. (Optional) Start Stripe webhook listener
npm run stripe:listen
```

### Access Points

| Interface | URL |
|-----------|-----|
| Customer Ordering | http://localhost:3000/order?table=5 |
| Order Confirmation | http://localhost:3000/order/confirmation |
| Manager Dashboard | http://localhost:3000/dashboard |
| WebSocket Health | http://localhost:3002/health |

---

## Next Steps

1. **Add authentication** - Protect dashboard with login (NextAuth.js recommended)
2. **Connect to database** - Replace demo data with PostgreSQL/Supabase
3. **Deploy** - Vercel (frontend) + Railway (WebSocket server)
4. **Add SMS notifications** - Twilio for order ready alerts

For the full project spec, see your project documentation.
