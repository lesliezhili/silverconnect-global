# SilverConnect Global - Complete Platform Documentation

## 🎯 Project Overview

**SilverConnect Global** is a comprehensive senior care marketplace platform serving Australia, China, and Canada with Uber/Airbnb-like features for booking services, provider matching, real-time messaging, and dual feedback systems.

### Supported Regions & Currencies
- 🇦🇺 **Australia** - AUD
- 🇨🇳 **China** - CNY
- 🇨🇦 **Canada** - CAD

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16.2.4 with Turbopack, React 19, TailwindCSS
- **Backend**: Supabase PostgreSQL with Row Level Security (RLS)
- **Payments**: Stripe (multi-currency support)
- **Real-time**: Supabase WebSockets for messaging
- **Geolocation**: Haversine distance calculation, Browser Geolocation API

### Project Structure
```
/app
  /api
    /create-payment-intent     # Stripe payment initialization
    /refund-payment            # Stripe refund processing
    /webhooks/stripe           # Stripe webhook handler
  /page.tsx                     # Main dashboard & service browsing
  /layout.tsx                   # App layout wrapper
  /globals.css                  # Global styles

/components
  /AuthModal.tsx               # Login/signup authentication
  /BookingModal.tsx            # Service booking form
  /SignupModal.tsx             # Dual customer/provider signup
  /ProviderCard.tsx            # Provider profile card with rating/distance
  /BookingStatusFlow.tsx       # Uber-like booking status management
  /ChatModal.tsx               # Real-time messaging interface
  /FeedbackModal.tsx           # Dual feedback system
  /ServiceCard.tsx             # Service listing card
  /Header.tsx                  # Navigation header
  /CountrySelector.tsx         # Country/language selector

/lib
  /supabase.ts                 # Supabase client initialization
  /schema.sql                  # Database schema with RLS policies
  /translations.ts             # i18n system (English + Chinese)
  /locationUtils.ts            # Geolocation & distance calculations
  /paymentUtils.ts             # Stripe integration utilities

/public
  /images                      # Static assets

/scripts
  /seed-providers.ts           # Test data generation
```

---

## 🗄️ Database Schema

### Core Tables

**users** - Customer and provider profiles
```sql
- id (UUID primary key)
- email, full_name, phone
- user_type: 'customer' | 'provider'
- country_code, city, address, postal_code
- latitude, longitude (for geolocation)
- preferred_language
- medical_notes, emergency_contact_*
```

**service_providers** - Provider details & ratings
```sql
- id, user_id (linked to users)
- specialties[] (array of service names)
- years_experience, certifications[]
- rating (0-5), total_ratings
- is_verified, bio, profile_image
```

**services** - Available services catalog
```sql
- id, category, name, description
- duration_minutes, requires_material
- 25 services across 6 categories:
  - Cleaning (5), Cooking (5), Gardening (5)
  - Personal Care (5), Maintenance (5)
```

**service_prices** - Multi-country pricing
```sql
- service_id, country_code
- base_price, price_with_tax
- Configured for AU/CN/CA
```

**bookings** - Service reservations
```sql
- user_id, service_id, provider_id
- booking_date, booking_time, address
- status: PENDING | CONFIRMED | COMPLETED | CANCELLED
- total_price, payment_status
- stripe_payment_intent_id
- special_instructions
```

**payment_transactions** - Stripe payment tracking
```sql
- booking_id, stripe_payment_intent_id
- amount, currency, status
- customer_email, created_at
```

**conversations** - Messaging between customers & providers
```sql
- booking_id (linked booking)
- customer_id, provider_id
- last_message, last_message_at
- customer_read_at, provider_read_at
```

**messages** - Individual messages in conversations
```sql
- conversation_id
- sender_id, content
- is_read, read_at, created_at
```

**booking_status_history** - Audit trail
```sql
- booking_id, old_status, new_status
- changed_by (user_id), reason
- created_at (timestamp)
```

**customer_feedback** & **provider_feedback** - Dual rating system
```sql
- booking_id, customer_id, provider_id
- rating (1-5 stars)
- punctuality_rating, professionalism_rating, quality_rating
- would_rebook / would_service_again
- review text, created_at
```

---

## 🔐 Row Level Security (RLS) Policies

All tables have strict RLS enabled:

### Key Policies
- **Users**: Can only view own profile
- **Bookings**: Customers see own bookings, providers see assigned bookings
- **Messages**: Only conversation participants can view/send messages
- **Services & Providers**: Public read access for browsing
- **Feedback**: Users can only view their own feedback
- **Payment Transactions**: Only booking owner can view

---

## 🌐 Internationalization (i18n)

**Supported Languages**: English (en), Simplified Chinese (zh)

**Language Detection**:
- 🇦🇺 Australia → English
- 🇨🇳 China → Chinese
- 🇨🇦 Canada → English

