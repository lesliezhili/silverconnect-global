import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

// GET /api/xero/debug — Test each step of Xero integration
export async function GET() {
  const results: Record<string, unknown> = {};

  // Step 1: Check env vars
  results["1_env_vars"] = {
    XERO_CLIENT_ID: process.env.XERO_CLIENT_ID ? process.env.XERO_CLIENT_ID.slice(0, 8) + "..." : "MISSING",
    XERO_CLIENT_SECRET: process.env.XERO_CLIENT_SECRET ? "SET (" + process.env.XERO_CLIENT_SECRET.length + " chars)" : "MISSING",
    XERO_REDIRECT_URI: process.env.XERO_REDIRECT_URI || "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
  };

  // Step 2: Test DB connection + platform_settings table
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const sql = postgres(dbUrl, { prepare: false, connect_timeout: 10 });
      
      // Try to create table
      await sql`
        CREATE TABLE IF NOT EXISTS platform_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      results["2_db_create_table"] = "OK - platform_settings exists/created";

      // Try to read
      const rows = await sql`SELECT key, substring(value, 1, 50) as val_preview FROM platform_settings`;
      results["3_db_read"] = { rowCount: rows.length, keys: rows.map(r => r.key) };

      // Try a test upsert
      await sql`
        INSERT INTO platform_settings (key, value, updated_at)
        VALUES ('xero_debug_test', 'test_value', NOW())
        ON CONFLICT (key) DO UPDATE SET value = 'test_value_updated', updated_at = NOW()
      `;
      results["4_db_upsert"] = "OK - can write to platform_settings";

      // Clean up test row
      await sql`DELETE FROM platform_settings WHERE key = 'xero_debug_test'`;

      await sql.end();
    } catch (e: unknown) {
      results["2_db_error"] = e instanceof Error ? e.message : String(e);
    }
  }

  // Step 3: Test Xero token endpoint connectivity
  try {
    const testResp = await fetch("https://identity.xero.com/.well-known/openid-configuration", {
      signal: AbortSignal.timeout(5000),
    });
    results["5_xero_connectivity"] = testResp.ok ? "OK - can reach Xero" : "FAILED - HTTP " + testResp.status;
  } catch (e: unknown) {
    results["5_xero_connectivity"] = "FAILED: " + (e instanceof Error ? e.message : String(e));
  }

  // Step 4: Show the redirect URI that would be sent
  results["6_redirect_uri_used"] = process.env.XERO_REDIRECT_URI || (process.env.NEXT_PUBLIC_APP_URL || "https://silverconnect-global.vercel.app") + "/api/xero/callback";


  // Step 7: Test actual Xero API call with stored token
  try {
    const url = process.env.DATABASE_URL;
    if (url) {
      const sql2 = postgres(url, { prepare: false, connect_timeout: 10 });
      const [stored] = await sql2`SELECT value FROM platform_settings WHERE key = 'xero_tokens'`;
      if (stored?.value) {
        const tokens = JSON.parse(stored.value);
        // Try a simple GET to Xero org info
        const orgResp = await fetch("https://api.xero.com/api.xro/2.0/Organisation", {
          headers: {
            Authorization: "Bearer " + tokens.access_token,
            "xero-tenant-id": tokens.tenant_id,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000),
        });
        const orgText = await orgResp.text();
        if (orgResp.ok) {
          try {
            const orgData = JSON.parse(orgText);
            results["7_xero_api_test"] = { status: "OK", orgName: orgData.Organisations?.[0]?.Name, httpStatus: orgResp.status };
          } catch {
            results["7_xero_api_test"] = { status: "OK but non-JSON", httpStatus: orgResp.status, preview: orgText.slice(0, 200) };
          }
        } else {
          results["7_xero_api_test"] = { status: "FAILED", httpStatus: orgResp.status, error: orgText.slice(0, 300) };
        }
      } else {
        results["7_xero_api_test"] = "No tokens stored";
      }
      await sql2.end();
    }
  } catch (e: unknown) {
    results["7_xero_api_test"] = { status: "EXCEPTION", error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({ success: true, results });
}
