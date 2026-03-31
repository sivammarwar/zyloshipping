#!/bin/bash

echo "🚀 Running ZyloShipping Refund System Migration..."
echo ""

# Check if we're in the backend directory
if [ ! -f "prisma/schema.prisma" ]; then
  echo "❌ Error: Must be run from the backend directory"
  echo "   Run: cd backend && bash run-migration.sh"
  exit 1
fi

# Check if database is running
echo "📡 Checking database connection..."
if ! npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
  echo "❌ Database is not running or not accessible."
  echo ""
  echo "Please ensure:"
  echo "  1. PostgreSQL is running"
  echo "  2. DATABASE_URL is correctly set in .env"
  echo "  3. Database exists and is accessible"
  echo ""
  exit 1
fi

echo "✅ Database connection successful"
echo ""

# Run migration
echo "📦 Running Prisma migration..."
npx prisma migrate dev --name add_refund_requests

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Migration failed!"
  exit 1
fi

echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Prisma client generation failed!"
  exit 1
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Restart backend server:"
echo "   npm run dev"
echo ""
echo "2. Test refund request endpoint:"
echo "   curl -X POST http://localhost:4000/api/orders/ZY-12345/refund \\"
echo "     -H \"Authorization: Bearer YOUR_JWT\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"reason\": \"Product arrived damaged\"}'"
echo ""
echo "3. Test admin refund list:"
echo "   curl http://localhost:4000/api/admin/refunds \\"
echo "     -H \"Authorization: Bearer ADMIN_JWT\""
echo ""
echo "4. Check refund system documentation:"
echo "   cat ../REFUND_SYSTEM_COMPLETE.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Refund system is now active!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
