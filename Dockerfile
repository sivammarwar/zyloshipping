# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dumb-init early
RUN apk add --no-cache dumb-init

# ── Copy shared package first ──
# The monorepo's shared package must be present so `npm ci` can resolve
# "@zyloshipping/shared": "*" in the backend's package.json
COPY shared/ ./shared/

# ── Copy backend source ──
COPY backend/package.json backend/package-lock.json* ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/src ./backend/src
COPY backend/prisma ./backend/prisma

# ── Install ALL deps (including dev, needed for tsc) ──
WORKDIR /app/backend
RUN npm ci

# ── Generate Prisma Client ──
RUN npx prisma generate

# ── Compile TypeScript ──
RUN npm run build

# ── Prune to production deps only ──
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache dumb-init

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy only what's needed to run
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist        ./dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma      ./prisma

USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]