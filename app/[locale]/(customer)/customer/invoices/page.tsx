"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface InvoiceSummary {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: string;
  due_date: string;
  provider_name: string;
  created_at: string;
}

export default function CustomerInvoicesPage() {
  const t = useTranslations("invoice");
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customerId = "37ed768b-5770-46e6-851d-b605eae5f884";
    fetch(`/api/customer/invoices?customerId=${customerId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setInvoices(d.invoices); })
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { draft: "bg-gray-100 text-gray-600", sent: "bg-blue-100 text-blue-700", viewed: "bg-yellow-100 text-yellow-700", paid: "bg-green-100 text-green-700", overdue: "bg-red-100 text-red-700", cancelled: "bg-gray-200 text-gray-500" };
    const labels: Record<string, string> = { draft: t("draft"), sent: t("sent"), viewed: t("viewed"), paid: t("paid"), overdue: t("overdue"), cancelled: t("cancelled") };
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[status] || "bg-gray-100"}`}>{labels[status] || status}</span>;
  };

  if (loading) return <div className="p-6 text-center">{t("loading")}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t("myInvoices")}</h1>
      {invoices.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{t("noInvoices")}</p>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <a key={inv.id} href={`invoices/${inv.id}`} className="block bg-white rounded-lg shadow-sm border p-4 hover:border-emerald-300 transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{inv.invoice_number}</p>
                  <p className="text-sm text-gray-500">{inv.provider_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${parseFloat(inv.total_amount).toFixed(2)}</p>
                  {statusBadge(inv.status)}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{t("dueDate")}: {inv.due_date}</p>
            </a>
          ))}
        </div>
      )}
      <p className="text-[10px] text-gray-400 text-center mt-6">{t("poweredBy")}</p>
    </div>
  );
}
