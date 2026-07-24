import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/invoices/[id] — Get invoice detail with line items
 * 
 * Returns full invoice with line items. Marks as 'viewed' if customer accesses.
 * Query param: ?markViewed=true to track first customer view.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const markViewed = req.nextUrl.searchParams.get("markViewed") === "true";

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    const [invoice] = await sql`
      SELECT i.*,
        p.name as provider_name, p.email as provider_email, p.phone as provider_phone,
        c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM invoices i
      JOIN users p ON i.provider_id = p.id
      JOIN users c ON i.customer_id = c.id
      WHERE i.id = ${id}
    `;

    if (!invoice) {
      await sql.end();
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const items = await sql`SELECT * FROM invoice_items WHERE invoice_id = ${id} ORDER BY sort_order`;

    // Mark as viewed if customer is viewing for first time
    if (markViewed && invoice.status === "sent" && !invoice.viewed_at) {
      await sql`UPDATE invoices SET status = 'viewed', viewed_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
      invoice.status = "viewed";
      invoice.viewed_at = new Date().toISOString();
    }

    await sql.end();

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.tax_amount),
        totalAmount: Number(invoice.total_amount),
        currency: invoice.currency,
        notes: invoice.notes,
        paymentProvider: invoice.payment_provider,
        xeroInvoiceId: invoice.xero_invoice_id,
        phledgerInvoiceId: invoice.phledger_invoice_id,
        sentAt: invoice.sent_at,
        viewedAt: invoice.viewed_at,
        paidAt: invoice.paid_at,
        createdAt: invoice.created_at,
        provider: { name: invoice.provider_name, email: invoice.provider_email, phone: invoice.provider_phone },
        customer: { name: invoice.customer_name, email: invoice.customer_email, phone: invoice.customer_phone },
        compliance: {
          providerAbn: invoice.provider_abn,
          clientRegisteredName: invoice.client_registered_name,
          serviceDate: invoice.service_date,
          serviceStartTime: invoice.service_start_time,
          serviceEndTime: invoice.service_end_time,
          serviceCode: invoice.service_code,
        },
        items: items.map(i => ({
          id: i.id,
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unit_price),
          taxRate: Number(i.tax_rate),
          amount: Number(i.amount),
        })),
        isOverdue: invoice.status === "sent" && new Date(invoice.due_date) < new Date(),
      },
    });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

/**
 * PATCH /api/invoices/[id] — Update invoice status (pay, cancel)
 * Body: { action: "pay" | "cancel", paymentReference? }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, paymentReference = "" } = body;

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    const [invoice] = await sql`SELECT * FROM invoices WHERE id = ${id}`;
    if (!invoice) { await sql.end(); return NextResponse.json({ error: "Invoice not found" }, { status: 404 }); }

    if (action === "pay") {
      await sql`UPDATE invoices SET status = 'paid', paid_at = NOW(), payment_reference = ${paymentReference}, updated_at = NOW() WHERE id = ${id}`;
      // Notify provider
      await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id)
        VALUES (${invoice.provider_id}, 'booking', 'Invoice Paid', ${'Invoice ' + invoice.invoice_number + ' has been paid ($' + invoice.total_amount + ').'}, ${invoice.booking_id})`.catch(() => {});
    } else if (action === "cancel") {
      await sql`UPDATE invoices SET status = 'cancelled', updated_at = NOW() WHERE id = ${id}`;
    }

    await sql.end();
    return NextResponse.json({ success: true, invoiceId: id, newStatus: action === "pay" ? "paid" : "cancelled" });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
