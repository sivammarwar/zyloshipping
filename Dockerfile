# ZyloShipping API - 202504020906
FROM node:20-alpine3.19 AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
COPY shared ./shared
COPY backend ./backend
RUN npm install
WORKDIR /app/shared
RUN npx tsc || true
WORKDIR /app/backend
RUN npx prisma generate && npx tsc

FROM node:20-alpine3.19 AS app
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/prisma ./prisma
RUN mkdir -p shared/dist
RUN cp -r /app/shared/dist/* shared/dist/ 2>/dev/null || echo "Shared dist not found, skipping"
RUN npx prisma generate
EXPOSE 4000
USER node
CMD ["node", "dist/server.js"]
