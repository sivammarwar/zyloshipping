FROM docker.io/library/node:20-alpine3.19

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy workspace packages
COPY shared ./shared
COPY backend ./backend

# Install all dependencies from root (npm workspaces)
RUN npm ci

# Generate Prisma client
WORKDIR /app/backend
RUN npx prisma generate

# Build
RUN npm run build

CMD ["node", "dist/index.js"]
