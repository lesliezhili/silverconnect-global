"use client";

import { ThemeProvider } from "next-themes";

/**
 * Client-side provider wrapper. `next-themes` is a client component, so it
 * can't live directly in the server-rendered root layout — this thin wrapper
 * is the seam.
 *
 * `attribute="data-theme"` makes next-themes write `<html data-theme="dark|light">`,
 * which matches the Tailwind `darkMode: ["class", '[data-theme="dark"]']` selector
 * and the CSS variable blocks in globals.css. `enableSystem` resolves "system"
 * to the actual OS preference and still writes a concrete `data-theme` value, so
 * `dark:` utilities and token variables stay in sync.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      storageKey="theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
