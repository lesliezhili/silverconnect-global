// filepath: components/PaymentHistory.tsx
"use client";

import { useState, useEffect } from "react";

interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  customer_name?: string;
  provider_name?: string;
}

interface PaymentHistoryProps {
  userId: string;
  userType: "customer" | "provider";
}

export default function PaymentHistory({ userId, userType }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "refunded">("all");

  useEffect(() => {
    loadPayments();
  }, [userId, userType]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payment?user_id=${userId}&user_type=${userType}`);
      const data = await response.json();
      if (data.payments) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.status === "completed" ? p.amount : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
        <div className="flex gap-2">
          {(["all", "completed", "pending", "refunded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {userType === "provider" && (
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-medium">Total Earnings:</span> ${totalAmount.toFixed(2)}
          </p>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No payments found
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {userType === "customer" 
                      ? `Payment to ${payment.provider_name || "Provider"}`
                      : `Payment from ${payment.customer_name || "Customer"}`
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    Booking #{payment.booking_id?.substring(0, 8)} • {payment.payment_method}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    ${payment.amount.toFixed(2)}
                  </p>
                  {getStatusBadge(payment.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}