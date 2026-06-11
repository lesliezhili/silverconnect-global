"use client";
import { useEffect } from "react";

/** Updates <html lang="..."> to match the active locale after hydration. */
export function LangSync({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
