# SilverConnect Global — China Deployment Requirements

## Compliance

| Law | Requirement |
|-----|-------------|
| PIPL (个人信息保护法) | All PII stored in mainland China |
| CSL (网络安全法) | Critical data cannot leave China |
| ICP License | Required before website goes live (2-4 weeks) |
| ICP Commercial License | Required for revenue-earning platform |
| Real-name (实名) | Mobile + ID card verification mandatory |

## Infrastructure Swap

| Australia | China |
|-----------|-------|
| Vercel | Alibaba Cloud FC + CDN |
| Supabase PostgreSQL | Alibaba RDS / PolarDB |
| Stripe | Alipay + WeChat Pay |
| Google Maps | Amap (高德地图) GCJ-02 coords |
| Email (SendGrid) | Alibaba DM / WeChat templates |
| SMS (Twilio) | Alibaba SMS |
| Push (FCM) | Huawei Push / JPush |

## Key Decisions

### WeChat Mini Program (Recommended for China)

| Factor | Web App | Mini Program |
|--------|---------|-------------|
| Distribution | URL discovery | In WeChat (1.2B users) |
| Payment | Redirect | Native 1-tap |
| Push notifications | SMS (costly) | Free templates |
| Senior adoption | Teach browser | Already use WeChat |
| Trust | Unknown URL | WeChat verified |

### Authentication Differences

- AU: Email + password → email verification
- CN: Mobile + SMS → real-name → ID card photo → face recognition

### Cost Estimate (Annual, CNY)

| Item | Cost |
|------|------|
| Alibaba Cloud | ¥50K-120K |
| Real-name verification API | ¥0.5-2/call |
| SMS | ¥0.04/msg |
| Amap API | Free (30K/day) |
| Domain (.cn) | ¥50/yr |
| **Year 1 total** | **¥100K-200K** |

## Timeline (9-12 months)

1. Entity setup (Month 1-2)
2. ICP filing (Month 2-3)
3. Infrastructure (Month 3-4)
4. Code fork + adapt (Month 4-5)
5. Real-name system (Month 5-6)
6. PIPL compliance audit (Month 6-7)
7. Beta launch, 1 city (Month 7-8)
8. Public launch (Month 9-12)
