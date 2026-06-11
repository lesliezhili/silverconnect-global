#!/bin/bash
# SilverConnect Global — Deploy to Vercel + Run Neon Migrations
set -e

echo "🚀 SilverConnect Global Deployment"
echo "=================================="

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Run migrations
echo "🗄️  Running database migrations..."
node scripts/run-migrations.mjs

# 3. Build check
echo "🔨 Building..."
npx next build

# 4. Deploy to Vercel
echo "☁️  Deploying to Vercel..."
npx vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo "🌏 Live at: https://silverconnect-global.vercel.app"
