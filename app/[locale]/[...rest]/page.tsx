import { notFound } from "next/navigation";

/**
 * Catch-all that funnels any unmatched /[locale]/* path into the
 * sibling `not-found.tsx`, so 404s render the localised page
 * instead of Next's default plain "404 — This page could not
 * be found." fallback.
 */
export default function CatchAll() {
  notFound();
}
