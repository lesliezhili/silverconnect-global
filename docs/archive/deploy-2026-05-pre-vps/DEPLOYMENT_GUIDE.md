# 🚀 SilverConnect Global - Deployment Guide

## Prerequisites

- Node.js 20.x
- npm 10.x
- GitHub account
- Vercel account (for deployment)
- Supabase account
- Stripe account

---

## 1. 🗄️ Supabase Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `silverconnect-global`
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users (e.g., `Australia East` for AU/CN/CA)
5. Click "Create new project"

### Get Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://[your-project-id].supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ Keep this secret!)

### Database Setup

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `lib/schema.sql` from your project
3. Paste and run it to create all tables and policies

### Alternative: Supabase CLI (Optional)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Initialize (if not already done)
supabase init

# Link to your project
supabase link --project-ref [your-project-id]

# Push schema
supabase db push
```

---

## 2. 💳 Stripe Setup

### Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete account verification (may take 1-2 days for full activation)

### Get Stripe Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy these keys:
   - **Publishable key**: `pk_test_...` (for development) or `pk_live_...` (for production)
   - **Secret key**: `sk_test_...` (for development) or `sk_live_...` (for production)

### Stripe Connect Setup (for Provider Payouts)

1. In Stripe Dashboard, go to **Settings** → **Connect**
2. Enable "Express accounts" for provider onboarding
3. Copy your **Client ID** from the Connect settings

### Webhook Setup

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `account.updated` (for Connect accounts)
5. Copy the **Webhook signing secret**

---

## 3. 🔧 Environment Variables Setup

### For Vercel Deployment

1. In your Vercel dashboard, go to your project settings
2. Go to **Environment Variables**
3. Add these variables:

```bash
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://silverconnect-global.vercel.app

# Supabase (from step 1)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (from step 2)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Platform Configuration
PLATFORM_FEE_PERCENT=20
```

### For Local Development (.env.local)

Create a `.env.local` file in your project root:

```bash
# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Platform Configuration
PLATFORM_FEE_PERCENT=20
```

---

## 4. 🚀 Vercel Deployment

### Method 1: GitHub Integration (Recommended)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. In Vercel dashboard:
   - Click "Import Project"
   - Connect your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Add environment variables (from step 3)
   - Click "Deploy"

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
```

---

## 5. 🧪 Testing Deployment

### Run Tests Locally

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run E2E tests (requires local dev server)
npm run dev &
npm run test:e2e
```

### Test Live Deployment

1. Visit your deployed URL
2. Test user registration
3. Test booking flow
4. Test provider onboarding
5. Test payment processing

---

## 6. 🔒 Security Checklist

- [ ] Supabase RLS policies are active
- [ ] Stripe webhook signature verification is working
- [ ] Environment variables are not exposed in client-side code
- [ ] Database backups are configured in Supabase
- [ ] SSL certificate is active (Vercel handles this)
- [ ] CORS settings are correct

---

## 7. 📊 Monitoring & Analytics

### Supabase Monitoring
- Go to **Reports** → **API** for usage stats
- Monitor database performance in **Reports** → **Database**

### Stripe Monitoring
- Dashboard → **Balance** for transaction overview
- **Radar** for fraud detection
- **Connect** for provider account management

### Vercel Monitoring
- **Analytics** for performance metrics
- **Functions** for serverless function logs
- **Deployments** for build/deployment status

---

## 8. 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**
- Check Supabase URL and keys
- Verify RLS policies allow your operations
- Check Supabase project status

**Payment Processing Failed**
- Verify Stripe keys are correct
- Check webhook endpoint is accessible
- Ensure Stripe account is fully activated

**Build Failed**
- Check Node.js version (must be 20.x)
- Verify all dependencies are installed
- Check for TypeScript errors

**Environment Variables Not Working**
- Ensure variables are set in Vercel dashboard
- Check variable names match exactly
- Redeploy after adding variables

---

## 9. 📞 Support

- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)

---

## 10. 💰 Cost Estimation

### Supabase (Free Tier + Paid)
- **Free**: 500MB database, 50MB file storage, 2GB bandwidth
- **Pro**: ~$25/month for production usage

### Stripe
- **Transaction Fees**: 2.9% + 30¢ per transaction
- **Connect Fees**: Additional 0.25% for provider payouts
- **Platform Fee**: Your configured percentage (20%)

### Vercel
- **Hobby**: Free for personal projects
- **Pro**: ~$20/month for production apps

---

## 🎉 You're Live!

Once everything is configured, your SilverConnect Global platform will be live at:
**https://silverconnect-global.vercel.app/**

Test all features thoroughly before announcing to users!