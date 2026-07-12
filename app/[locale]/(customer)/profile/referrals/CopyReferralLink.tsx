"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CopyReferralLink({
  link,
  copyLabel,
  copiedLabel,
}: {
  link: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — no-op, the link text is still selectable.
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input
        readOnly
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        className="block w-full min-h-touch-btn rounded-md bg-bg-surface-2 px-4 text-body text-text-primary border-[1.5px] border-border"
      />
      <Button type="button" variant="secondary" onClick={handleCopy}>
        {copied ? (
          <>
            <Check size={18} aria-hidden /> {copiedLabel}
          </>
        ) : (
          <>
            <Copy size={18} aria-hidden /> {copyLabel}
          </>
        )}
      </Button>
    </div>
  );
}
