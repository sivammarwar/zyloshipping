# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# openssl needed for Prisma engine generation on Alpine
RUN apk add --no-cache dumb-init openssl

# Copy root-level lock file and workspace manifests first (for layer caching)
COPY package.json package-lock.json* ./

# Copy shared package
COPY shared/ ./shared/

# Copy backend
COPY backend/ ./backend/

# Install all dependencies from repo root (resolves workspaces + @zyloshipping/shared)
# This puts node_modules at /app/node_modules
RUN npm ci

# Generate Prisma Client with correct binary for Alpine (musl + openssl 3)
WORKDIR /app/backend
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# openssl required by Prisma query engine at runtime on Alpine
RUN apk add --no-cache dumb-init openssl

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built app
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist         ./dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma       ./prisma
# node_modules is at REPO ROOT (/app/node_modules) because npm ci ran from /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules         ./node_modules
# shared package needed at runtime for @zyloshipping/shared imports
COPY --from=builder --chown=nodejs:nodejs /app/shared               ./shared

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed || true && node dist/index.js"]