**80+ Translation Keys**:
```typescript
t('heroTitle')           // "Quality Care for Your Golden Years"
t('bookNow')            // "Book Now"
t('myBookings')         // "My Bookings"
t('filterByDistance')   // "Near Me (1km)"
t('upcomingServices')   // "Upcoming Services"
```

---

## 📍 Geolocation Features

### Distance Calculation
- **Formula**: Haversine formula (great-circle distance)
- **Radius Filter**: 1km proximity search
- **Sorting Options**:
  - By Rating (default)
  - By Distance (nearest first)
  - By Specialty (match user needs)

### Browser Geolocation
```typescript
requestUserLocation()    // Uses Geolocation API
fallbackLocation         // Sydney coordinates (-33.8688, 151.2093)
```

---

## 💳 Payment Integration

### Stripe Multi-Currency Support
- **AUD** (Australia): $60-$90 for most services
- **CNY** (China): ¥280-¥840 for most services
- **CAD** (Canada): $55-$82 for most services

### Payment Flow
1. **Create Intent** → `POST /api/create-payment-intent`
2. **Client-side Collection** → Stripe Elements
3. **Webhook Confirmation** → `POST /api/webhooks/stripe`
4. **Status Update** → Booking marked PAID/COMPLETED

### Webhook Events Handled
```
payment_intent.succeeded    → Update booking to CONFIRMED
payment_intent.payment_failed → Update booking to FAILED
charge.refunded             → Update transaction status
```

---

## 💬 Real-Time Messaging

### Features
- Real-time message delivery (Supabase WebSockets)
- Read receipts (is_read, read_at)
- Conversation history
- Automatic participant detection

### Usage Flow
```typescript
1. User clicks "Send Message" on booking
2. ChatModal creates/fetches conversation
3. Messages displayed with real-time updates
4. Timestamps show message delivery time
5. Provider & customer can communicate before/during service
```

---

## 🎫 Booking Status Flow (Uber-like)

### Status Progression
```
PENDING → Provider Review
    ├─ ✓ ACCEPT → CONFIRMED → SERVICE → COMPLETED
    └─ ✕ DECLINE → CANCELLED
```

### Provider Actions (PENDING)
- **Accept**: Confirms availability, booking confirmed
- **Decline**: Can provide reason (weather, illness, etc.)

### Customer Actions
- **View Status**: Real-time booking status
- **Cancel**: Before provider accepts (refund eligibility)
- **Message**: Communicate with provider
- **Leave Feedback**: After completion

### Booking Status History
All status changes logged with:
- Previous status, new status
- User who made change
- Timestamp
- Optional reason (for rejections)

---

## ⭐ Dual Feedback System

### Customer Feedback (rates provider)
- Overall rating (1-5 stars)
- Punctuality rating (1-5)
- Professionalism rating (1-5)
- Quality rating (1-5)
- Optional written review
- Would rebook? (yes/no)

### Provider Feedback (rates customer)
- Overall rating (1-5 stars)
- Customer preparation rating
- Accessibility rating
- Communication rating
- Optional written review
- Would service again? (yes/no)

### Automatic Rating Calculation
Provider's average rating automatically recalculated after each booking completion.

---

## 🔐 Authentication

### Sign-up Flow

**Customer Signup**:
1. Email, password
2. Full name, phone
3. Geolocation captured
4. Creates user with type='customer'

**Provider Signup**:
1. Email, password
2. Full name, phone, bio
3. Years of experience
4. Select specialties
5. Geolocation captured
6. Creates user + service_provider record
7. Account requires admin verification

### Session Management
- JWT tokens via Supabase Auth
- 1-hour token expiration
- Refresh tokens for long-term sessions
- RLS automatically enforces user isolation

---

## 🧪 Test Data

### Pre-populated Providers (9 total)

**Australia (Sydney, Melbourne, Brisbane)**
- Maria Santos: Cleaner, 8 years, 4.9★ (48 reviews)
- James Cook: Chef, 15 years, 4.95★ (62 reviews)
- Sarah Johnson: Caregiver, 6 years, 4.85★ (35 reviews)

**China (Shanghai, Beijing, Guangzhou)**
- Zhang Wei (张伟): Cleaner, 10 years, 4.9★ (71 reviews)
- Wang Li (王丽): Chef, 20 years, 4.97★ (89 reviews)
- Liu Mei (刘美): Caregiver, 8 years, 4.88★ (52 reviews)

**Canada (Montreal, Toronto, Vancouver)**
- Pierre Dupont: Cleaner, 12 years, 4.92★ (56 reviews)
- Jennifer Green: Chef, 14 years, 4.94★ (68 reviews)
- Michael Chen: Tech Support, 7 years, 4.87★ (44 reviews)

