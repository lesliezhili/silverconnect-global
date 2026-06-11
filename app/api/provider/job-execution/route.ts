import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { bookingId, providerId, action, latitude, longitude, notes, photos = [] } = await req.json();
  if (!bookingId || !providerId || !action) return NextResponse.json({ error: "bookingId, providerId, action required" }, { status: 400 });
  if (!["start", "complete"].includes(action)) return NextResponse.json({ error: "action must be start or complete" }, { status: 400 });
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    if (action === "start") {
      const [ex] = await sql`SELECT id FROM job_executions WHERE booking_id = ${bookingId}`;
      if (ex) { await sql`UPDATE job_executions SET status = 'in_progress', started_at = NOW(), start_latitude = ${latitude || null}, start_longitude = ${longitude || null}, start_notes = ${notes || null}, updated_at = NOW() WHERE booking_id = ${bookingId}`; }
      else { await sql`INSERT INTO job_executions (booking_id, provider_id, status, started_at, start_latitude, start_longitude, start_notes) VALUES (${bookingId}, ${providerId}, 'in_progress', NOW(), ${latitude || null}, ${longitude || null}, ${notes || null})`; }
      await sql`UPDATE bookings SET status = 'in_progress', started_at = NOW() WHERE id = ${bookingId}`;
      await sql`INSERT INTO provider_locations (booking_id, provider_id, latitude, longitude, sharing_enabled) VALUES (${bookingId}, ${providerId}, ${latitude || 0}, ${longitude || 0}, true) ON CONFLICT (booking_id) DO UPDATE SET sharing_enabled = true, latitude = ${latitude || 0}, longitude = ${longitude || 0}, updated_at = NOW()`.catch(() => {});
      for (const photo of photos) { await sql`INSERT INTO job_photos (booking_id, provider_id, photo_type, photo_url, caption, latitude, longitude) VALUES (${bookingId}, ${providerId}, 'before', ${photo.url}, ${photo.caption || 'Before'}, ${latitude || null}, ${longitude || null})`; }
      const [bk] = await sql`SELECT customer_id FROM bookings WHERE id = ${bookingId}`;
      if (bk) await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id) VALUES (${bk.customer_id}, 'booking', 'Service Started', 'Your provider has arrived. Track their location in real-time.', ${bookingId})`.catch(() => {});
      await sql.end();
      return NextResponse.json({ success: true, action: "started", bookingId, startedAt: new Date().toISOString(), gpsSharing: true, photosUploaded: photos.length });
    } else {
      const [exec] = await sql`SELECT started_at FROM job_executions WHERE booking_id = ${bookingId}`;
      const dur = exec?.started_at ? Math.round((Date.now() - new Date(exec.started_at).getTime()) / 60000) : null;
      await sql`UPDATE job_executions SET status = 'completed', completed_at = NOW(), end_latitude = ${latitude || null}, end_longitude = ${longitude || null}, end_notes = ${notes || null}, duration_actual_min = ${dur}, updated_at = NOW() WHERE booking_id = ${bookingId}`;
      await sql`UPDATE bookings SET status = 'completed', completed_at = NOW() WHERE id = ${bookingId}`;
      await sql`UPDATE provider_locations SET sharing_enabled = false, updated_at = NOW() WHERE booking_id = ${bookingId}`.catch(() => {});
      for (const photo of photos) { await sql`INSERT INTO job_photos (booking_id, provider_id, photo_type, photo_url, caption, latitude, longitude) VALUES (${bookingId}, ${providerId}, 'after', ${photo.url}, ${photo.caption || 'After'}, ${latitude || null}, ${longitude || null})`; }
      const [bk] = await sql`SELECT customer_id FROM bookings WHERE id = ${bookingId}`;
      if (bk) await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id) VALUES (${bk.customer_id}, 'booking', 'Service Completed', ${'Job complete! Duration: ' + (dur || '?') + ' min. Photos available.'}, ${bookingId})`.catch(() => {});
      await sql.end();
      return NextResponse.json({ success: true, action: "completed", bookingId, completedAt: new Date().toISOString(), durationMin: dur, gpsSharing: false, photosUploaded: photos.length });
    }
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get("bookingId");
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    const [exec] = await sql`SELECT * FROM job_executions WHERE booking_id = ${bookingId}`;
    const photos = await sql`SELECT id, photo_type, photo_url, caption, taken_at FROM job_photos WHERE booking_id = ${bookingId} ORDER BY taken_at`;
    const [loc] = await sql`SELECT sharing_enabled, latitude, longitude FROM provider_locations WHERE booking_id = ${bookingId}`;
    await sql.end();
    return NextResponse.json({ success: true, execution: exec ? { status: exec.status, startedAt: exec.started_at, completedAt: exec.completed_at, durationMin: exec.duration_actual_min } : null, photos: { before: photos.filter((p: any) => p.photo_type === "before"), after: photos.filter((p: any) => p.photo_type === "after"), total: photos.length }, gps: loc ? { sharingEnabled: loc.sharing_enabled, lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) } : null });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
