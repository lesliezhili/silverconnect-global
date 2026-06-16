"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RoleSwitchButtonProps {
  role: "customer" | "provider";
  hasCompletedOnboarding: boolean;
  locale: string;
}

/**
 * RoleSwitchButton — Fixed Logic
 * 
 * Shows the OPPOSITE of the current view:
 *   - In customer view → "Help Others" (switch to provider)
 *   - In provider view → "Get Help" (switch to customer)
 * 
 * If user hasn't completed provider onboarding, tapping "Help Others"
 * redirects to /provider/register instead of switching.
 */
export function RoleSwitchButton({
  role,
  hasCompletedOnboarding,
  locale,
}: RoleSwitchButtonProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  // Target = opposite of current
  const targetRole = role === "customer" ? "provider" : "customer";

  // Elder-friendly labels with clear meaning
  const label = targetRole === "provider" ? "Help Others" : "Get Help";
  const icon = targetRole === "provider" ? "🤝" : "\u{1F3E0}";

  const handleSwitch = async () => {
    // If switching TO provider but never onboarded → go to registration
    if (targetRole === "provider" && !hasCompletedOnboarding) {
      router.push(`/${locale}/provider/register`);
      return;
    }

    setSwitching(true);
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });

      if (res.ok) {
        const destination =
          targetRole === "provider"
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
