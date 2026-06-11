import { NextResponse } from "next/server";
import { createPgClient } from "@/lib/db/pg-connection";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== process.env.SESSION_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = createPgClient(url, 3);

  try {
    // Provider 1 — Sarah M. (Sydney CBD, cleaning + companion + personalCare)
    const p1Email = "provider.test@silverconnect.dev";
    let [u1] = await sql`SELECT id FROM users WHERE email = ${p1Email}`;
    if (!u1) {
      [u1] = await sql`INSERT INTO users (email, password_hash, role, current_active_role, country, locale, full_name, email_verified_at)
        VALUES (${p1Email}, '$2b$10$placeholder000000000000000000000000000000000', 'provider', 'provider', 'AU', 'en', 'Sarah M.', NOW()) RETURNING id`;
    }
    let [pp1] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${u1.id}`;
    if (!pp1) {
      [pp1] = await sql`INSERT INTO provider_profiles (user_id, bio, address_line, service_lat, service_lng, service_radius_km, onboarding_status, approved_at)
        VALUES (${u1.id}, 'Experienced home care provider. 5+ years with elderly clients. First aid certified.', '123 George St, Sydney NSW 2000', -33.8688, 151.2093, 15, 'approved', NOW()) RETURNING id`;
    } else {
      await sql`UPDATE provider_profiles SET onboarding_status='approved', service_lat=-33.8688, service_lng=151.2093, service_radius_km=15, approved_at=NOW() WHERE id=${pp1.id}`;
    }
    for (const cat of ['cleaning','companion','personalCare']) {
      await sql`INSERT INTO provider_categories (provider_id, category) VALUES (${pp1.id}, ${cat}::service_category) ON CONFLICT DO NOTHING`;
    }
    for (let d = 1; d <= 5; d++) {
      for (const s of ['morning','afternoon']) {
        await sql`INSERT INTO provider_availability (provider_id, day_of_week, slot, enabled) VALUES (${pp1.id}, ${d}, ${s}::time_slot, true) ON CONFLICT DO NOTHING`;
      }
    }

    // Provider 2 — James K. (also Sydney area, cleaning + garden + repair)
    const p2Email = "provider2.test@silverconnect.dev";
    let [u2] = await sql`SELECT id FROM users WHERE email = ${p2Email}`;
    if (!u2) {
      [u2] = await sql`INSERT INTO users (email, password_hash, role, current_active_role, country, locale, full_name, email_verified_at)
        VALUES (${p2Email}, '$2b$10$placeholder000000000000000000000000000000000', 'provider', 'provider', 'AU', 'en', 'James K.', NOW()) RETURNING id`;
    }
    let [pp2] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${u2.id}`;
    if (!pp2) {
      [pp2] = await sql`INSERT INTO provider_profiles (user_id, bio, address_line, service_lat, service_lng, service_radius_km, onboarding_status, approved_at)
        VALUES (${u2.id}, 'Friendly gardener and handyman. Reliable and punctual.', '456 Pitt St, Sydney NSW 2000', -33.8750, 151.2100, 20, 'approved', NOW()) RETURNING id`;
    } else {
      await sql`UPDATE provider_profiles SET onboarding_status='approved', service_lat=-33.8750, service_lng=151.2100, service_radius_km=20, approved_at=NOW() WHERE id=${pp2.id}`;
    }
    for (const cat of ['cleaning','garden','repair']) {
      await sql`INSERT INTO provider_categories (provider_id, category) VALUES (${pp2.id}, ${cat}::service_category) ON CONFLICT DO NOTHING`;
    }

    // Add a 5-star review for Provider 1
    const [svc] = await sql`SELECT id FROM services WHERE code='basic_clean_2h' LIMIT 1`;
    if (svc) {
      const [existBk] = await sql`SELECT id FROM bookings WHERE provider_id=${pp1.id} LIMIT 1`;
      if (!existBk) {
        const [bk] = await sql`INSERT INTO bookings (customer_id, provider_id, service_id, scheduled_at, duration_min, status, base_price, tax_amount, total_price, currency, completed_at)
          VALUES (${u1.id}, ${pp1.id}, ${svc.id}, NOW()-interval '7 days', 120, 'completed', '110.00', '11.00', '121.00', 'AUD', NOW()-interval '6 days') RETURNING id`;
        await sql`INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment)
          VALUES (${bk.id}, ${u1.id}, ${pp1.id}, 5, 'Wonderful service! Very caring and thorough.') ON CONFLICT DO NOTHING`;
      }
    }

    await sql.end();
    return NextResponse.json({ success: true, providers: [
      { email: p1Email, name: "Sarah M.", id: pp1.id, cats: ['cleaning','companion','personalCare'] },
      { email: p2Email, name: "James K.", id: pp2.id, cats: ['cleaning','garden','repair'] },
    ]});
  } catch (e: unknown) {
    try { await sql.end(); } catch {}
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
