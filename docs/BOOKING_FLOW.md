# SilverConnect Booking Flow — End to End

## Overview
Complete lifecycle from booking to payment, with safety evidence and two-way feedback.

## Flow Diagram

```
Customer books service
       ↓
┌─────────────────────────────────────────┐
│ PRE-BOOKING CHECK                        │
│ • Customer must have card on file        │
│ • Provider must have BSB/account number  │
│ API: GET /api/payments/check-ready       │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ STEP 1: BOOK & PAY 100% UPFRONT         │
│ • Customer selects service + provider    │
│ • Full payment captured immediately      │
│ • Booking status: "confirmed"            │
│ • Payment status: "captured"             │
│ API: POST /api/bookings/create           │
│ API: POST /api/payments/create-intent    │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ STEP 2: REMINDERS (both parties)         │
│ • 24 hours before: confirmation          │
│ • 12 hours before: prepare               │
│ • 8 hours before: ready check            │
│ • 4 hours before: final reminder         │
│ CRON: GET /api/cron/reminders (hourly)   │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ STEP 3: SERVICE START (Provider)         │
│ • Provider arrives at location           │
│ • Takes BEFORE photos/video              │
│ • Booking status: "in_progress"          │
│ API: POST /api/bookings/[id]/evidence    │
│   body: { type:"before", mediaType:"photo", url:"..." }
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ STEP 4: SERVICE COMPLETION (Provider)    │
│ • Provider finishes work                 │
│ • Takes AFTER photos/video               │
│ • Marks job as complete                  │
│ • Booking status: "completed"            │
│ API: POST /api/bookings/[id]/evidence    │
│   body: { type:"after", mediaType:"photo", url:"..." }
│ API: POST /api/bookings/[id]/complete    │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ STEP 5: TWO-WAY FEEDBACK                 │
│ • Customer rates provider (1-5 ★)        │
│ • Provider rates customer (1-5 ★)        │
│ • Both can leave comments                │
│ API: POST /api/bookings/[id]/feedback    │
│   body: { rating: 5, comment: "..." }    │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ STEP 6: PLATFORM PAYS PROVIDER           │
│ • After customer feedback received       │
│ • Platform deducts 15% service fee       │
│ • Remaining 85% → provider BSB/account   │
│ • Booking status: "released"             │
│ • Payment credited to provider wallet    │
│ • Provider can request payout anytime    │
│ API: POST /api/payments/payout           │
└─────────────────────────────────────────┘

## Payment Method Requirements

### Before Booking (MANDATORY)

| Role | Requirement | Purpose |
|------|-------------|---------|
| Customer | Credit/debit card on file | Pay 100% upfront for service |
| Provider | BSB + Account Number | Receive payout after completion |

### Payment Check API
```
GET /api/payments/check-ready
Response: { ready: true/false, missing: [...], hasCard: bool, hasBankAccount: bool }
```

If not ready, UI shows a blocking message:
- Customer: "Please add a payment card before booking" → /settings/payment
- Provider: "Please add your BSB and account number" → /provider/bank

## Reminder Schedule

| Time Before | Customer Message | Provider Message |
|-------------|-----------------|------------------|
| 24 hours | "Service is tomorrow" | "You have a job tomorrow" |
| 12 hours | "Service in 12 hours" | "Job starts in 12 hours" |
| 8 hours | "Prepare your home" | "Check address, plan travel" |
| 4 hours | "Helper arrives soon" | "Expected in 4 hours" |

## Service Evidence Requirements

Providers MUST upload photographic evidence:

### Before Service
- Minimum 1 photo of the work area before starting
- Optional: short video showing initial state
- Timestamped and geotagged

### After Service
- Minimum 1 photo of the completed work
- Optional: short video showing results
- Must be uploaded BEFORE marking job complete

### Purpose
- Protects both parties in disputes
- Ensures accountability and quality
- Visible to customer in app

## Fee Structure

| Component | Amount |
|-----------|--------|
| Service price | 100% (set by provider) |
| Platform fee | 15% of total |
| Provider receives | 85% of total |
| GST (Australia) | Included in price |

## Payout Timeline
- Funds released: immediately after customer feedback
- BSB/account transfer: 1-2 business days (simulated instant in MVP)
- Provider can view balance: /provider/bank
- Provider can request payout: POST /api/payments/payout
