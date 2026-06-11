import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/**
 * POST /api/xero/invoice — Create invoice in Xero for a completed booking
 * Body: { bookingId, customerName, customerEmail, serviceName, duration, basePrice, gstAmount, totalPrice }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, customerName, customerEmail, serviceName, duration, basePrice, gstAmount, totalPrice } = body;

    const url = process.env.DATABASE_URL;
    if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
    const sql = postgres(url, { prepare: false });

    // Get Xero tokens
    // Ensure table exists
    await sql`CREATE TABLE IF NOT EXISTS platform_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`;
    const [settings] = await sql`SELECT value FROM platform_settings WHERE key = 'xero_tokens'`;
    if (!settings?.value) {
      await sql.end();
      return NextResponse.json({ error: "Xero not connected. Visit /api/xero/connect first." }, { status: 400 });
    }

    let tokens = JSON.parse(settings.value);

    // Refresh token if expired
    if (Date.now() > tokens.expires_at) {
      const refreshResp = await fetch("https://identity.xero.com/connect/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            (process.env.XERO_CLIENT_ID || "") + ":" + (process.env.XERO_CLIENT_SECRET || "")
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokens.refresh_token,
        }),
      });
      if (!refreshResp.ok) {
        await sql.end();
        return NextResponse.json({ error: "Xero token refresh failed. Re-authorize at /api/xero/connect", status: refreshResp.status }, { status: 401 });
      }
      const newTokens = await refreshResp.json();
      if (newTokens.access_token) {
        tokens = { ...tokens, access_token: newTokens.access_token, refresh_token: newTokens.refresh_token, expires_at: Date.now() + newTokens.expires_in * 1000 };
        await sql`UPDATE platform_settings SET value = ${JSON.stringify(tokens)}, updated_at = NOW() WHERE key = 'xero_tokens'`;
      }
    }

    // Create Xero invoice
    const invoice = {
      Type: "ACCREC",
      Contact: { Name: customerName || "Customer", EmailAddress: customerEmail || "" },
      LineItems: [{
        Description: `${serviceName || "Service"} — ${duration || 60} min`,
        Quantity: 1,
        UnitAmount: basePrice || 0,
        TaxType: "OUTPUT", // GST
        AccountCode: "200", // Sales
      }],
      DueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      Reference: `SC-${bookingId}`,
      CurrencyCode: "AUD",
      Status: "AUTHORISED",
    };

    const xeroResp = await fetch("https://api.xero.com/api.xro/2.0/Invoices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "xero-tenant-id": tokens.tenant_id,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Invoices: [invoice] }),
    });

    const result = await xeroResp.json();
    await sql.end();

    if (!xeroResp.ok) {
      return NextResponse.json({ error: "Xero API error", details: result }, { status: xeroResp.status });
    }

    const created = result.Invoices?.[0];
    return NextResponse.json({
      success: true,
      invoiceId: created?.InvoiceID,
      invoiceNumber: created?.InvoiceNumber,
      status: created?.Status,
      total: created?.Total,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET /api/xero/invoice — Check Xero connection status
export async function GET() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) return NextResponse.json({ connected: false, reason: "No DB" });
    const sql = postgres(url, { prepare: false });
    // Ensure table exists
    await sql`CREATE TABLE IF NOT EXISTS platform_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`;
    const [settings] = await sql`SELECT value FROM platform_settings WHERE key = 'xero_tokens'`;
    await sql.end();

    if (!settings?.value) return NextResponse.json({ connected: false, reason: "No tokens stored" });
    const tokens = JSON.parse(settings.value);
    return NextResponse.json({
      connected: true,
      expired: Date.now() > tokens.expires_at,
      tenantId: tokens.tenant_id,
    });
  } catch {
    return NextResponse.json({ connected: false, reason: "Error" });
  }
}
