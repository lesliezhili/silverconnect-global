
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { 
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 15 
});

async function dropAll() {
  console.log("[reset-db] Dropping all tables in public schema...");
  
  // Drop all tables with CASCADE
  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  
  for (const { tablename } of tables) {
    await sql.unsafe(`DROP TABLE IF EXISTS public."${tablename}" CASCADE`);
    console.log(`  dropped: ${tablename}`);
  }
  
  // Drop all enums/custom types
  const types = await sql`
    SELECT typname FROM pg_type t 
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
    WHERE n.nspname = 'public' AND t.typtype = 'e'
  `;
  
  for (const { typname } of types) {
    await sql.unsafe(`DROP TYPE IF EXISTS public."${typname}" CASCADE`);
    console.log(`  dropped type: ${typname}`);
  }
  
  console.log(`[reset-db] Done. Dropped ${tables.length} tables, ${types.length} types.`);
  await sql.end();
}

dropAll().catch(e => { console.error(e); process.exit(1); });
