import * as React from "react";
import { cn } from "@/components/ui/cn";

// Each hue's foreground is a *darker* shade than the matching --*-soft
// background so the rendered initials clear WCAG 2.1 AA (≥4.5:1).
// The accent amber and indigo are explicitly darkened from their
// hover-style mid tones for the same reason.
const HUE_CLASSES = [
  "bg-brand-soft text-brand",
  "bg-brand-accent-soft text-[#92400E] dark:text-[#FCD34D]",
  "bg-success-soft text-success",
  "bg-[#EEF2FF] text-[#3730A3] dark:bg-[#1E1B4B] dark:text-[#A5B4FC]",
] as const;

export interface ProviderAvatarProps {
  size?: number;
  hue?: 0 | 1 | 2 | 3;
  initials: string;
  className?: string;
}

export function ProviderAvatar({
  size = 56,
  hue = 0,
  initials,
  className,
}: ProviderAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold",
        HUE_CLASSES[hue],
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(14, size * 0.4) }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
