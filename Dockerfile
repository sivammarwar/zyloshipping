# ZyloShipping Backend - Fresh Build
FROM node:20-alpine3.19 AS build
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# Copy root package files (monorepo workspace)
COPY package.json package-lock.json* ./
COPY shared ./shared
COPY backend ./backend

# Install all dependencies (workspace-aware)
RUN npm install

# Build shared package
WORKDIR /app/shared
RUN npx tsc

# Build backend
WORKDIR /app/backend
RUN npx prisma generate
RUN npx tsc

# Runtime stage
FROM node:20-alpine3.19 AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat

# Copy only what's needed for runtime
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/shared/dist ./shared/dist

# Generate Prisma client
RUN npx prisma generate

EXPOSE 4000
USER node
CMD ["node", "dist/server.js"]
