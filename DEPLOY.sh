#!/bin/bash
# 🌏 SilverConnect Global - Auto-Deploy to GitHub & Vercel

echo "🌏 SilverConnect Global Deployment Guide"
echo "========================================"
echo ""

# Step 1: GitHub Push
echo "📦 Step 1: Push to GitHub"
echo "---"
cd ~/silverconnect-global

# Check if remote exists
if ! git config --get remote.origin.url > /dev/null; then
    echo "Creating GitHub repository..."
    gh auth login
    gh repo create silverconnect-global \
      --public \
      --description "SilverConnect Global - Multi-Country Senior Services Platform" \
      --source=. \
      --remote=origin \
      --push
else
    echo "Remote already configured. Pushing code..."
    git push origin main
fi

echo "✅ GitHub repository created/updated"
echo "📍 Get your repo URL: gh repo view --web silverconnect-global"
echo ""

# Step 2: Supabase Setup
echo "🗄️ Step 2: Set Up Supabase Database"
echo "---"
echo "1. Go to https://supabase.com"
echo "2. Create new project: silverconnect-global"
echo "3. Go to SQL Editor"
echo "4. Copy contents of lib/schema.sql"
echo "5. Paste and execute in SQL Editor"
echo "6. Copy API credentials to .env.local"
echo ""

# Step 3: Vercel Deployment
echo "🚀 Step 3: Deploy to Vercel"
echo "---"
echo "Run this command:"
echo "  npx vercel --prod"
echo ""
echo "Then:"
echo "1. Follow the prompts"
echo "2. Connect your GitHub repository"
echo "3. Add environment variables from .env.local"
echo "4. Deploy!"
echo ""

# Step 4: Local Testing
echo "✅ Step 4: Test Locally (Optional)"
echo "---"
echo "npm run dev"
echo "# Open http://localhost:3000"
echo ""

echo "🎉 Deployment guide complete!"
echo ""
echo "Need help?"
echo "- GitHub: gh repo view silverconnect-global --web"
echo "- Docs: Open README.md"
echo "- Supabase: https://supabase.com"
echo "- Vercel: https://vercel.com"
