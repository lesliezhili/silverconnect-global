# 🚀 Quick Start Guide

## 5 Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3. Start Development Server
```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## Full Local Setup with Docker

### Start All Services
```bash
npm run docker:up
```

This starts:
- ✅ Next.js app on http://localhost:3000
- ✅ PostgreSQL on localhost:5432
- ✅ Redis on localhost:6379
- ✅ Mailhog (email testing) on http://localhost:8025
- ✅ Adminer (database UI) on http://localhost:8080
- ✅ Redis Commander on http://localhost:8081

### View Logs
```bash
npm run docker:logs
```

### Stop Services
```bash
npm run docker:down
```

---

## Running Tests

### Quick Test
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Full Coverage Report
```bash
npm run test:coverage
```

### E2E Tests
```bash
npm run test:e2e
```

### E2E UI Mode (Recommended for debugging)
```bash
npm run test:e2e:ui
```

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run type-check` | TypeScript type checking |
| `npm test` | Run all tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

---

## Key Files & Folders

```
silverconnect-global/
├── app/                    # Next.js pages & layouts
├── components/             # React components
├── api/                    # Backend API services
│   ├── services/          # Business logic (Auth, Payment, Booking, etc.)
│   ├── routes/            # API endpoints
│   └── middleware/        # Request middleware
├── lib/                    # Utilities & database schema
├── __tests__/             # Unit & integration tests
├── e2e/                   # End-to-end tests
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Local development setup
├── jest.config.js         # Unit test configuration
├── playwright.config.ts   # E2E test configuration
└── .env.example          # Environment template
```

---

## Troubleshooting

### Port Already in Use
```bash
# Change port in .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3001
npm run dev -- -p 3001
```

### Clear Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Reset Docker
```bash
npm run docker:down -v
npm run docker:up
```

### Test Failures
```bash
# Clear jest cache
npx jest --clearCache

# Run specific test with verbose output
npm test -- --testNamePattern="test name" --verbose
```

---

## Next Steps

1. ✅ **Read Documentation**: Check [docs/CI_CD.md](docs/CI_CD.md)
2. ✅ **Run Tests**: `npm test && npm run test:e2e`
3. ✅ **Make Changes**: Start developing!
4. ✅ **Create PR**: Follow [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Support

- 📚 [Full Documentation](docs/CI_CD.md)
- 🤝 [Contributing Guide](CONTRIBUTING.md)
- 📝 [API Services](api/services/)
- 🧪 [Test Examples](__tests__/)

---

Need help? Open an issue on GitHub! 🙌
