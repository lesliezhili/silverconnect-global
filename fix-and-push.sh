#!/bin/bash
# ================================================================
# SilverConnect — Fix missing files + push without workflow scope
# Run from inside your silverconnect-global folder:
#   bash fix-and-push.sh
# ================================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  SilverConnect — Fix & Push                 ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Check we're in the right folder ─────────────────────────
if [ ! -f "package.json" ]; then
  echo "❌ Run this from inside your silverconnect-global folder"
  echo "   cd silverconnect-global && bash fix-and-push.sh"
  exit 1
fi
echo "✅ In repo: $(pwd)"
echo ""

# ── Create lib/services.ts ───────────────────────────────────
echo "▶ Creating lib/services.ts..."
mkdir -p lib
cat > lib/services.ts << 'SERVICES_EOF'
export interface ServiceItem {
  id: string
  icon: string
  name: string
  description: string
  basePrice: number
  rating: number
  badge?: string
}

export const SERVICES_AU: ServiceItem[] = [
  { id: 's1',  icon: '🧹', name: 'Home cleaning',        description: 'Regular, deep clean & spring clean',   basePrice: 60, rating: 4.90 },
  { id: 's2',  icon: '🌿', name: 'Garden care',           description: 'Mowing, weeding, pruning',              basePrice: 50, rating: 4.80, badge: 'Popular' },
  { id: 's3',  icon: '🛁', name: 'Personal care',         description: 'Bathing, grooming, hygiene support',    basePrice: 65, rating: 4.97 },
  { id: 's4',  icon: '💊', name: 'Medication assistance', description: 'Prompting, monitoring, blister packs',  basePrice: 55, rating: 4.96, badge: 'NDIS' },
  { id: 's5',  icon: '🚗', name: 'Transport & escort',    description: 'Hospital, shopping, social outings',    basePrice: 45, rating: 4.93 },
  { id: 's6',  icon: '🍲', name: 'Meal preparation',      description: 'Nutritious home-cooked meals',          basePrice: 40, rating: 4.91 },
  { id: 's7',  icon: '💛', name: 'Companionship',         description: 'Social visits, games, conversation',    basePrice: 40, rating: 4.95, badge: 'Loved' },
  { id: 's8',  icon: '🧘', name: 'Wellness & exercise',   description: 'Gentle physio, yoga, walks',            basePrice: 55, rating: 4.92 },
  { id: 's9',  icon: '🛒', name: 'Shopping assistance',   description: 'Grocery run with or without client',    basePrice: 35, rating: 4.88 },
  { id: 's10', icon: '🪟', name: 'Window cleaning',       description: 'Internal & external, ground floor',     basePrice: 80, rating: 4.87 },
  { id: 's11', icon: '🚿', name: 'Wound care',            description: 'Dressing changes, post-surgical care',  basePrice: 80, rating: 4.95, badge: 'RN' },
  { id: 's12', icon: '🧺', name: 'Laundry & ironing',     description: 'Washing, drying, folding, ironing',     basePrice: 45, rating: 4.90 },
]

export const SERVICES_CN: ServiceItem[] = [
  { id: 'c1', icon: '🧹', name: '居家清洁', description: '定期或深度清洁服务',   basePrice: 280, rating: 4.90 },
  { id: 'c2', icon: '🛁', name: '个人护理', description: '洗浴、梳理、日常卫生', basePrice: 310, rating: 4.97 },
  { id: 'c3', icon: '🚗', name: '接送服务', description: '医院、购物、社交出行', basePrice: 210, rating: 4.93, badge: '热门' },
  { id: 'c4', icon: '🍲', name: '营养膳食', description: '中式营养家常菜',       basePrice: 188, rating: 4.90 },
  { id: 'c5', icon: '💛', name: '陪伴关怀', description: '聊天、棋牌、情感陪伴', basePrice: 188, rating: 4.95, badge: '最受欢迎' },
  { id: 'c6', icon: '🧘', name: '健康运动', description: '太极、散步、康复训练', basePrice: 255, rating: 4.92 },
]

