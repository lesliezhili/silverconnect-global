/**
 * One-shot: move compliance documents from the public web root
 * (`public/uploads/compliance/...`) into private storage
 * (`.private-uploads/compliance/...`) and rewrite `provider_documents.file_url`
 * to hold the storage key instead of a public URL.
 *
 *   npx tsx scripts/migrate-compliance-uploads.ts          # dry run
 *   npx tsx scripts/migrate-compliance-uploads.ts --apply  # do it
 *   npx tsx scripts/migrate-compliance-uploads.ts --apply --delete-old
 *
 * Idempotent: rows whose file_url is already a key (no leading "/") are skipped.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { join } from "node:path";
import { mkdir, copyFile, rm, access } from "node:fs/promises";
import { providerDocuments } from "../lib/db/schema/providers";

const APPLY = process.argv.includes("--apply");
const DELETE_OLD = process.argv.includes("--delete-old");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const client = postgres(url, { ssl: "require", prepare: false, max: 1 });
const db = drizzle(client);

const PUBLIC_ROOT = join(process.cwd(), "public");
const PRIVATE_ROOT = join(process.cwd(), ".private-uploads");
const PUBLIC_PREFIX = "/uploads/compliance/";

async function main() {
  const rows = await db
    .select({ id: providerDocuments.id, fileUrl: providerDocuments.fileUrl })
    .from(providerDocuments);

  let migrated = 0;
  let skipped = 0;
  for (const r of rows) {
    if (!r.fileUrl.startsWith("/")) {
      skipped++;
      continue;
    }
    if (!r.fileUrl.startsWith(PUBLIC_PREFIX)) {
      console.warn(`! ${r.id}: unexpected public path ${r.fileUrl} — leaving as is`);
      skipped++;
      continue;
    }
    // /uploads/compliance/<providerId>/<file> -> key "compliance/<providerId>/<file>"
    const key = r.fileUrl.slice("/uploads/".length);
    const src = join(PUBLIC_ROOT, r.fileUrl.replace(/^\//, ""));
    const dst = join(PRIVATE_ROOT, key);

    try {
      await access(src);
    } catch {
      console.warn(`! ${r.id}: source file missing ${src} — leaving DB row as is`);
      skipped++;
      continue;
    }

    console.log(`${APPLY ? "MOVE" : "would move"} ${r.fileUrl} -> ${key}`);
    if (APPLY) {
      await mkdir(join(dst, ".."), { recursive: true });
      await copyFile(src, dst);
      await db
        .update(providerDocuments)
        .set({ fileUrl: key, updatedAt: new Date() })
        .where(eq(providerDocuments.id, r.id));
      if (DELETE_OLD) await rm(src);
    }
    migrated++;
  }

  console.log(
    `\n${APPLY ? "Done" : "Dry run"} — ${migrated} ${APPLY ? "migrated" : "to migrate"}, ${skipped} skipped.${APPLY ? "" : "  Re-run with --apply to perform."}`,
  );
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
