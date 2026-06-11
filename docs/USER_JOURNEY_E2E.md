# SilverConnect Global — E2E User Journey (Australia)

## Customer Flow

| Step | Page | Action |
|------|------|--------|
| 1 | `/` | Landing → "Join SilverConnect — Free" |
| 2 | `/auth/register` | Name + Email + Password → auto sign-in |
| 3 | `/home` | Browse service categories |
| 4 | `/search?category=cleaning` | Smart-ranked provider results |
| 5 | `/providers/[id]` | Provider profile, reviews, pricing |
| 6 | `/bookings/new` | 4-step wizard: service → date → address → confirm |
| 7 | `/pay/[bookingId]` | Invoice + payment (simulated Stripe) |
| 8 | `/bookings/[id]` | Track booking status |
| 9 | `/bookings/[id]/review` | Star rating + comment |

## Provider Flow

| Step | Page | Action |
|------|------|--------|
| 1 | `/auth/register` | Same unified signup (customer default) |
| 2 | `/profile` | "Want to help others?" CTA |
| 3 | `/provider/register` | 5-step wizard: info → ID → services → availability → review |
| 4 | `/provider` | Dashboard: jobs, earnings, rating |
| 5 | `/provider/jobs` | Accept/decline incoming bookings |
| 6 | `/provider/jobs/[id]` | Job detail → mark complete → claim parking |
| 7 | `/provider/bank` | View earnings, request payout |

## Payment Flow

```
Customer books → PaymentIntent created (authorized)
    → Provider completes job → Payment captured
    → 15% platform commission deducted
    → Provider wallet credited (pending)
    → Hold period expires (cron) → available balance
    → Provider requests payout → bank transfer
```

## Billing Example (AU, 2h cleaning + parking)

| Line | Amount |
|------|--------|
| Service (2h × A$55) | A$110.00 |
| Parking (receipt) | A$12.50 |
| Service charge (5%) | A$5.50 |
| Platform fee (15%) | A$16.50 |
| GST (10%) | A$14.45 |
| **Customer total** | **A$158.95** |
| Provider receives | A$108.50 |

## Safety Features

- Emergency duress button (always visible, 72px red)
- GPS check-in/check-out for provider
- Photo evidence of work completed
- Fall detection integration
- Family member status API (`/api/family/status/[elderId]`)

## Current Limitations

1. SMTP not configured (verification codes in DB only)
2. Payments simulated (no real Stripe charges)
3. No geocoding (addresses stored as text)
4. Background checks self-declared
5. Provider approval auto-pending (no admin queue UI)
