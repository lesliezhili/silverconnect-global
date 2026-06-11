# 九鼎 (9tripod) — Alibaba Cloud Deployment Guide

## Architecture
```
Users (China) → Alibaba CDN → SLB → ACK (K8s) → Next.js pods
                                          ↓
                              PolarDB (PostgreSQL-compatible)
                              OSS (object storage / uploads)
```

## Prerequisites
1. **ICP Filing (备案)**: Apply via Alibaba Cloud console → `备案` section
   - Entity type: 企业 (enterprise)
   - Domain: `jiuding.cn` or `9tripod.cn`
   - Approval: ~20 working days
2. **Alibaba Cloud Account**: Enterprise verified (企业实名认证)
3. **Domain**: Purchase `jiuding.cn` via Wanwang (万网)

## Services Used
| Service | Purpose | Region |
|---------|---------|--------|
| ACK (容器服务) | Kubernetes hosting | cn-shanghai |
| PolarDB | PostgreSQL-compatible DB | cn-shanghai |
| OSS | File/image storage | cn-shanghai |
| CDN | China-wide edge caching | Multi-region |
| SLB | Load balancer | cn-shanghai |
| RAM | IAM / access control | Global |
| SMS (短信服务) | OTP verification | cn-shanghai |
| ACR (容器镜像) | Docker registry | cn-shanghai |

## Quick Start
```bash
# 1. Build Docker image
docker build -t jiuding-web -f deploy/alibaba-cloud/Dockerfile .

# 2. Tag and push to Alibaba Container Registry
docker tag jiuding-web registry.cn-shanghai.aliyuncs.com/jiuding/web:latest
docker push registry.cn-shanghai.aliyuncs.com/jiuding/web:latest

# 3. Deploy to ACK
kubectl apply -f deploy/alibaba-cloud/k8s-deployment.yaml

# 4. Verify
kubectl get pods -n jiuding-prod
```

## Environment Variables (China)
```env
# Database (PolarDB)
DATABASE_URL=postgresql://jiuding:***@pc-xxx.polardb.rds.aliyuncs.com:5432/jiuding

# WeChat Pay
WECHAT_PAY_MERCHANT_ID=your_merchant_id
WECHAT_PAY_APP_ID=your_app_id
WECHAT_PAY_SERIAL_NO=your_cert_serial
WECHAT_PAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
WECHAT_PAY_API_V3_KEY=your_v3_key

# Alipay
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do

# Alibaba Cloud SMS
ALIBABA_SMS_ACCESS_KEY=your_key
ALIBABA_SMS_SECRET=your_secret
ALIBABA_SMS_SIGN_NAME=九鼎

# App
NEXT_PUBLIC_APP_URL=https://www.jiuding.cn
NEXT_PUBLIC_COUNTRY=CN
```

## Key Differences vs Vercel (AU/Global)
| Feature | Vercel (Global) | Alibaba Cloud (CN) |
|---------|----------------|-------------------|
| Payment | Stripe | WeChat Pay + Alipay |
| Auth SMS | Twilio | Alibaba SMS |
| Email | Resend/Postmark | Alibaba DirectMail |
| CDN | Vercel Edge | Alibaba CDN |
| Analytics | Vercel Analytics | China Analytics TBD |
| Maps | Google Maps | Amap (高德地图) |
| Fonts | next/font (self-hosted ✅) | Same ✅ |

## Cost Estimate (monthly)
- ACK (3x 2vCPU/4GB): ~¥1,200/mo
- PolarDB (2vCPU/8GB): ~¥800/mo
- CDN (100GB): ~¥100/mo
- OSS (50GB): ~¥50/mo
- SLB: ~¥100/mo
- Domain + ICP: one-time ¥100
- **Total: ~¥2,250/mo (~A$500/mo)**
