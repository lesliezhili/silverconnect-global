#!/usr/bin/env node
/**
 * Run Neon PostgreSQL migrations
 * Usage: node scripts/run-migrations.mjs
 */
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import pg from "pg";

const { Client } = pg;

async function main() {
  const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("ERROR: DATABASE_URL not set");
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Neon PostgreSQL");

  // Create migrations tracking table
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Get applied migrations
  const { rows: applied } = await client.query("SELECT name FROM _migrations ORDER BY name");
  const appliedSet = new Set(applied.map(r => r.name));

  // Read migration files
  const migrationsDir = join(process.cwd(), "drizzle", "migrations");
  const files = (await readdir(migrationsDir)).filter(f => f.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) continue;
    
    console.log(`Applying: ${file}`);
    const sql = await readFile(join(migrationsDir, file), "utf-8");
    
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      count++;
      console.log(`  ✓ Applied`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`  ✗ Failed: ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`\nDone. ${count} migration(s) applied.`);
  await client.end();
}

main().catch(console.error);
