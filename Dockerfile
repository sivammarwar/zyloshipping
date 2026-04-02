FROM node:20-alpine3.19 AS build
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY backend/package.json backend/package-lock.json* ./
COPY shared ./shared
COPY backend ./backend
WORKDIR /app/backend
RUN npm ci
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine3.19 AS run
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
USER node
CMD ["node", "dist/server.js"]
