import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

export async function POST() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });
  const results: string[] = [];

  try {
    // Categories
    const cats = [
      { code: "cleaning", icon: "sparkles", sort: 1, en: "Home Cleaning", zh: "家居清洁" },
      { code: "companion", icon: "heart", sort: 2, en: "Companionship", zh: "陪伴服务" },
      { code: "garden", icon: "flower", sort: 3, en: "Garden & Outdoors", zh: "花园与户外" },
      { code: "personalCare", icon: "hand", sort: 4, en: "Personal Care", zh: "个人护理" },
      { code: "repair", icon: "wrench", sort: 5, en: "Home Repairs", zh: "家居维修" },
      { code: "faith", icon: "book", sort: 6, en: "Faith & Spiritual Care", zh: "信仰与灵性关怀" },
    ];
    for (const c of cats) {
      await sql`INSERT INTO service_categories (code, icon_key, sort_order, enabled)
        VALUES (${c.code}, ${c.icon}, ${c.sort}, true)
        ON CONFLICT (code) DO UPDATE SET icon_key = ${c.icon}, sort_order = ${c.sort}`;
    }
    results.push(cats.length + " categories seeded");

    // Category translations
    try {
      for (const c of cats) {
        await sql`INSERT INTO service_category_translations (category_code, locale, name) VALUES (${c.code}, 'en', ${c.en}) ON CONFLICT (category_code, locale) DO UPDATE SET name = EXCLUDED.name`;
        await sql`INSERT INTO service_category_translations (category_code, locale, name) VALUES (${c.code}, 'zh', ${c.zh}) ON CONFLICT (category_code, locale) DO UPDATE SET name = EXCLUDED.name`;
      }
      results.push("Category translations seeded (EN + ZH)");
    } catch { results.push("Category translations skipped"); }

    // Services
    const svcs = [
      { cat: "cleaning", code: "basic_clean_2h", dur: 120, en: "Basic Clean (2hrs)", zh: "基础清洁（2小时）" },
      { cat: "cleaning", code: "deep_clean_3h", dur: 180, en: "Deep Clean (3hrs)", zh: "深度清洁（3小时）" },
      { cat: "cleaning", code: "end_of_lease", dur: 300, en: "End of Lease Clean", zh: "退租清洁" },
      { cat: "companion", code: "social_visit_2h", dur: 120, en: "Social Visit (2hrs)", zh: "社交探访（2小时）" },
      { cat: "companion", code: "shopping_assist", dur: 90, en: "Shopping Assistance", zh: "购物协助" },
      { cat: "companion", code: "medical_escort", dur: 180, en: "Medical Escort", zh: "就医陪同" },
      { cat: "garden", code: "lawn_mow", dur: 60, en: "Lawn Mowing", zh: "割草" },
      { cat: "garden", code: "garden_tidy_2h", dur: 120, en: "Garden Tidy (2hrs)", zh: "花园整理（2小时）" },
      { cat: "garden", code: "hedge_trim", dur: 90, en: "Hedge Trimming", zh: "修剪树篱" },
      { cat: "personalCare", code: "shower_assist", dur: 60, en: "Shower Assistance", zh: "沐浴协助" },
      { cat: "personalCare", code: "meal_prep", dur: 90, en: "Meal Preparation", zh: "餐食准备" },
      { cat: "personalCare", code: "medication_remind", dur: 30, en: "Medication Reminder", zh: "用药提醒" },
      { cat: "repair", code: "minor_fix_1h", dur: 60, en: "Minor Repairs (1hr)", zh: "小修补（1小时）" },
      { cat: "repair", code: "furniture_assembly", dur: 120, en: "Furniture Assembly", zh: "家具组装" },
      { cat: "repair", code: "plumbing_basic", dur: 90, en: "Basic Plumbing", zh: "基础水管维修" },
      { cat: "faith", code: "bible_study_1h", dur: 60, en: "Bible Study (1hr)", zh: "圣经学习（1小时）" },
      { cat: "faith", code: "church_plant_training", dur: 120, en: "Church Planting Training", zh: "教会植堂培训" },
      { cat: "faith", code: "prayer_group_1h", dur: 60, en: "Prayer Group (1hr)", zh: "祷告小组（1小时）" },
      { cat: "faith", code: "discipleship_mentoring", dur: 90, en: "Discipleship Mentoring", zh: "门徒训练" },
      { cat: "faith", code: "worship_music_session", dur: 60, en: "Worship & Hymns", zh: "敬拜与诗歌" },
      { cat: "faith", code: "pastoral_visit", dur: 60, en: "Pastoral Home Visit", zh: "牧养探访" },
      { cat: "faith", code: "sunday_school", dur: 90, en: "Sunday School", zh: "主日学" },
      { cat: "faith", code: "bible_reading_plan", dur: 30, en: "Bible Reading Plan", zh: "圣经阅读计划" },
    ];
    for (const s of svcs) {
      await sql`INSERT INTO services (category_code, code, duration_min, sort_order, enabled)
        VALUES (${s.cat}, ${s.code}, ${s.dur}, 1, true)
        ON CONFLICT (code) DO UPDATE SET duration_min = ${s.dur}, enabled = true`;
    }
    results.push(svcs.length + " services seeded");

    // Service translations
    try {
      for (const s of svcs) {
        await sql`INSERT INTO service_translations (service_code, locale, name) VALUES (${s.code}, 'en', ${s.en}) ON CONFLICT (service_code, locale) DO UPDATE SET name = EXCLUDED.name`;
        await sql`INSERT INTO service_translations (service_code, locale, name) VALUES (${s.code}, 'zh', ${s.zh}) ON CONFLICT (service_code, locale) DO UPDATE SET name = EXCLUDED.name`;
      }
      results.push("Service translations seeded (EN + ZH)");
    } catch { results.push("Service translations skipped"); }

    await sql.end();
    return NextResponse.json({ success: true, results, total: { categories: cats.length, services: svcs.length } });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), partialResults: results }, { status: 500 });
  }
}
