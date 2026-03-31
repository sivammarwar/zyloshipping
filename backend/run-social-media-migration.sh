#!/bin/bash

echo "🚀 Running Social Media Automation Migration..."
echo ""

# Check if we're in the backend directory
if [ ! -f "prisma/schema.prisma" ]; then
  echo "❌ Error: Must be run from the backend directory"
  echo "   Run: cd backend && bash run-social-media-migration.sh"
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
echo "📦 Running Prisma migration for social media automation..."
npx prisma migrate dev --name add_social_media_automation

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
echo "1. Add environment variables to .env:"
echo "   FACEBOOK_APP_ID=your_app_id"
echo "   FACEBOOK_APP_SECRET=your_app_secret"
echo "   TWITTER_API_KEY=your_api_key"
echo "   TWITTER_API_SECRET=your_api_secret"
echo "   TWITTER_ACCESS_SECRET=your_access_secret"
echo "   TWITTER_BEARER_TOKEN=your_bearer_token"
echo ""
echo "2. Restart backend server:"
echo "   npm run dev"
echo ""
echo "3. Connect your social media accounts:"
echo "   POST /api/admin/social-media/accounts"
echo ""
echo "4. Create a campaign:"
echo "   POST /api/admin/social-media/campaigns"
echo ""
echo "5. Watch automated posts go live at:"
echo "   - 5:30 PM IST (7 AM EST)"
echo "   - 10:30 PM IST (12 PM EST)"
echo "   - 4:30 AM IST (6 PM EST)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Complete Guide: ../SOCIAL_MEDIA_AUTOMATION_COMPLETE.md"
echo "Implementation Summary: ../SOCIAL_MEDIA_IMPLEMENTATION_SUMMARY.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Social Media Automation is now active!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
