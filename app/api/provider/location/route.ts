import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { bookingId, providerId, latitude, longitude, accuracy, heading, speed, enabled = true } = await req.json();
  if (!bookingId || !providerId || latitude === undefined || longitude === undefined) return NextResponse.json({ error: "bookingId, providerId, latitude, longitude required" }, { status: 400 });
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    await sql`INSERT INTO provider_locations (booking_id, provider_id, latitude, longitude, accuracy_m, heading, speed_kmh, sharing_enabled, updated_at) VALUES (${bookingId}, ${providerId}, ${latitude}, ${longitude}, ${accuracy || null}, ${heading || null}, ${speed || null}, ${enabled}, NOW()) ON CONFLICT (booking_id) DO UPDATE SET latitude = ${latitude}, longitude = ${longitude}, accuracy_m = ${accuracy || null}, heading = ${heading || null}, speed_kmh = ${speed || null}, sharing_enabled = ${enabled}, updated_at = NOW()`;
    await sql.end();
    return NextResponse.json({ success: true, location: { bookingId, latitude, longitude, enabled, updatedAt: new Date().toISOString() } });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get("bookingId");
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    const [booking] = await sql`SELECT status FROM bookings WHERE id = ${bookingId}`;
    if (!booking || !["confirmed", "in_progress"].includes(booking.status)) { await sql.end(); return NextResponse.json({ success: true, location: null, reason: "Booking not active" }); }
    const [loc] = await sql`SELECT * FROM provider_locations WHERE booking_id = ${bookingId} AND sharing_enabled = true`;
    await sql.end();
    if (!loc) return NextResponse.json({ success: true, location: null, reason: "Sharing off" });
    const age = (Date.now() - new Date(loc.updated_at).getTime()) / 1000;
    return NextResponse.json({ success: true, location: { latitude: parseFloat(loc.latitude), longitude: parseFloat(loc.longitude), accuracy: loc.accuracy_m ? parseFloat(loc.accuracy_m) : null, updatedAt: loc.updated_at, ageSeconds: Math.round(age), isStale: age > 300 } });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
export async function PATCH(req: NextRequest) {
  const { bookingId, providerId, enabled } = await req.json();
  if (!bookingId || !providerId || enabled === undefined) return NextResponse.json({ error: "bookingId, providerId, enabled required" }, { status: 400 });
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    await sql`UPDATE provider_locations SET sharing_enabled = ${enabled}, updated_at = NOW() WHERE booking_id = ${bookingId} AND provider_id = ${providerId}`;
    await sql.end();
    return NextResponse.json({ success: true, bookingId, sharingEnabled: enabled });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
