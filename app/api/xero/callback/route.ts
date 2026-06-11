import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

// GET /api/xero/callback — OAuth callback, stores tokens
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?xero=error&detail=" + error, req.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/?xero=no_code", req.url));
  }

  try {
    // Exchange code for tokens
    const tokenResp = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          (process.env.XERO_CLIENT_ID || "") + ":" + (process.env.XERO_CLIENT_SECRET || "")
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.XERO_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/xero/callback`,
      }),
    });

    const tokens = await tokenResp.json();

    if (!tokens.access_token) {
      const detail = tokens.error || "no_access_token";
      return NextResponse.redirect(new URL("/?xero=token_failed&detail=" + detail, req.url));
    }

    // Get tenant ID from connections
    const connResp = await fetch("https://api.xero.com/connections", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const connections = await connResp.json();
    const tenantId = connections?.[0]?.tenantId || "";

    // Store tokens in DB
    const url = process.env.DATABASE_URL;
    if (!url) {
      return NextResponse.redirect(new URL("/?xero=no_db", req.url));
    }

    const sql = postgres(url, { prepare: false, connect_timeout: 15 });

    // Auto-create platform_settings table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS platform_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Upsert the tokens
    const tokenData = JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in || 1800) * 1000,
      tenant_id: tenantId,
    });

    await sql`
      INSERT INTO platform_settings (key, value, updated_at)
      VALUES ('xero_tokens', ${tokenData}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;

    await sql.end();

    return NextResponse.redirect(new URL("/?xero=connected", req.url));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack?.slice(0, 500) : "";
    // Return JSON error for debugging (remove in production)
    return NextResponse.json({ 
      error: "callback_failed", 
      message: msg, 
      stack,
      env: {
        XERO_CLIENT_ID: process.env.XERO_CLIENT_ID ? "SET" : "MISSING",
        XERO_CLIENT_SECRET: process.env.XERO_CLIENT_SECRET ? "SET" : "MISSING",
        XERO_REDIRECT_URI: process.env.XERO_REDIRECT_URI || "NOT SET",
        DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
      }
    }, { status: 500 });
  }
}