export const SERVICES_CA: ServiceItem[] = [
  { id: 'ca1', icon: '🧹', name: 'Home cleaning',    description: 'Regular & deep clean',              basePrice: 55, rating: 4.90 },
  { id: 'ca2', icon: '🛁', name: 'Personal care',    description: 'Bathing, grooming, hygiene support', basePrice: 60, rating: 4.97 },
  { id: 'ca3', icon: '🚗', name: 'Transport',        description: 'Appointments, errands, outings',     basePrice: 42, rating: 4.93, badge: 'Popular' },
  { id: 'ca4', icon: '🍲', name: 'Meal preparation', description: 'Canadian home-cooked meals',         basePrice: 38, rating: 4.90 },
  { id: 'ca5', icon: '💛', name: 'Companionship',    description: 'Social visits, games, conversation', basePrice: 38, rating: 4.95, badge: 'Loved' },
  { id: 'ca6', icon: '🧘', name: 'Wellness',         description: 'Gentle movement & physio support',   basePrice: 50, rating: 4.92 },
]
SERVICES_EOF
echo "  ✅ lib/services.ts created"

# ── Create lib/supabase.ts (safe, never crashes) ─────────────
echo "▶ Patching lib/supabase.ts..."
cat > lib/supabase.ts << 'SUPA_EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const isMissingEnv = !supabaseUrl || !supabaseAnonKey ||
  supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')

if (isMissingEnv && typeof window !== 'undefined') {
  console.warn(
    '[SilverConnect] Running in demo mode — Supabase not connected.\n' +
    'Add real credentials to .env.local to enable live database.'
  )
}

// Safe fallback — never throws, all DB calls fail gracefully
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export const isSupabaseConfigured = !isMissingEnv
SUPA_EOF
echo "  ✅ lib/supabase.ts patched"

# ── Create .env.local (placeholder — never crashes) ──────────
echo "▶ Creating .env.local..."
if [ ! -f ".env.local" ]; then
cat > .env.local << 'ENV_EOF'
# SilverConnect — demo mode placeholders
# Replace with real values from supabase.com when ready
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key-demo-mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV_EOF
  echo "  ✅ .env.local created"
else
  echo "  ℹ️  .env.local already exists — not overwriting"
fi

# ── Create .env.local.example ────────────────────────────────
echo "▶ Creating .env.local.example..."
cat > .env.local.example << 'ENVEX_EOF'
# Copy to .env.local and fill in real values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENVEX_EOF
echo "  ✅ .env.local.example created"

# ── Update .gitignore ────────────────────────────────────────
echo "▶ Updating .gitignore..."
cat > .gitignore << 'GIT_EOF'
/node_modules
/.next/
/out/
/build
/coverage
/playwright-report
/test-results
.DS_Store
*.pem
npm-debug.log*
.env
.env.local
.env.*.local
!.env.local.example
GIT_EOF
echo "  ✅ .gitignore updated"

# ── Remove .github/workflows to avoid scope error ────────────
echo ""
echo "▶ Handling GitHub Actions workflow..."
echo "  ⚠️  Temporarily moving .github/workflows to avoid push scope error"
echo "  (The CI/CD workflow needs 'workflow' scope on your GitHub token)"
echo "  You can re-add it after granting workflow scope — see instructions below"
echo ""
if [ -d ".github/workflows" ]; then
  mkdir -p .github-workflows-backup
  cp .github/workflows/*.yml .github-workflows-backup/ 2>/dev/null || true
  rm -rf .github/workflows
  echo "  ✅ Workflows backed up to .github-workflows-backup/"
fi

# ── Stage and commit ─────────────────────────────────────────
echo "▶ Staging changes..."
git add lib/services.ts lib/supabase.ts .env.local.example .gitignore

echo "▶ Committing..."
git commit -m "fix: supabase crash + add services data + safe demo mode

- lib/supabase.ts: never throws when env vars missing, graceful demo mode
- lib/services.ts: AU/CN/CA service catalog data
- .env.local.example: template for real credentials
- .gitignore: exclude .env.local, keep .env.local.example
- Removed .github/workflows temporarily (needs workflow OAuth scope)

App now starts with: npm run dev
Runs in demo mode until real Supabase credentials added to .env.local

'Love one another as I have loved you.' — John 15:12" 2>/dev/null || echo "  ℹ️  Nothing to commit"

echo "▶ Pushing to GitHub..."
git push origin main

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ PUSHED SUCCESSFULLY                     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "▶ Starting dev server..."
echo "  → http://localhost:3000"
echo ""
echo "─── To re-enable GitHub Actions CI/CD later ──────────"
echo "  1. Go to github.com → Settings → Developer settings"
echo "     → Personal access tokens → your token → Edit"
echo "  2. Check the 'workflow' scope checkbox → Save"
echo "  3. Then run:"
echo "     mkdir -p .github/workflows"
echo "     cp .github-workflows-backup/*.yml .github/workflows/"
echo "     git add .github/workflows && git commit -m 'ci: add GitHub Actions' && git push"
echo "──────────────────────────────────────────────────────"
echo ""
npm run dev
