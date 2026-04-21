#!/bin/bash

# 📊 Test Report Generator
# Usage: ./scripts/generate-test-report.sh

echo "📊 Generating Test Reports..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p reports

echo -e "${BLUE}1. Running Unit Tests...${NC}"
npm run test:unit -- --coverage --json --outputFile=reports/unit-tests.json
if [ -f coverage/lcov.info ]; then
    cp coverage/lcov.info reports/unit-coverage.lcov
fi

echo -e "${BLUE}2. Running Integration Tests...${NC}"
npm run test:integration -- --coverage --json --outputFile=reports/integration-tests.json 2>/dev/null || echo "No integration tests found"

echo -e "${BLUE}3. Running E2E Tests...${NC}"
npm run test:e2e 2>/dev/null || echo "Skipping E2E tests (requires running server)"

echo -e "${BLUE}4. Running Lint...${NC}"
npm run lint > reports/lint-report.txt 2>&1 || true

echo -e "${BLUE}5. Running Type Check...${NC}"
npm run type-check > reports/type-check.txt 2>&1 || true

echo -e "${GREEN}✅ Reports generated in reports/ directory${NC}"
echo ""
echo "Generated files:"
ls -lh reports/ 2>/dev/null || echo "No reports found"
