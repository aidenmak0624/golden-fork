# Deploying The Golden Fork

A step-by-step guide to get this restaurant ordering system live on the internet.

---

## What You're Deploying

- **Next.js 16** web app (customer ordering + owner dashboard)
- **WebSocket server** (real-time kitchen updates, port 3002)
- **AI chatbot** (OpenAI + Pinecone RAG — optional, has demo fallback)
- **Stripe payments** (optional, has demo fallback)

> **Demo mode**: The app works without any API keys. Chatbot gives canned responses, checkout skips Stripe and goes straight to confirmation. Perfect for portfolio demos.

---

## Option A: Deploy to Railway (Recommended for demos)

Railway supports long-running processes (WebSocket) and is the easiest option.

### 1. Push to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit - The Golden Fork restaurant system"

# Create repo on GitHub, then push
gh repo create the-golden-fork --public --push
# or manually:
git remote add origin https://github.com/YOUR_USERNAME/the-golden-fork.git
git push -u origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repo
4. Railway auto-detects Next.js and starts building

### 3. Configure Environment Variables

In Railway dashboard → your service → **Variables** tab, add:

```
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://YOUR-APP.up.railway.app
NEXT_PUBLIC_WS_URL=wss://YOUR-APP.up.railway.app
WS_INTERNAL_URL=ws://localhost:3002
WS_PORT=3002
```

**Optional** (for full features — skip these for a demo):
```
OPENAI_API_KEY=sk-your-key
PINECONE_API_KEY=your-key
PINECONE_INDEX_NAME=restaurant-menu
CHAT_MODEL=gpt-4o-mini
STRIPE_SECRET_KEY=sk_test_your-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
```

### 4. Configure Build & Start

In Railway → **Settings** tab:
- **Build Command**: `npm run build`
- **Start Command**: `npm run start:all`
- **Port**: `3000`

### 5. Add Custom Domain (Optional)

Railway gives you a `.up.railway.app` URL by default. To use your own domain, go to **Settings** → **Networking** → **Custom Domain**.

---

## Option B: Deploy with Docker

Works on any VPS (DigitalOcean, AWS EC2, Linode, etc.)

### 1. Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/the-golden-fork.git
cd the-golden-fork

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values (or leave blank for demo mode)

# Build and run
docker compose up --build -d
```

The app is now running at `http://your-server:3000`.

### 2. Production Setup with HTTPS

For a production deployment with SSL, put Nginx or Caddy in front:

```bash
# Example with Caddy (auto-HTTPS)
# Install Caddy, then create Caddyfile:
cat > Caddyfile << EOF
yourdomain.com {
    reverse_proxy localhost:3000
}
EOF

# Update your .env.local:
# NEXT_PUBLIC_BASE_URL=https://yourdomain.com
# NEXT_PUBLIC_WS_URL=wss://yourdomain.com

caddy start
```

---

## Option C: Deploy to Vercel (Frontend Only)

Vercel can't run the WebSocket server (serverless limitation), but the app falls back to HTTP polling automatically.

### 1. Deploy

```bash
npx vercel
```

### 2. Set Environment Variables

In Vercel dashboard → Settings → Environment Variables, add your keys.

**Important**: The WebSocket real-time features won't work on Vercel. The KDS board will use polling (every 5 seconds) instead. Everything else works normally.

---

## Option D: Run Locally for Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys (or leave blank for demo)

# Run everything (Next.js + WebSocket)
npm run dev:all

# Or run them separately:
npm run dev        # Next.js on port 3000
npm run dev:ws     # WebSocket on port 3002
```

Visit `http://localhost:3000` (customer) and `http://localhost:3000/dashboard` (owner).

---

## Setting Up API Keys (Optional)

### OpenAI + Pinecone (AI Chatbot)

1. Get an OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Get a Pinecone API key from [app.pinecone.io](https://app.pinecone.io)
3. Create a Pinecone index named `restaurant-menu` with **dimension: 1536** and **metric: cosine**
4. Seed the menu data: `npm run seed`

### Stripe (Payments)

1. Get test keys from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Set up a webhook endpoint pointing to `https://YOUR-DOMAIN/api/webhooks/stripe`
3. Add the webhook secret to your environment

---

## Accessing the App

| Page | URL | Description |
|------|-----|-------------|
| Customer Ordering | `/order?table=5` | Menu, cart, checkout |
| Owner Dashboard | `/dashboard` | KDS, analytics, notifications |
| AI Chatbot | Built into ordering page | Floating widget (bottom-right) |

---

## Troubleshooting

**Build fails on tsconfig paths**: Fixed — we cleaned up hardcoded temp paths.

**Stripe throws on startup**: Fixed — Stripe gracefully falls back to demo mode.

**Chat returns errors**: Fixed — chatbot returns demo responses if OpenAI/Pinecone aren't configured.

**WebSocket won't connect on Vercel**: Expected — Vercel doesn't support WebSockets. The app auto-falls back to polling.

**Orders disappear on restart**: Expected — this demo uses in-memory storage. For production, add a database (PostgreSQL recommended).
