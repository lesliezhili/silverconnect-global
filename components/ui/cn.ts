import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Register our custom font-size utilities (defined in tailwind.config.ts
// `theme.extend.fontSize`). Without this, twMerge sees `text-body` and
// `text-h2` etc. as text-color classes and silently drops real colors
// like `text-white` when both are merged together — that was producing
// invisible Button labels (#0F172A on bg-brand 1858C4 = 2.74:1).
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["body", "small", "h1", "h2", "h3"] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
