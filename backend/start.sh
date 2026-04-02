#!/bin/sh
set -e

echo "[startup] Running Prisma db push..."
cd /app
npx prisma db push --accept-data-loss

echo "[startup] Running seed..."
npx prisma db seed || true

echo "[startup] Starting server..."
exec node dist/index.js
