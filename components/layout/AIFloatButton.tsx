"use client";

import * as React from "react";
import { MessageCircleHeart, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/components/ui/cn";

export function AIFloatButton({
  emergency = false,
  className,
}: {
  emergency?: boolean;
  className?: string;
}) {
  const t = useTranslations("common");
  const Icon = emergency ? AlertTriangle : MessageCircleHeart;

  return (
    <Link
      href="/chat"
      aria-label={emergency ? "SOS" : t("askAI")}
      className={cn(
        "fixed bottom-[100px] right-5 z-30 flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-pill text-white shadow-card-hover",
        "sm:bottom-6",
        emergency
          ? "bg-danger shadow-[0_8px_24px_rgba(220,38,38,0.5)]"
          : "bg-brand shadow-[0_8px_24px_rgba(31,111,235,0.4)]",
        className
      )}
    >
      <Icon size={24} aria-hidden />
      <span className="text-[11px] font-bold leading-none">
        {emergency ? "SOS" : t("askAI")}
      </span>
    </Link>
  );
}
