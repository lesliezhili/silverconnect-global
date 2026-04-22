#!/usr/bin/env node

/**
 * Database Migration Script
 * Usage: npm run db:migrate
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Extract database connection details from Supabase URL
const url = new URL(supabaseUrl);
const host = url.hostname;
const database = url.pathname.slice(1); // Remove leading slash

// Create postgres client for raw SQL execution
const sql = postgres({
  host,
  database,
  username: 'postgres',
  password: supabaseKey,
  port: 5432,
  ssl: 'require'
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  try {
    // Read schema.sql
    const schemaPath = path.join(__dirname, '../lib/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split schema into individual statements (by semicolon)
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute...\n`);

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;

      // Clean up the statement
      const cleanStatement = statement.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

      console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${cleanStatement.substring(0, 80)}${cleanStatement.length > 80 ? '...' : ''}`);

      try {
        // Execute raw SQL using postgres client
        await sql.unsafe(cleanStatement);
        console.log('   ✅ Success');
      } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
        console.error(`   Statement: ${cleanStatement}`);
        throw err;
      }
    }

    console.log('\n✅ All migrations completed successfully!\n');
    
    // Close the database connection
    await sql.end();
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

runMigrations();
