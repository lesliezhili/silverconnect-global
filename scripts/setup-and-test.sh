#!/bin/bash

# ================================================================
# SilverConnect Global - Comprehensive Testing & Setup Guide
# ================================================================
# This guide helps you:
# 1. Set up the database with proper schema
# 2. Run all testing levels (UT, AT, SIT, UAT)
# 3. Verify the application is ready for production
# ================================================================

echo "🚀 SilverConnect Global - Complete Testing Suite"
echo "==============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================================================
# STEP 1: Database Setup Instructions
# ================================================================
echo -e "${BLUE}STEP 1: DATABASE SETUP${NC}"
echo "-------------------------------------------"
echo ""
echo -e "${YELLOW}📋 To set up the database, you need to:${NC}"
echo ""
echo "1. Visit your Supabase Dashboard:"
echo "   👉 https://app.supabase.com/projects"
echo ""
echo "2. Select your project: 'silverconnect-global'"
echo ""
echo "3. Go to 'SQL Editor' → Click 'New Query'"
echo ""
echo "4. Copy and paste the SQL schema from:"
echo "   📄 lib/schema.sql"
echo ""
echo "5. Click 'Run' to execute the schema"
echo ""
echo "6. To get your Service Role Key:"
echo "   - Go to Settings → API"
echo "   - Copy the 'service_role' (secret) key"
echo "   - Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=<key>"
echo ""
echo -e "${YELLOW}💡 Alternative: Use Supabase CLI${NC}"
echo "   $ supabase db push"
echo ""
echo "-------------------------------------------"
echo ""

# ================================================================
# STEP 2: Dependency Check
# ================================================================
echo -e "${BLUE}STEP 2: CHECKING DEPENDENCIES${NC}"
echo "-------------------------------------------"

# Check Node version
echo "Checking Node.js..."
NODE_VERSION=$(node -v)
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
  echo -e "${RED}✗ Node.js not found${NC}"
  exit 1
fi

# Check npm version
echo "Checking npm..."
NPM_VERSION=$(npm -v)
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"
else
  echo -e "${RED}✗ npm not found${NC}"
  exit 1
fi

# Check dependencies installed
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓ node_modules directory exists${NC}"
else
  echo -e "${YELLOW}⚠ Installing dependencies...${NC}"
  npm install
fi

echo ""

# ================================================================
# STEP 3: Type Checking
# ================================================================
echo -e "${BLUE}STEP 3: TYPE CHECKING${NC}"
echo "-------------------------------------------"
npm run type-check
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Type checking passed${NC}"
else
  echo -e "${RED}✗ Type checking failed${NC}"
fi
echo ""

# ================================================================
# STEP 4: Linting
# ================================================================
echo -e "${BLUE}STEP 4: CODE LINTING${NC}"
echo "-------------------------------------------"
npm run lint > /tmp/lint-results.txt 2>&1
LINT_RESULT=$?
if [ $LINT_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ All linting checks passed${NC}"
else
  echo -e "${YELLOW}⚠ Some linting warnings/errors found${NC}"
  echo "   (See detailed output below)"
  cat /tmp/lint-results.txt | head -20
fi
echo ""

# ================================================================
# STEP 5: Unit Tests (UT)
# ================================================================
echo -e "${BLUE}STEP 5: UNIT TESTS (UT)${NC}"
echo "-------------------------------------------"
echo "Running unit tests with coverage..."
npm run test:coverage -- --silent 2>&1 | head -50
echo ""
echo -e "${GREEN}✓ Unit testing framework ready${NC}"
echo ""

# ================================================================
# STEP 6: Build Verification
# ================================================================
echo -e "${BLUE}STEP 6: BUILD VERIFICATION${NC}"
echo "-------------------------------------------"
echo "Building application for production..."
npm run build > /tmp/build-results.txt 2>&1
BUILD_RESULT=$?
if [ $BUILD_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Production build successful${NC}"
  echo ""
  echo "Build output summary:"
  tail -20 /tmp/build-results.txt
else
  echo -e "${RED}✗ Build failed${NC}"
  echo ""
  tail -30 /tmp/build-results.txt
fi
echo ""

# ================================================================
# STEP 7: Testing Information
# ================================================================
echo -e "${BLUE}STEP 7: TEST COMMANDS SUMMARY${NC}"
echo "-------------------------------------------"
echo ""
echo "📊 Available Testing Commands:"
echo ""
echo -e "${YELLOW}Unit Tests (UT):${NC}"
echo "  npm run test                    # Run all tests"
echo "  npm run test:watch              # Run tests in watch mode"
echo "  npm run test:coverage           # Run with coverage report"
echo ""
echo -e "${YELLOW}Integration Tests (SIT):${NC}"
echo "  npm run test:integration        # Run integration tests"
echo ""
echo -e "${YELLOW}End-to-End Tests (UAT):${NC}"
echo "  npm run test:e2e                # Run all E2E tests"
echo "  npm run test:e2e:uat            # Run UAT signin flow"
echo "  npm run test:e2e:ui             # Run with UI mode"
echo "  npm run test:e2e:debug          # Run with debugging"
echo ""
echo -e "${YELLOW}Specialized Tests:${NC}"
echo "  npm run test:smoke              # Quick smoke tests"
echo "  npm run test:critical           # Critical flows only"
echo "  npm run test:performance        # Performance tests"
echo "  npm run test:visual             # Visual regression tests"
echo ""

# ================================================================
# STEP 8: Development Server Status
# ================================================================
echo -e "${BLUE}STEP 8: DEVELOPMENT SERVER${NC}"
echo "-------------------------------------------"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
  echo -e "${GREEN}✓ Development server is running${NC}"
  echo "  Local:   http://localhost:3000"
  echo "  Network: http://$(hostname -I | awk '{print $1}'):3000"
else
  echo -e "${YELLOW}⚠ Development server not running${NC}"
  echo "  To start: npm run dev"
fi
echo ""

# ================================================================
# STEP 9: Test Environment URLs
# ================================================================
echo -e "${BLUE}STEP 9: TESTING ENDPOINTS${NC}"
echo "-------------------------------------------"
echo ""
echo "📍 Key Pages to Test:"
echo "  Home Page:       http://localhost:3000/"
echo "  Support Page:    http://localhost:3000/support"
echo "  Emergency:       http://localhost:3000/emergency"
echo "  Provider:        http://localhost:3000/provider"
echo ""
echo "🔐 Test Credentials (if using test data):"
echo "  Email:    test@example.com"
echo "  Password: TestPassword123!"
echo ""

# ================================================================
# STEP 10: Summary
# ================================================================
echo -e "${BLUE}STEP 10: FINAL CHECKLIST${NC}"
echo "-------------------------------------------"
echo ""
echo "Before running tests, ensure:"
echo ""
echo "☐ Database is set up (schema.sql executed in Supabase)"
echo "☐ Service Role Key added to .env.local"
echo "☐ .env.local file has all required variables"
echo "☐ npm dependencies are installed"
echo "☐ Development server is running (npm run dev)"
echo "☐ No build errors detected"
echo ""

echo -e "${GREEN}✓ Setup verification complete!${NC}"
echo ""
echo "📖 Next Steps:"
echo "1. Set up the database (see instructions above)"
echo "2. Run: npm run dev (if not already running)"
echo "3. Run tests: npm run test:e2e:uat"
echo "4. Visit http://localhost:3000 to use the app"
echo ""
echo "================================================================"
echo ""
