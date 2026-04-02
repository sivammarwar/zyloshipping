# ZyloShipping Backend
# Build: 202504020843
ARG CACHE_BUST=202504020843

FROM node:20-alpine3.19 AS deps
WORKDIR /app
RUN echo "Cache: $CACHE_BUST"
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json* ./
COPY shared ./shared
COPY backend ./backend
RUN npm ci --omit=dev

FROM node:20-alpine3.19 AS build
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY shared ./shared
COPY backend ./backend
WORKDIR /app/shared
RUN npm run build
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine3.19 AS release
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
USER node
CMD ["node", "dist/server.js"]
