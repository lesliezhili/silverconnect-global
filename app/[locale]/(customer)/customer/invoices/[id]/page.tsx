"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes: string;
  provider: { name: string; email: string; phone: string };
  customer: { name: string; email: string; phone: string };
  items: InvoiceItem[];
  isOverdue: boolean;
  viewedAt: string | null;
  paidAt: string | null;
}

export default function InvoiceViewPage() {
  const t = useTranslations("invoice");
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}?markViewed=true`)
      .then(r => r.json())
      .then(d => { if (d.success) setInvoice(d.invoice); })
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) return <div className="p-6 text-center">{t("loading")}</div>;
  if (!invoice) return <div className="p-6 text-center text-red-600">{t("notFound")}</div>;

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    viewed: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
  };
  const statusLabels: Record<string, string> = { draft: t("draft"), sent: t("sent"), viewed: t("viewed"), paid: t("paid"), overdue: t("overdue"), cancelled: t("cancelled") };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">{t("from")}: {invoice.provider.name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[invoice.isOverdue ? "overdue" : invoice.status] || "bg-gray-100"}`}>
            {statusLabels[invoice.isOverdue ? "overdue" : invoice.status] || invoice.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div><span className="text-gray-500">{t("issueDate")}:</span> <span className="font-medium">{invoice.issueDate}</span></div>
          <div><span className="text-gray-500">{t("dueDate")}:</span> <span className={`font-medium ${invoice.isOverdue ? "text-red-600" : ""}`}>{invoice.dueDate}</span></div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
        <h2 className="text-lg font-semibold mb-3">{t("items")}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="text-left py-2">{t("description")}</th>
              <th className="text-right py-2">{t("quantity")}</th>
              <th className="text-right py-2">{t("unitPrice")}</th>
              <th className="text-right py-2">{t("amount")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.description}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">${item.unitPrice.toFixed(2)}</td>
                <td className="text-right py-2 font-medium">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">{t("subtotal")}</span><span>${invoice.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">{t("gst")}</span><span>${invoice.taxAmount.toFixed(2)}</span></div>
          <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
            <span>{t("total")}</span><span>${invoice.totalAmount.toFixed(2)} {invoice.currency}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
          <h2 className="text-lg font-semibold mb-2">{t("notes")}</h2>
          <p className="text-sm text-gray-600">{invoice.notes}</p>
        </div>
      )}

      {/* Pay Button */}
      {invoice.status !== "paid" && invoice.status !== "cancelled" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <button
            onClick={async () => {
              const res = await fetch(`/api/invoices/${invoiceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "pay" }),
              });
              if (res.ok) { setInvoice({ ...invoice, status: "paid", paidAt: new Date().toISOString() }); }
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition"
          >
            {t("pay")} ${invoice.totalAmount.toFixed(2)}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">{t("poweredBy")}</p>
        </div>
      )}

      {invoice.status === "paid" && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
          <span className="text-2xl">✅</span>
          <p className="text-green-700 font-semibold mt-2">{t("paySuccess")}</p>
          <p className="text-xs text-gray-500 mt-1">{invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : ""}</p>
        </div>
      )}
    </div>
  );
}
