#!/usr/bin/env node

/**
 * Quick Start Script
 * Usage: node scripts/quickstart.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function quickStart() {
  console.log('\n🌏 SilverConnect Global - Quick Start\n');
  console.log('====================================\n');

  // Check Node version
  const nodeVersion = process.version.split('.')[0].slice(1);
  if (parseInt(nodeVersion) < 18) {
    console.error('❌ Node.js 18+ required');
    process.exit(1);
  }
  console.log('✅ Node.js version:', process.version);

  // Check .env.local
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env.local not found');
    const shouldCreate = await question('Create from .env.example? (y/n): ');

    if (shouldCreate.toLowerCase() === 'y') {
      const examplePath = path.join(__dirname, '../.env.example');
      const exampleContent = fs.readFileSync(examplePath, 'utf-8');
      fs.writeFileSync(envPath, exampleContent);
      console.log('✅ Created .env.local');
      console.log('📝 Please edit .env.local with your credentials\n');
    }
  } else {
    console.log('✅ .env.local exists');
  }

  // Install check
  const nodeModulesPath = path.join(__dirname, '../node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('⚠️  node_modules not found');
    console.log('Run: npm install\n');
    process.exit(1);
  }
  console.log('✅ Dependencies installed');

  // Next steps
  console.log('\n📋 Next Steps:\n');
  console.log('1. Configure .env.local:');
  console.log('   - Supabase credentials');
  console.log('   - Stripe API keys');
  console.log('   - Email configuration\n');

  console.log('2. Start development server:');
  console.log('   npm run dev\n');

  console.log('3. Run tests:');
  console.log('   npm test');
  console.log('   npm run test:e2e\n');

  console.log('4. Start Docker services (optional):');
  console.log('   npm run docker:up\n');

  console.log('📚 Documentation:');
  console.log('   - CI/CD Guide: docs/CI_CD.md');
  console.log('   - Contributing: CONTRIBUTING.md');
  console.log('   - README: README.md\n');

  rl.close();
}

quickStart().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
