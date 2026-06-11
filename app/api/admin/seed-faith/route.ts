import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

export async function POST() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  const results: string[] = [];

  try {
    // 1. Category
    await sql`INSERT INTO service_categories (code, icon_key, sort_order, enabled)
      VALUES ('faith', 'book', 6, true)
      ON CONFLICT (code) DO UPDATE SET icon_key = 'book', sort_order = 6, enabled = true`;
    results.push("Category 'faith' seeded");

    // 2. Services
    const services = [
      { code: "bible_study_1h", dur: 60, sort: 1 },
      { code: "church_plant_training", dur: 120, sort: 2 },
      { code: "prayer_group_1h", dur: 60, sort: 3 },
      { code: "discipleship_mentoring", dur: 90, sort: 4 },
      { code: "worship_music_session", dur: 60, sort: 5 },
      { code: "pastoral_visit", dur: 60, sort: 6 },
      { code: "sunday_school", dur: 90, sort: 7 },
      { code: "bible_reading_plan", dur: 30, sort: 8 },
    ];
    for (const s of services) {
      await sql`INSERT INTO services (category_code, code, duration_min, sort_order, enabled)
        VALUES ('faith', ${s.code}, ${s.dur}, ${s.sort}, true)
        ON CONFLICT (code) DO UPDATE SET duration_min = ${s.dur}, sort_order = ${s.sort}, enabled = true`;
    }
    results.push(services.length + " faith services seeded");

    // 3. Translations (optional — tables may not exist)
    try {
      await sql`INSERT INTO service_category_translations (category_code, locale, name, description) VALUES
        ('faith', 'en', 'Faith & Spiritual Care', 'Bible study, prayer groups, church planting, and pastoral support.'),
        ('faith', 'zh', 'Faith & Spiritual Care', '圣经学习、祷告小组、教会植堂培训，以及牧养探访。')
        ON CONFLICT (category_code, locale) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`;
      results.push("Category translations seeded (EN + ZH)");
    } catch { results.push("Category translations skipped (table not created yet)"); }

    try {
      const translations = [
        { code: "bible_study_1h", en: "Bible Study (1hr)", zh: "圣经学习（1小时）" },
        { code: "church_plant_training", en: "Church Planting Training", zh: "教会植堂培训" },
        { code: "prayer_group_1h", en: "Prayer Group (1hr)", zh: "祷告小组（1小时）" },
        { code: "discipleship_mentoring", en: "Discipleship Mentoring", zh: "门徒训练" },
        { code: "worship_music_session", en: "Worship & Hymns", zh: "敬拜与诗歌" },
        { code: "pastoral_visit", en: "Pastoral Home Visit", zh: "牧养探访" },
        { code: "sunday_school", en: "Sunday School", zh: "主日学" },
        { code: "bible_reading_plan", en: "Bible Reading Plan", zh: "圣经阅读计划" },
      ];
      for (const t of translations) {
        await sql`INSERT INTO service_translations (service_code, locale, name) VALUES (${t.code}, 'en', ${t.en}) ON CONFLICT (service_code, locale) DO UPDATE SET name = EXCLUDED.name`;
        await sql`INSERT INTO service_translations (service_code, locale, name) VALUES (${t.code}, 'zh', ${t.zh}) ON CONFLICT (service_code, locale) DO UPDATE SET name = EXCLUDED.name`;
      }
      results.push("Service translations seeded (EN + ZH)");
    } catch { results.push("Service translations skipped (table not created yet)"); }

    // 4. Pricing (optional)
    try {
      const faithSvcs = await sql`SELECT id FROM services WHERE category_code = 'faith'`;
      const countries = ["AU", "CN", "CA", "US", "TW", "SG", "HK", "MY"];
      for (const svc of faithSvcs) {
        for (const cc of countries) {
          await sql`INSERT INTO service_pricing (service_id, country_code, base_rate_per_hour, currency, tax_rate, total_price)
            VALUES (${svc.id}, ${cc}, 0, 'AUD', 0, '0.00')
            ON CONFLICT (service_id, country_code) DO UPDATE SET base_rate_per_hour = 0, total_price = '0.00'`;
        }
      }
      results.push("Pricing seeded (FREE for all countries)");
    } catch { results.push("Pricing skipped (table not created yet)"); }

    await sql.end();
    return NextResponse.json({ success: true, results, message: "Faith services seeded (donation-based, FREE)." });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), partialResults: results }, { status: 500 });
  }
}
