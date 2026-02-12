# The Golden Fork — Free Deployment Guide (Render)

> **Why Render?** Free tier, supports Docker + WebSocket, no credit card required, auto-deploys from GitHub.

---

## Prerequisites

Before you start, you need:

1. **A GitHub account** — [github.com](https://github.com)
2. **Your code pushed to a GitHub repo** (see Step 1)
3. **A Render account** — [render.com](https://render.com) (sign up with GitHub — free)
4. **(Optional) API keys** if you want the AI chatbot to work live:
   - OpenAI API key → [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Pinecone API key → [app.pinecone.io](https://app.pinecone.io)

> **No API keys?** The app works perfectly in demo mode — the chatbot returns friendly simulated responses.

---

## Step 1: Push Your Code to GitHub

If you haven't already, create a GitHub repo and push your code:

```bash
# In your project folder
git init
git add .
git commit -m "Initial commit — The Golden Fork"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/golden-fork.git
git branch -M main
git push -u origin main
```

**Important:** Make sure `.env.local` is in your `.gitignore` (it should be by default). Never push API keys to GitHub.

---

## Step 2: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (easiest — gives Render access to your repos)
4. No credit card needed

---

## Step 3: Create a New Web Service

1. From your Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repo:
   - Select **"Build and deploy from a Git repository"**
   - Find and select your `golden-fork` repo
   - Click **"Connect"**

---

## Step 4: Configure the Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `golden-fork` (or whatever you like) |
| **Region** | Pick the closest to you |
| **Branch** | `main` |
| **Runtime** | **Docker** |
| **Instance Type** | **Free** |

### Environment Variables

Scroll down to **"Environment Variables"** and add these:

**Required (app will work without them in demo mode):**

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_BASE_URL` | `https://golden-fork.onrender.com` *(use your actual Render URL)* |
| `NEXT_PUBLIC_WS_URL` | `wss://golden-fork.onrender.com` |
| `WS_INTERNAL_URL` | `ws://localhost:3002` |
| `WS_PORT` | `3002` |
| `RESTAURANT_NAME` | `The Golden Fork` |
| `RATE_LIMIT_MAX_REQUESTS` | `50` |
| `RATE_LIMIT_WINDOW_MS` | `3600000` |

**Optional (for full AI chatbot functionality):**

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `sk-...` *(your key)* |
| `CHAT_MODEL` | `gpt-4o-mini` |
| `PINECONE_API_KEY` | `...` *(your key)* |
| `PINECONE_INDEX_NAME` | `restaurant-menu` |

**Optional (for payments):**

| Key | Value |
|-----|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |

> **Note:** You'll get your exact Render URL after the first deploy. You can update `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_WS_URL` afterward and Render will auto-redeploy.

---

## Step 5: Fix the Port Configuration

Render's free tier only exposes **one port**. Your app runs Next.js on 3000 and WebSocket on 3002. We need a small entrypoint script to handle this.

### Option A: Use Port 10000 (Render's default)

Render expects your app to listen on port `10000`. Add this environment variable:

| Key | Value |
|-----|-------|
| `PORT` | `10000` |

Then update your Dockerfile's CMD. In your repo, change the last line of `Dockerfile` from:

```dockerfile
CMD ["sh", "-c", "node --import tsx src/lib/websocket/server.ts & node server.js"]
```

to:

```dockerfile
CMD ["sh", "-c", "node --import tsx src/lib/websocket/server.ts & PORT=${PORT:-3000} node server.js"]
```

This tells Next.js to use Render's `PORT` env var (10000) while the WebSocket server stays on 3002 internally.

> **WebSocket note:** On Render's free tier, only one port is publicly exposed. The WebSocket server runs internally, and the app's built-in polling fallback kicks in automatically — everything still works in real-time, just using HTTP polling instead of WebSocket.

### Option B: Keep it simple (recommended for demo)

If you don't need real-time KDS updates for the demo, just add the `PORT` env var and the app works as-is. The polling fallback handles everything.

---

## Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Build the Docker image (takes 3–5 minutes the first time)
   - Start the container
3. Watch the build logs — you'll see the familiar Next.js build output
4. When it says **"Your service is live"**, you're done!

Your app is now live at: `https://golden-fork.onrender.com` (or whatever name you chose)

---

## Step 7: Verify It Works

Open your Render URL and check:

- [ ] Home page loads with the restaurant menu
- [ ] You can browse menu items and add to cart
- [ ] The AI chat widget appears in the bottom-right corner
- [ ] Chat responds (either live AI or demo mode depending on API keys)
- [ ] Rate limit counter shows "X/50 left" in the chat footer

---

## Important: Free Tier Behavior

Render's free tier has one quirk you should know about:

**Your app sleeps after 15 minutes of no traffic.**

- First visit after sleep takes ~30 seconds to "wake up" (cold start)
- After that, it responds normally
- It won't sleep while you're actively using it

**For a live demo:** Open your app URL 1–2 minutes before your demo starts so it's warmed up and ready.

> **Pro tip:** You can use a free service like [UptimeRobot](https://uptimerobot.com) to ping your app every 14 minutes and keep it awake. Render allows this on the free tier.

---

## Updating Your App

Any time you push to `main`, Render auto-deploys:

```bash
git add .
git commit -m "Update menu items"
git push origin main
```

Render detects the push, rebuilds, and redeploys in ~3–5 minutes.

---

## Custom Domain (Optional)

If you have your own domain:

1. Go to your service → **"Settings"** → **"Custom Domains"**
2. Add your domain (e.g., `demo.goldenfork.com`)
3. Update DNS as instructed (CNAME record)
4. Render provides free SSL automatically
5. Update your env vars to use the new domain:
   - `NEXT_PUBLIC_BASE_URL` → `https://demo.goldenfork.com`
   - `NEXT_PUBLIC_WS_URL` → `wss://demo.goldenfork.com`

---

## Troubleshooting

### Build fails with "out of memory"
Render free tier has 512MB RAM. If the build fails:
- Go to **Settings** → **"Docker Command"** and set:
  `NODE_OPTIONS=--max-old-space-size=512`

### App crashes on startup
Check the **"Logs"** tab in Render dashboard. Common fixes:
- Missing env vars → add them in the "Environment" tab
- Port mismatch → make sure `PORT=10000` is set

### Chat returns demo responses even with API keys
- Double-check `OPENAI_API_KEY` is set correctly (no quotes, no spaces)
- Check logs for `OpenAI not configured` messages
- Make sure your OpenAI account has credits/billing enabled

### App is slow on first load
That's the free tier cold start (~30 seconds). Warm it up before demos.

---

## Cost Summary

| What | Cost |
|------|------|
| Render Free Tier | **$0/month** |
| GitHub | **$0** |
| OpenAI API (gpt-4o-mini) | **~$0.01–0.05/demo** (50 msgs × ~$0.001 each) |
| Pinecone Free Tier | **$0** |
| Stripe Test Mode | **$0** |
| **Total for demo** | **$0 – $0.05** |

---

## Quick Reference

| Item | URL |
|------|-----|
| Your app | `https://golden-fork.onrender.com` |
| Render dashboard | [dashboard.render.com](https://dashboard.render.com) |
| Build logs | Dashboard → Your service → "Logs" tab |
| Environment vars | Dashboard → Your service → "Environment" tab |
