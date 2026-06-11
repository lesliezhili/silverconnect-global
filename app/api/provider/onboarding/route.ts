import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/provider/onboarding?country=AU|NZ — Get onboarding requirements
 * GET /api/provider/onboarding?providerId=xxx — Get provider's onboarding progress
 * POST /api/provider/onboarding — Submit onboarding documents
 *   Body: { providerId, country, documents: [{type, url, expiryDate?}], bankDetails: {...}, taxNumber? }
 */

const AU_REQUIREMENTS = [
  { id: "police_check", label: "National Police Check", required: true },
  { id: "wwc", label: "Working With Children Check", required: true },
  { id: "photo_id", label: "Photo ID (Licence/Passport)", required: true },
  { id: "work_rights", label: "Work Rights Verification", required: true },
  { id: "insurance", label: "Public Liability Insurance ($10M)", required: true },
  { id: "first_aid", label: "First Aid Certificate", required: false },
  { id: "abn", label: "ABN Registration", required: false },
];

const NZ_REQUIREMENTS = [
  { id: "police_vet", label: "NZ Police Vetting (MoJ)", required: true },
  { id: "safety_check", label: "Safety Check (Children\u2019s Act)", required: true },
  { id: "photo_id", label: "Photo ID (NZ Licence/Passport)", required: true },
  { id: "work_rights", label: "NZ Work Rights", required: true },
  { id: "ird_number", label: "IRD Number", required: true },
  { id: "insurance", label: "Public Liability (NZ$2M)", required: true },
  { id: "acc_registration", label: "ACC Levy Registration", required: true },
  { id: "first_aid", label: "First Aid (NZQA 6402)", required: false },
  { id: "nzbn", label: "NZBN (Business Number)", required: false },
];

const AU_BANK_FORMAT = { fields: ["bsb", "account_number", "account_name"], example: "BSB: 062-000, Account: 12345678" };
const NZ_BANK_FORMAT = { fields: ["bank_code", "branch_code", "account_number", "suffix", "account_name"], example: "06-0101-0012345-00" };

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");
  const providerId = req.nextUrl.searchParams.get("providerId");

  if (country) {
    const isNZ = country === "NZ";
    return NextResponse.json({
      success: true,
      country,
      requirements: isNZ ? NZ_REQUIREMENTS : AU_REQUIREMENTS,
      bankFormat: isNZ ? NZ_BANK_FORMAT : AU_BANK_FORMAT,
      taxRegistration: isNZ ? { label: "IRD Number", format: "XX-XXX-XXX" } : { label: "ABN", format: "XX XXX XXX XXX" },
      training: isNZ
        ? ["Health & Safety at Work Act 2015", "Elder Care Fundamentals", "Te Tiriti o Waitangi Awareness", "Privacy Act 2020", "Manual Handling"]
        : ["WHS Fundamentals", "Elder Care Basics", "Cultural Sensitivity", "Privacy & Confidentiality", "Manual Handling"],
      compliance: isNZ
        ? { insurance: "NZ$2M public liability", worksafe: "WorkSafe NZ registered", acc: "ACC levy current" }
        : { insurance: "A$10M public liability", worksafe: "SafeWork Australia compliant", superannuation: "Super guarantee current" },
    });
  }

  if (providerId) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
    try {
      const [profile] = await sql`SELECT pp.*, u.name, u.email FROM provider_profiles pp JOIN users u ON pp.user_id = u.id WHERE pp.id = ${providerId} OR pp.user_id = ${providerId} LIMIT 1`;
      if (!profile) { await sql.end(); return NextResponse.json({ error: "Provider not found" }, { status: 404 }); }
      const docs = await sql`SELECT * FROM provider_documents WHERE provider_id = ${profile.id} ORDER BY created_at DESC`;
      // Check country preference
      const [pref] = await sql`SELECT value FROM platform_settings WHERE key = ${'user_country_' + profile.user_id}`.catch(() => [null]);
      const providerCountry = pref ? JSON.parse(pref.value).country : "AU";
      const requirements = providerCountry === "NZ" ? NZ_REQUIREMENTS : AU_REQUIREMENTS;
      const submitted = docs.map((d: Record<string, string>) => d.document_type);
      const progress = requirements.map(r => ({ ...r, submitted: submitted.includes(r.id), document: docs.find((d: Record<string, string>) => d.document_type === r.id) || null }));
      const requiredDone = progress.filter(p => p.required && p.submitted).length;
      const requiredTotal = progress.filter(p => p.required).length;
      await sql.end();
      return NextResponse.json({ success: true, provider: { id: profile.id, name: profile.name, country: providerCountry, onboardingStatus: profile.onboarding_status }, progress, completion: { done: requiredDone, total: requiredTotal, percent: Math.round((requiredDone / requiredTotal) * 100) } });
    } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
  }

  return NextResponse.json({ error: "Provide ?country=AU|NZ or ?providerId=xxx" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const { providerId, country = "AU", documents, bankDetails, taxNumber } = await req.json();
  if (!providerId) return NextResponse.json({ error: "providerId required" }, { status: 400 });

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    // Save country preference
    await sql`INSERT INTO platform_settings (key, value, updated_at) VALUES (${'user_country_' + providerId}, ${JSON.stringify({ country })}, NOW()) ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify({ country })}, updated_at = NOW()`;

    // Save documents
    const savedDocs: string[] = [];
    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        await sql`INSERT INTO provider_documents (provider_id, document_type, document_url, status, expiry_date) VALUES (${providerId}, ${doc.type}, ${doc.url || ''}, 'pending', ${doc.expiryDate || null}) ON CONFLICT DO NOTHING`;
        savedDocs.push(doc.type);
      }
    }

    // Save bank details (NZ format: bank-branch-account-suffix)
    if (bankDetails) {
      if (country === "NZ") {
        const nzAccount = [bankDetails.bank_code, bankDetails.branch_code, bankDetails.account_number, bankDetails.suffix].filter(Boolean).join("-");
        await sql`UPDATE provider_profiles SET bsb = ${bankDetails.bank_code + '-' + bankDetails.branch_code}, account_number = ${bankDetails.account_number + '-' + (bankDetails.suffix || '00')}, account_name = ${bankDetails.account_name || ''}, updated_at = NOW() WHERE id = ${providerId} OR user_id = ${providerId}`;
      } else {
        await sql`UPDATE provider_profiles SET bsb = ${bankDetails.bsb || ''}, account_number = ${bankDetails.account_number || ''}, account_name = ${bankDetails.account_name || ''}, updated_at = NOW() WHERE id = ${providerId} OR user_id = ${providerId}`;
      }
    }

    // Save tax number in notes
    if (taxNumber) {
      const taxLabel = country === "NZ" ? "IRD" : "ABN";
      await sql`UPDATE provider_profiles SET notes = ${taxLabel + ': ' + taxNumber}, updated_at = NOW() WHERE id = ${providerId} OR user_id = ${providerId}`;
    }

    await sql.end();
    return NextResponse.json({ success: true, savedDocuments: savedDocs, country, bankSaved: !!bankDetails, taxSaved: !!taxNumber });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
