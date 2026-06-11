import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider, PHLEDGER_API_URL } from "@/lib/payments/provider-config";

/**
 * GET /api/provider/invoices?providerId=xxx — List provider's invoices
 * POST /api/provider/invoices — Provider creates an invoice for customer
 * 
 * Body: {
 *   providerId, customerId, bookingId?,
 *   items: [{ description, quantity, unitPrice, taxRate? }],
 *   notes?, dueInDays?
 * }
 * 
 * Automatically:
 *   - Generates sequential invoice number (SC-INV-YYYY-NNNN)
 *   - Calculates subtotal, GST, total
 *   - Sends to Xero or PHLedger based on payment provider
 *   - Notifies customer
 */
export async function GET(req: NextRequest) {
  const providerId = req.nextUrl.searchParams.get("providerId");
  if (!providerId) return NextResponse.json({ error: "providerId required" }, { status: 400 });

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    const invoices = await sql`
      SELECT i.*, u.name as customer_name, u.email as customer_email
      FROM invoices i
      JOIN users u ON i.customer_id = u.id
      WHERE i.provider_id = ${providerId}
      ORDER BY i.created_at DESC
      LIMIT 50
    `;
    await sql.end();
    return NextResponse.json({ success: true, invoices });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { providerId, customerId, bookingId, items, notes = "", dueInDays = 14 } = body;

  if (!providerId || !customerId || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "providerId, customerId, and items[] required" }, { status: 400 });
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    // Verify provider and customer exist
    const [provider] = await sql`SELECT id, name, email FROM users WHERE id = ${providerId}`;
    const [customer] = await sql`SELECT id, name, email FROM users WHERE id = ${customerId}`;
    if (!provider) { await sql.end(); return NextResponse.json({ error: "Provider not found" }, { status: 404 }); }
    if (!customer) { await sql.end(); return NextResponse.json({ error: "Customer not found" }, { status: 404 }); }

    // Generate invoice number
    const year = new Date().getFullYear();
    const [countResult] = await sql`SELECT COUNT(*) as cnt FROM invoices WHERE invoice_number LIKE ${"SC-INV-" + year + "%"}`;
    const seqNum = (parseInt(countResult.cnt) || 0) + 1;
    const invoiceNumber = `SC-INV-${year}-${String(seqNum).padStart(4, "0")}`;

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map((item: { description: string; quantity?: number; unitPrice: number; taxRate?: number }, idx: number) => {
      const qty = item.quantity || 1;
      const price = item.unitPrice;
      const amount = Math.round(qty * price * 100) / 100;
      subtotal += amount;
      return { description: item.description, quantity: qty, unitPrice: price, taxRate: item.taxRate ?? 10, amount, sortOrder: idx };
    });

    const taxRate = processedItems[0]?.taxRate || 10;
    const taxAmount = Math.round(subtotal * taxRate / 100 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    // Create invoice
    const dueDate = new Date(Date.now() + dueInDays * 86400000).toISOString().split("T")[0];
    const provider_ = getPaymentProvider();

    const [invoice] = await sql`
      INSERT INTO invoices (invoice_number, booking_id, provider_id, customer_id, status, due_date, subtotal, tax_amount, total_amount, notes, payment_provider)
      VALUES (${invoiceNumber}, ${bookingId || null}, ${providerId}, ${customerId}, 'sent', ${dueDate}::date, ${subtotal}, ${taxAmount}, ${totalAmount}, ${notes}, ${provider_})
      RETURNING id, invoice_number, status, issue_date, due_date, subtotal, tax_amount, total_amount
    `;

    // Insert line items
    for (const item of processedItems) {
      await sql`INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tax_rate, amount, sort_order)
        VALUES (${invoice.id}, ${item.description}, ${item.quantity}, ${item.unitPrice}, ${item.taxRate}, ${item.amount}, ${item.sortOrder})`;
    }

    // Send to Xero or PHLedger
    let externalInvoiceId = "";
    if (provider_ === "phledger") {
      try {
        const resp = await fetch(`${PHLEDGER_API_URL}/api/invoice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: bookingId || invoice.id,
            customerName: customer.name,
            customerEmail: customer.email,
            serviceName: processedItems.map((i: { description: string }) => i.description).join(", "),
            duration: 0,
            totalAmount,
            basePrice: subtotal,
            gstAmount: taxAmount,
            platformFee: Math.round(totalAmount * 0.15 * 100) / 100,
            providerPayout: Math.round(totalAmount * 0.85 * 100) / 100,
          }),
        });
        const data = await resp.json();
        externalInvoiceId = data.invoiceNumber || "";
        await sql`UPDATE invoices SET phledger_invoice_id = ${externalInvoiceId} WHERE id = ${invoice.id}`;
      } catch { /* PHLedger not available */ }
    } else {
      // Xero invoice
      try {
        const xeroRows = await sql`SELECT value FROM platform_settings WHERE key = 'xero_tokens'`;
        if (xeroRows[0]?.value) {
          const tokens = JSON.parse(xeroRows[0].value);
          let accessToken = tokens.access_token;

          // Refresh if expired
          if (Date.now() > tokens.expires_at && process.env.XERO_CLIENT_ID) {
            const refreshResp = await fetch("https://identity.xero.com/connect/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + Buffer.from((process.env.XERO_CLIENT_ID || "") + ":" + (process.env.XERO_CLIENT_SECRET || "")).toString("base64") },
              body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: tokens.refresh_token }),
            });
            if (refreshResp.ok) {
              const nt = await refreshResp.json();
              if (nt.access_token) {
                accessToken = nt.access_token;
                await sql`UPDATE platform_settings SET value = ${JSON.stringify({ ...tokens, access_token: nt.access_token, refresh_token: nt.refresh_token || tokens.refresh_token, expires_at: Date.now() + (nt.expires_in || 1800) * 1000 })}, updated_at = NOW() WHERE key = 'xero_tokens'`.catch(() => {});
              }
            }
          }

          const xeroResp = await fetch("https://api.xero.com/api.xro/2.0/Invoices", {
            method: "POST",
            headers: { Authorization: "Bearer " + accessToken, "xero-tenant-id": tokens.tenant_id, "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ Invoices: [{ Type: "ACCREC", Contact: { Name: customer.name, EmailAddress: customer.email }, LineItems: processedItems.map((i: { description: string; quantity: number; unitPrice: number }) => ({ Description: i.description, Quantity: i.quantity, UnitAmount: i.unitPrice, TaxType: "OUTPUT", AccountCode: "200" })), DueDate: dueDate, Reference: invoiceNumber, CurrencyCode: "AUD", Status: "AUTHORISED" }] }),
          });
          if (xeroResp.ok) {
            const data = await xeroResp.json();
            externalInvoiceId = data.Invoices?.[0]?.InvoiceNumber || "";
            await sql`UPDATE invoices SET xero_invoice_id = ${data.Invoices?.[0]?.InvoiceID || ""} WHERE id = ${invoice.id}`;
          }
        }
      } catch { /* Xero not available */ }
    }

    // Notify customer (in-app + email)
    await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id)
      VALUES (${customerId}, 'booking', 'New Invoice', ${'You have a new invoice ' + invoiceNumber + ' for $' + totalAmount + ' from ' + provider.name + '.'}, ${bookingId || null})`.catch(() => {});

    // Send email notification
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://silverconnect-global.vercel.app";
    fetch(`${appUrl}/api/notifications/invoice-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: invoice.id,
        customerEmail: customer.email,
        customerName: customer.name,
        providerName: provider.name,
        invoiceNumber,
        totalAmount: totalAmount.toFixed(2),
        dueDate,
        viewUrl: `/en/customer/invoices/${invoice.id}`,
      }),
    }).catch(() => {}); // Fire-and-forget

    // Mark as sent
    await sql`UPDATE invoices SET sent_at = NOW(), status = 'sent' WHERE id = ${invoice.id}`;

    await sql.end();

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber,
        status: "sent",
        issueDate: invoice.issue_date,
        dueDate,
        subtotal,
        taxAmount,
        totalAmount,
        currency: "AUD",
        items: processedItems,
        customer: { name: customer.name, email: customer.email },
        provider: { name: provider.name },
        externalInvoiceId,
        paymentProvider: provider_,
        viewUrl: `/en/customer/invoices/${invoice.id}`,
      },
    });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