### Seed Providers
```bash
npx tsx scripts/seed-providers.ts
```

---

## 📊 Service Categories (25 Services)

### 🧹 Cleaning (5 services)
- Standard Home Cleaning
- Deep Cleaning
- Window Cleaning
- Oven & Fridge Cleaning
- Carpet Steam Cleaning

### 🍳 Cooking (5 services)
- Weekly Meal Prep
- Daily Home Cooking
- Special Diet Meals
- Festive Feast Preparation
- Baking Service

### 🌿 Gardening (5 services)
- Lawn Mowing & Edging
- Hedge & Shrub Trimming
- Complete Garden Tidy
- Tree Pruning
- Seasonal Planting

### ❤️ Personal Care (5 services)
- Shopping Assistant
- Medication Management
- Companionship Visit
- Transport to Appointments
- Technology Help

### 🔧 Maintenance (5 services)
- Handyman Services
- Air Conditioner Service
- Gutter Cleaning
- Snow Shoveling (Canada only)
- Pressure Washing

---

## 🚀 API Endpoints

### Payment APIs

**POST /api/create-payment-intent**
```json
{
  "bookingId": "uuid",
  "amount": 6000,           // cents
  "currency": "AUD",        // AUD, CNY, CAD
  "customerEmail": "user@example.com"
}
Response: { clientSecret: "pi_xxx_secret_xxx" }
```

**POST /api/refund-payment**
```json
{
  "paymentIntentId": "pi_xxx"
}
Response: { refundId: "re_xxx", status: "succeeded" }
```

### Webhook

**POST /api/webhooks/stripe**
- Handles `payment_intent.succeeded`
- Handles `payment_intent.payment_failed`
- Handles `charge.refunded`
- Updates booking and payment transaction status

---

## 📱 Frontend Components

### ChatModal
Real-time messaging between customer and provider
```typescript
<ChatModal
  isOpen={boolean}
  onClose={() => void}
  bookingId={string}
  providerId={string}
  customerId={string}
  providerName={string}
  currentUserId={string}
/>
```

### BookingStatusFlow
Displays booking status with provider/customer actions
```typescript
<BookingStatusFlow
  booking={Booking}
  service={Service}
  provider={Provider}
  user={User}
  language={Language}
  onStatusChange={() => void}
  onChatOpen={() => void}
/>
```

### ProviderCard
Provider profile with distance, rating, specialties
```typescript
<ProviderCard
  provider={ServiceProvider}
  userLat={number}
  userLon={number}
  language={Language}
  onBook={(provider) => void}
/>
```

---

## ⚙️ Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ukgolkaejlfhcqhudmve.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# App
NEXT_PUBLIC_APP_URL=https://silverconnect-global.vercel.app
```

---

## 🎯 Key Features Implemented

✅ **Multi-region Support** (AU/CN/CA)
✅ **Internationalization** (English + Chinese)
✅ **Geolocation-based Provider Search** (1km radius)
✅ **Stripe Multi-currency Payments** (AUD/CNY/CAD)
✅ **Real-time Messaging** (WebSocket-based)
✅ **Booking Status Management** (Uber-like flow)
✅ **Dual Feedback System** (customer ↔ provider)
✅ **Provider Verification** (admin panel)
✅ **Row Level Security** (data isolation)
✅ **Webhook Integration** (payment confirmation)

---

## 🔄 User Workflows

### Customer Journey
1. **Sign Up** → Select country → Geolocation capture
2. **Browse Services** → Filter by category
3. **Select Provider** → Sort by rating/distance
4. **Book Service** → Confirm time & location
5. **Make Payment** → Stripe payment form
6. **Wait for Acceptance** → Provider reviews booking
7. **Communicate** → Real-time messaging
8. **Service Delivery** → Provider marks complete
9. **Leave Feedback** → Rate provider (1-5★)

### Provider Journey
1. **Sign Up** → Select specialties → Get verified
2. **Set Availability** → Configure schedule
3. **Accept Bookings** → Review incoming requests
4. **Communicate** → Message with customer
5. **Complete Service** → Mark as done
6. **Leave Feedback** → Rate customer experience

---

## 📈 Next Steps & Enhancements

### Phase 2 Potential Features
- Payment method saved cards
- Subscription plans
- Provider dashboard with earnings
- In-app video calling
- Service history archive
- Advanced analytics
- SMS/Email notifications
- Admin verification dashboard

---

## 🆘 Support

For issues or questions:
1. Check environment variables in `.env.local`
2. Verify Stripe webhook secret is configured
3. Ensure Supabase RLS policies are enabled
4. Check browser console for client-side errors
5. Review Next.js build output for compilation issues

---

**Last Updated**: 2025-01-13
**Version**: 1.0.0 - Full Platform Release
