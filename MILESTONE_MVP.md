# Milestone 1: MVP (Current State)

**Status:** Complete
**Date:** January 2026

## Overview

This milestone establishes the foundational UI and basic architecture for the Restaurant RAG System - an AI-powered menu assistant for restaurant ordering.

## What's Built

### Frontend Pages

| Page | Route | Status | Description |
|------|-------|--------|-------------|
| Landing | `/` | ✅ Done | Homepage with links to Order and Dashboard |
| Order Menu | `/order` | ✅ Done | Customer menu browsing with category filters |
| Order Confirmation | `/order/confirmation` | ✅ Done | Post-checkout success page |
| Dashboard | `/dashboard` | ✅ Done | Restaurant owner dashboard layout |

### UI Components

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| ChatWidget | `components/chat/` | ✅ Done | Floating AI chat interface with cart |
| KDSBoard | `components/dashboard/` | ✅ Done | Kitchen Display System board (UI only) |
| DashboardLayout | `components/dashboard/` | ✅ Done | Dashboard wrapper with navigation |
| ShadCN UI Kit | `components/ui/` | ✅ Done | Full component library (48 components) |

### API Routes

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/chat` | POST | ✅ Done | AI chat processing (OpenAI + RAG) |
| `/api/checkout` | POST | ✅ Done | Stripe checkout session creation |
| `/api/webhooks/stripe` | POST | ✅ Done | Stripe webhook handler |
| `/api/health` | GET | ✅ Done | Health check endpoint |
| `/api/admin/index-menu` | POST | ✅ Done | Menu indexing for RAG |

### Services

| Service | Status | Description |
|---------|--------|-------------|
| RAG Service | ✅ Done | OpenAI embeddings + Pinecone vector search |
| Embedding Service | ✅ Done | Text-to-vector conversion |
| Stripe Integration | ✅ Done | Payment processing setup |

### Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Next.js 16 App Router | ✅ Done | ESM configuration |
| TypeScript | ✅ Done | Strict mode disabled for flexibility |
| Tailwind CSS | ✅ Done | Full styling system |
| WebSocket Server | ✅ Setup | `src/lib/websocket/` (not connected) |

## Environment Variables Required

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone (Vector DB)
PINECONE_API_KEY=...
PINECONE_INDEX=...
PINECONE_ENVIRONMENT=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## What Works

1. **Menu Display** - Categories, items, dietary tags render correctly
2. **AI Chat** - Basic conversation with menu recommendations
3. **Cart UI** - Add/remove items, quantity adjustments
4. **Checkout Flow** - Redirects to Stripe (payment not processed to orders)
5. **Dashboard Layout** - Navigation and basic structure

## What's NOT Working (Next Milestone)

1. **Order Button** - Doesn't submit orders to backend
2. **Real-time Orders** - No WebSocket connection to dashboard
3. **KDS Board** - Shows mock data, not real orders
4. **Chat History** - Not persisted or shown on dashboard
5. **Order Status Updates** - No status workflow
6. **Table-Dashboard Link** - Chat not visible to restaurant staff

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts
│   │   ├── checkout/route.ts
│   │   ├── webhooks/stripe/route.ts
│   │   ├── health/route.ts
│   │   └── admin/index-menu/route.ts
│   ├── dashboard/
│   │   └── page.tsx
│   ├── order/
│   │   ├── page.tsx
│   │   └── confirmation/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── chat/ChatWidget.tsx
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── KDSBoard.tsx
│   │   └── analytics/
│   ├── ui/ (48 ShadCN components)
│   └── index.ts
├── hooks/
│   ├── use-mobile.ts
│   ├── useRealtimeOrders.ts
│   └── useWebSocket.ts
├── lib/
│   ├── stripe.ts
│   ├── utils.ts
│   └── websocket/
├── services/
│   ├── ragService.ts
│   └── embeddingService.ts
└── types/
    └── menu.ts
```

## Running the MVP

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# (Optional) Start WebSocket server
npm run dev:ws
```

## Known Issues

1. `tsconfig.json` jsx setting must be `"preserve"` for Next.js
2. `.next` cache may need clearing after config changes
3. Stripe webhook needs `stripe listen --forward-to` for local dev

---

**Next:** See `MILESTONE_2_IMPLEMENTATION.md` for the plan to make everything functional.
