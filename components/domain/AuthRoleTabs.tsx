"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/components/ui/cn";

export type AuthRole = "consumer" | "provider";

export function AuthRoleTabs({ current }: { current: AuthRole }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();

  function select(role: AuthRole) {
    if (role === current) return;
    const query = role === "provider" ? { role } : {};
    router.replace({ pathname, query }, { scroll: false });
  }

  return (
    <div
      role="tablist"
      aria-label={t("roleTabConsumer") + " / " + t("roleTabProvider")}
      className="mb-5 grid grid-cols-2 gap-1 rounded-md border border-border bg-bg-surface p-1"
    >
      <Tab selected={current === "consumer"} onClick={() => select("consumer")}>
        {t("roleTabConsumer")}
      </Tab>
      <Tab selected={current === "provider"} onClick={() => select("provider")}>
        {t("roleTabProvider")}
      </Tab>
    </div>
  );
}

function Tab({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "h-10 rounded text-[14px] font-semibold transition-colors",
        selected
          ? "bg-bg-base text-text-primary shadow-card"
          : "text-text-secondary hover:text-text-primary"
      )}
    >
      {children}
    </button>
  );
}
