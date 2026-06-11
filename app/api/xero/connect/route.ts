// Xero OAuth integration — env vars: XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_REDIRECT_URI
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/xero/connect — Start Xero OAuth flow
export async function GET(req: NextRequest) {
  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri = process.env.XERO_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/xero/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "XERO_CLIENT_ID not configured", setup: "https://developer.xero.com/app/manage" }, { status: 500 });
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid offline_access accounting.invoices accounting.contacts accounting.settings.read",
    state,
  });

  return NextResponse.redirect(`https://login.xero.com/identity/connect/authorize?${params}`);
}
