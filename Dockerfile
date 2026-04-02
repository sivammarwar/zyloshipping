FROM node:20-slim AS zyloshipping-api

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root workspace files first
ARG CACHE_BUST=unknown
RUN echo "Cache bust: $CACHE_BUST"

COPY package.json package-lock.json ./

# Copy all workspace packages
COPY shared ./shared
COPY backend ./backend

# Install from root (npm workspaces hoists deps)
RUN npm ci

# Generate Prisma and build (no migrations - env vars not available)
WORKDIR /app/backend
RUN npx prisma generate && npm run build

# Start (with migrations - DATABASE_URL available at runtime)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
