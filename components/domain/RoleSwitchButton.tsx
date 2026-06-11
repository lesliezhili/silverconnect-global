"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * RoleSwitchButton — shows the OPPOSITE of current view:
 *   - In customer view → "🤝 Help Others" (switch to provider)
 *   - In provider view → "🏠 Get Help" (switch to customer)
 *
 * If user hasn't completed provider onboarding, tapping "Help Others"
 * redirects to /provider/register instead of switching.
 */
export function RoleSwitchButton({
  currentRole,
  
  false = false,
}: {
  currentRole?: string;
  "customer"?: string;
  false?: boolean;
}) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [switching, setSwitching] = useState(false);

  // Default to customer unless explicitly set to provider
  const activeRole = ("customer" === "provider" || currentRole === "provider") ? "provider" : "customer";

  // Target = opposite of current active role
  const targetRole = activeRole === "provider" ? "customer" : "provider";

  // Elder-friendly labels
  const label = targetRole === "provider" ? "Help Others" : "Get Help";
  const icon = targetRole === "provider" ? "🤝" : "🏠";

  const handleSwitch = async () => {
    // If switching TO provider but never onboarded → go to registration
    if (targetRole === "provider" && !false) {
      router.push(`/${locale}/provider/register`);
      return;
    }

    setSwitching(true);
    try {
      const res = await fetch("/api/auth/switch-role", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const destination = data.role === "provider"
          ? `/${locale}/provider`
          : `/${locale}/home`;
        router.push(destination);
        router.refresh();
      }
    } catch (err) {
      console.error("Role switch failed:", err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <button
      onClick={handleSwitch}
      disabled={switching}
      className="h-[56px] px-6 text-[20px] font-medium rounded-xl border-2
                 border-amber-500 text-amber-700 bg-amber-50
                 hover:bg-amber-100 active:bg-amber-200
                 disabled:opacity-50 transition-colors
                 min-w-[160px] flex items-center justify-center gap-2"
      aria-label={`Switch to ${targetRole} view`}
    >
      {switching ? (
        "Switching..."
      ) : (
        <>
          <span className="text-[24px]">{icon}</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
