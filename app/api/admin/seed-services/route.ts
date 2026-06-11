import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== process.env.SESSION_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const cats = [
      { code: "cleaning", icon_key: "sparkles", sort: 1 },
      { code: "companion", icon_key: "heart", sort: 2 },
      { code: "garden", icon_key: "flower", sort: 3 },
      { code: "personalCare", icon_key: "hand", sort: 4 },
      { code: "repair", icon_key: "wrench", sort: 5 },
      { code: "faith", icon_key: "book", sort: 6 },
    ];
    for (const c of cats) {
      await sql`INSERT INTO service_categories (code, icon_key, sort_order, enabled) VALUES (${c.code}, ${c.icon_key}, ${c.sort}, true) ON CONFLICT (code) DO UPDATE SET icon_key = ${c.icon_key}, sort_order = ${c.sort}`;
    }

    const svcs = [
      { cat: "cleaning", code: "basic_clean_2h", dur: 120, sort: 1 },
      { cat: "cleaning", code: "deep_clean_3h", dur: 180, sort: 2 },
      { cat: "cleaning", code: "end_of_lease", dur: 300, sort: 3 },
      { cat: "companion", code: "social_visit_2h", dur: 120, sort: 1 },
      { cat: "companion", code: "shopping_assist", dur: 90, sort: 2 },
      { cat: "companion", code: "medical_escort", dur: 180, sort: 3 },
      { cat: "garden", code: "lawn_mow", dur: 60, sort: 1 },
      { cat: "garden", code: "garden_tidy_2h", dur: 120, sort: 2 },
      { cat: "garden", code: "hedge_trim", dur: 90, sort: 3 },
      { cat: "personalCare", code: "shower_assist", dur: 60, sort: 1 },
      { cat: "personalCare", code: "meal_prep", dur: 90, sort: 2 },
      { cat: "personalCare", code: "medication_remind", dur: 30, sort: 3 },
      { cat: "repair", code: "minor_fix_1h", dur: 60, sort: 1 },
      { cat: "repair", code: "furniture_assembly", dur: 120, sort: 2 },
      { cat: "repair", code: "plumbing_basic", dur: 90, sort: 3 },
      { cat: "faith", code: "bible_study_1h", dur: 60, sort: 1 },
      { cat: "faith", code: "church_plant_training", dur: 120, sort: 2 },
      { cat: "faith", code: "prayer_group_1h", dur: 60, sort: 3 },
      { cat: "faith", code: "discipleship_mentoring", dur: 90, sort: 4 },
      { cat: "faith", code: "worship_music_session", dur: 60, sort: 5 },
      { cat: "faith", code: "pastoral_visit", dur: 60, sort: 6 },
    ];
    for (const s of svcs) {
      await sql`INSERT INTO services (category_code, code, duration_min, sort_order, enabled) VALUES (${s.cat}, ${s.code}, ${s.dur}, ${s.sort}, true) ON CONFLICT (code) DO UPDATE SET duration_min = ${s.dur}, sort_order = ${s.sort}`;
    }

    const pricing: Record<string, { rate: number; cur: string; tax: number }> = {
      AU: { rate: 55, cur: "AUD", tax: 0.1 }, CN: { rate: 80, cur: "CNY", tax: 0 },
      CA: { rate: 45, cur: "CAD", tax: 0.13 }, US: { rate: 50, cur: "USD", tax: 0.0825 },
      TW: { rate: 600, cur: "TWD", tax: 0.05 }, SG: { rate: 40, cur: "SGD", tax: 0.09 },
      HK: { rate: 200, cur: "HKD", tax: 0 }, MY: { rate: 60, cur: "MYR", tax: 0.06 },
    };

    const allSvc = await sql`SELECT id, duration_min FROM services`;
    let n = 0;
    for (const svc of allSvc) {
      for (const [co, p] of Object.entries(pricing)) {
        const bp = ((svc.duration_min / 60) * p.rate).toFixed(2);
        await sql`INSERT INTO service_prices (service_id, country, base_price, tax_rate, currency, enabled) VALUES (${svc.id}, ${co}, ${bp}, ${p.tax.toFixed(4)}, ${p.cur}, true) ON CONFLICT (service_id, country) DO UPDATE SET base_price = ${bp}, tax_rate = ${p.tax.toFixed(4)}, currency = ${p.cur}`;
        n++;
      }
    }

    await sql.end();
    return NextResponse.json({ success: true, categories: cats.length, services: svcs.length, prices: n });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
