"use client";

import * as React from "react";
import { FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

/**
 * Generates a compliant invoice for a completed booking with one click —
 * every required field (ABN, service code, date/time, hours, rate, GST)
 * is derived server-side from the booking itself, so there's nothing to
 * hand-type and nothing to accidentally leave out.
 */
export function GenerateInvoiceButton({
  bookingId,
  strings,
}: {
  bookingId: string;
  strings: {
    generate: string;
    generating: string;
    view: string;
    alreadyInvoiced: string;
  };
}) {
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "exists" | "error">("idle");
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const generate = async () => {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/provider/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (res.status === 409 && data.invoiceId) {
        setInvoiceId(data.invoiceId);
        setState("exists");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Failed");
        setState("error");
        return;
      }
      setInvoiceId(data.invoice.id);
      setState("done");
    } catch {
      setError("Network error");
      setState("error");
    }
  };

  if (state === "done" || state === "exists") {
    return (
      <Link
        href={`/customer/invoices/${invoiceId}`}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-success text-[17px] font-bold text-success"
      >
        <Check size={18} aria-hidden />
        {state === "exists" ? strings.alreadyInvoiced : strings.view}
      </Link>
    );
  }

  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="secondary"
        block
        disabled={state === "loading"}
        onClick={generate}
      >
        <FileText size={18} aria-hidden />
        {state === "loading" ? strings.generating : strings.generate}
      </Button>
      {error && <p className="mt-2 text-[15px] text-danger">{error}</p>}
    </div>
  );
}
