# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache dumb-init

# Copy root-level lock file and workspace manifests first (for layer caching)
COPY package.json package-lock.json* ./

# Copy shared package
COPY shared/ ./shared/

# Copy backend
COPY backend/ ./backend/

# Install all dependencies from repo root (resolves workspaces + @zyloshipping/shared)
RUN npm ci

# Generate Prisma Client
WORKDIR /app/backend
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache dumb-init

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built app
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist          ./dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/node_modules  ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json  ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma        ./prisma
# shared may be needed at runtime if imported directly
COPY --from=builder --chown=nodejs:nodejs /app/shared                ./shared

USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]