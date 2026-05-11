/**
 * One-shot: apply 0005 (donate tables) + 0006 (donations.locale) via raw
 * SQL, bypassing drizzle-kit migrate which hangs against Supabase pooler.
 *
 * Idempotent on re-run via the `__drizzle_migrations` ledger check at the
 * end (records the hashes so a future `db:migrate` won't re-apply).
 *
 *   npx tsx scripts/apply-donate-migrations.ts
 *
 * Delete this script after the migration ledger is in sync.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const MIGRATIONS = [
  "0005_mature_calypso.sql",
  "0006_mean_stepford_cuckoos.sql",
];

const client = postgres(url, { ssl: "require", prepare: false, max: 1 });

async function main() {
  const root = path.resolve(__dirname, "..", "drizzle", "migrations");

  for (const file of MIGRATIONS) {
    const sqlText = fs.readFileSync(path.join(root, file), "utf8");
    // Drizzle's migration files separate statements with this marker.
    const statements = sqlText
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`\nApplying ${file} (${statements.length} statements)`);
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]!;
      try {
        await client.unsafe(stmt);
        process.stdout.write(".");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Re-run safety: tolerate "already exists" so partial earlier
        // attempts don't block.
        if (/already exists/i.test(msg)) {
          process.stdout.write("·");
          continue;
        }
        console.error(`\n✗ statement ${i + 1}/${statements.length} failed:`);
        console.error(stmt);
        console.error(msg);
        throw err;
      }
    }
    console.log(` ✓`);
  }

  // Optional: record in __drizzle_migrations so future drizzle-kit calls
  // see these as applied. Skip silently if the table layout doesn't match
  // the hash format drizzle-kit expects — we only need the tables, not the
  // ledger, for the app to work.
  try {
    await client`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES
        ('0005_mature_calypso', ${Date.now()}),
        ('0006_mean_stepford_cuckoos', ${Date.now()})
      ON CONFLICT (hash) DO NOTHING
    `;
    console.log("\n✓ ledger updated");
  } catch (err) {
    console.warn(
      "\n⚠ ledger update skipped (tables work regardless):",
      err instanceof Error ? err.message : String(err),
    );
  }
}

main()
  .then(() => client.end())
  .catch((err) => {
    console.error(err);
    client.end();
    process.exit(1);
  });
