import { NextResponse } from "next/server";
export async function POST() {
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    await sql`CREATE TABLE IF NOT EXISTS provider_locations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID NOT NULL, provider_id UUID NOT NULL, latitude NUMERIC(10,7) NOT NULL, longitude NUMERIC(10,7) NOT NULL, accuracy_m NUMERIC(6,1), heading NUMERIC(5,1), speed_kmh NUMERIC(5,1), sharing_enabled BOOLEAN DEFAULT true, updated_at TIMESTAMPTZ DEFAULT NOW())`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_prov_loc_booking ON provider_locations(booking_id)`.catch(() => {});
    await sql`CREATE TABLE IF NOT EXISTS job_executions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID NOT NULL UNIQUE, provider_id UUID NOT NULL, status TEXT DEFAULT 'not_started', started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, start_latitude NUMERIC(10,7), start_longitude NUMERIC(10,7), end_latitude NUMERIC(10,7), end_longitude NUMERIC(10,7), start_notes TEXT, end_notes TEXT, duration_actual_min INT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS job_photos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID NOT NULL, job_execution_id UUID, provider_id UUID NOT NULL, photo_type TEXT NOT NULL DEFAULT 'during', photo_url TEXT NOT NULL, caption TEXT, taken_at TIMESTAMPTZ DEFAULT NOW(), latitude NUMERIC(10,7), longitude NUMERIC(10,7), created_at TIMESTAMPTZ DEFAULT NOW())`;
    await sql.end();
    return NextResponse.json({ success: true, tables: ["provider_locations", "job_executions", "job_photos"] });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
