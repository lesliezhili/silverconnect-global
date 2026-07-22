/**
 * Seed service catalog (categories + services + per-country prices).
 *
 * Idempotent — re-running upserts on the natural keys (`code`, and
 * `(service_id, country)` for prices). Run after Phase 2 migration:
 *
 *   npx tsx scripts/seed-catalog.ts
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import { createPgClient } from "../lib/db/pg-connection";
import {
  serviceCategories,
  services,
  servicePrices,
} from "../lib/db/schema/services";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const client = createPgClient(url, 1);
const db = drizzle(client);

interface Cat {
  code: string;
  iconKey: string;
  sortOrder: number;
}

interface Svc {
  code: string;
  categoryCode: string;
  durationMin: number;
  prices: { country: "AU" | "CN" | "CA" | "US" | "TW" | "SG" | "HK" | "MY"; basePrice: string; taxRate: string; currency: string }[];
}

const CATEGORIES: Cat[] = [
  { code: "cleaning", iconKey: "spray-can", sortOrder: 1 },
  { code: "companion", iconKey: "hand-wave", sortOrder: 2 },
  { code: "garden", iconKey: "sprout", sortOrder: 3 },
  { code: "personalCare", iconKey: "heart-pulse", sortOrder: 4 },
  { code: "repair", iconKey: "wrench", sortOrder: 5 },
  { code: "mealDelivery", iconKey: "utensils", sortOrder: 16 },
];

// AU=10% GST, CN=0% VAT, CA=13% HST, US=8.25%, TW=5% VAT, SG=9% GST, HK=0%, MY=6% SST.
const SERVICES: Svc[] = [
  {
    code: "cleaning_basic_2h",
    categoryCode: "cleaning",
    durationMin: 120,
    prices: [
      { country: "AU", basePrice: "110.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "180.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "120.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "126.00", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "882.00", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "170.10", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "982.80", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "567.00", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "cleaning_deep_3h",
    categoryCode: "cleaning",
    durationMin: 180,
    prices: [
      { country: "AU", basePrice: "195.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "320.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "210.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "220.50", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "1543.50", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "297.68", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "1719.90", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "992.25", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "cleaning_seasonal_4h",
    categoryCode: "cleaning",
    durationMin: 240,
    prices: [
      { country: "AU", basePrice: "280.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "460.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "300.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "315.00", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "2205.00", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "425.25", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "2457.00", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "1417.50", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "companion_social_visit",
    categoryCode: "companion",
    durationMin: 120,
    prices: [
      { country: "AU", basePrice: "90.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "150.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "100.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "105.00", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "735.00", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "141.75", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "819.00", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "472.50", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "companion_outing",
    categoryCode: "companion",
    durationMin: 180,
    prices: [
      { country: "AU", basePrice: "140.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "230.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "150.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "157.50", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "1102.50", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "212.62", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "1228.50", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "708.75", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "garden_lawn_1h",
    categoryCode: "garden",
    durationMin: 60,
    prices: [
      { country: "AU", basePrice: "80.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "130.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "85.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "89.25", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "624.75", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "120.49", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "696.15", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "401.62", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "garden_full_3h",
    categoryCode: "garden",
    durationMin: 180,
    prices: [
      { country: "AU", basePrice: "150.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "240.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "165.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "173.25", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "1212.75", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "233.89", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "1351.35", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "779.62", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "personalCare_companionship_2h",
    categoryCode: "personalCare",
    durationMin: 120,
    prices: [
      { country: "AU", basePrice: "85.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "140.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "90.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "94.50", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "661.50", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "127.58", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "737.10", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "425.25", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "personalCare_bathing_1h",
    categoryCode: "personalCare",
    durationMin: 60,
    prices: [
      { country: "AU", basePrice: "60.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "100.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "65.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "68.25", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "477.75", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "92.14", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "532.35", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "307.12", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "repair_handyman_1h",
    categoryCode: "repair",
    durationMin: 60,
    prices: [
      { country: "AU", basePrice: "75.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "120.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "80.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "84.00", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "588.00", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "113.40", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "655.20", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "378.00", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "repair_handyman_3h",
    categoryCode: "repair",
    durationMin: 180,
    prices: [
      { country: "AU", basePrice: "210.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "340.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "230.00", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "241.50", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "1690.50", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "326.03", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "1883.70", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "1086.75", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    // Senior-care meal service: helper sources + delivers the meal and
    // stays to visit — priced as a 60-min companion-style visit, not a
    // per-item menu. Speculative catalog; no real restaurant partners yet.
    code: "mealDelivery_sushi",
    categoryCode: "mealDelivery",
    durationMin: 60,
    prices: [
      { country: "AU", basePrice: "45.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "75.00", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "48.75", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "51.19", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "358.25", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "69.11", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "399.25", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "230.34", taxRate: "0.0600", currency: "MYR" },
    ],
  },
  {
    code: "mealDelivery_chinese",
    categoryCode: "mealDelivery",
    durationMin: 60,
    prices: [
      { country: "AU", basePrice: "50.00", taxRate: "0.1000", currency: "AUD" },
      { country: "CN", basePrice: "83.35", taxRate: "0.0000", currency: "CNY" },
      { country: "CA", basePrice: "54.15", taxRate: "0.1300", currency: "CAD" },
      { country: "US", basePrice: "56.88", taxRate: "0.0825", currency: "USD" },
      { country: "TW", basePrice: "398.13", taxRate: "0.0500", currency: "TWD" },
      { country: "SG", basePrice: "76.79", taxRate: "0.0900", currency: "SGD" },
      { country: "HK", basePrice: "443.63", taxRate: "0.0000", currency: "HKD" },
      { country: "MY", basePrice: "255.94", taxRate: "0.0600", currency: "MYR" },
    ],
  },
];

async function main() {
  // Categories
  for (const cat of CATEGORIES) {
    await db
      .insert(serviceCategories)
      .values({ code: cat.code, iconKey: cat.iconKey, sortOrder: cat.sortOrder })
      .onConflictDoUpdate({
        target: serviceCategories.code,
        set: {
          iconKey: cat.iconKey,
          sortOrder: cat.sortOrder,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`✅ ${CATEGORIES.length} categories upserted`);

  // Services + prices
  let svcCount = 0;
  let priceCount = 0;
  for (const svc of SERVICES) {
    const [row] = await db
      .insert(services)
      .values({
        code: svc.code,
        categoryCode: svc.categoryCode,
        durationMin: svc.durationMin,
      })
      .onConflictDoUpdate({
        target: services.code,
        set: {
          categoryCode: svc.categoryCode,
          durationMin: svc.durationMin,
          updatedAt: new Date(),
        },
      })
      .returning({ id: services.id });
    svcCount++;
    for (const p of svc.prices) {
      await db
        .insert(servicePrices)
        .values({
          serviceId: row.id,
          country: p.country,
          basePrice: p.basePrice,
          taxRate: p.taxRate,
          currency: p.currency,
        })
        .onConflictDoUpdate({
          target: [servicePrices.serviceId, servicePrices.country],
          set: {
            basePrice: p.basePrice,
            taxRate: p.taxRate,
            currency: p.currency,
            updatedAt: new Date(),
          },
        });
      priceCount++;
    }
  }
  console.log(`✅ ${svcCount} services upserted`);
  console.log(`✅ ${priceCount} country prices upserted`);

  // Verify
  const totals = await db.execute(sql`
    select
      (select count(*)::int from service_categories) as cats,
      (select count(*)::int from services) as svcs,
      (select count(*)::int from service_prices) as prices
  `);
  console.log("\nDB totals:", totals[0]);

  await client.end();
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  await client.end();
  process.exit(1);
});
