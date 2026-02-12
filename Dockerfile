# ============================================
# The Golden Fork - Production Dockerfile
# ============================================
# Multi-stage build for optimized production image
# ============================================

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# --- Stage 2: Build the Next.js app ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time env (Next.js needs these at build time for public vars)
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
ARG NEXT_PUBLIC_WS_URL="ws://localhost:3002"
ARG NEXT_PUBLIC_BASE_URL="http://localhost:3000"

ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Stage 3: Production runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy WebSocket server and its dependencies
COPY --from=builder /app/src/lib/websocket ./src/lib/websocket
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy data files
COPY --from=builder /app/data ./data

USER nextjs

EXPOSE 3000 3002

# Start both Next.js and WebSocket server
# PORT env var is set by hosting platforms (e.g. Render uses 10000)
# Next.js standalone server.js respects the PORT variable automatically
CMD ["sh", "-c", "node --import tsx src/lib/websocket/server.ts & node server.js"]
