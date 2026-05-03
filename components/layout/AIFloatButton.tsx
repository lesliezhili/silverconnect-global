"use client";

import * as React from "react";
import { MessageCircleHeart } from "lucide-react";
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

  return (
    <Link
      href="/chat"
      aria-label={t("askAI")}
      className={cn(
        "fixed bottom-24 right-6 z-30 inline-flex h-16 w-16 items-center justify-center rounded-full text-white shadow-card",
        "sm:bottom-6",
        emergency ? "bg-danger" : "bg-brand hover:bg-brand-hover",
        className
      )}
    >
      <MessageCircleHeart size={28} aria-hidden />
      <span className="sr-only">{t("askAI")}</span>
    </Link>
  );
}
