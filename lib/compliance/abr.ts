import "server-only";

/**
 * Australian Business Register (ABR) ABN Lookup — GUID-based JSON web service.
 * Used to validate that an AU provider's ABN exists and is active, and to
 * pull the registered entity name.
 *
 * Requires `ABR_GUID` (free, register at https://abr.business.gov.au/Tools/WebServices).
 * Without it, lookups return { ok:false, error:"unavailable" } so the caller
 * can show a graceful message rather than crash.
 */
export type AbnLookupResult =
  | { ok: true; active: boolean; entityName: string | null; abn: string }
  | { ok: false; error: "invalid_format" | "not_found" | "unavailable" };

const ABN_RE = /^\d{11}$/;

/** Strip spaces/dashes so "12 345 678 901" and "12-345-678-901" both work. */
export function normalizeAbn(raw: string): string {
  return raw.replace(/[\s-]/g, "");
}

export async function lookupAbn(rawAbn: string): Promise<AbnLookupResult> {
  const abn = normalizeAbn(rawAbn);
  if (!ABN_RE.test(abn)) return { ok: false, error: "invalid_format" };

  const guid = process.env.ABR_GUID;
  if (!guid) return { ok: false, error: "unavailable" };

  try {
    const url = new URL("https://abr.business.gov.au/json/AbnDetails.aspx");
    url.searchParams.set("abn", abn);
    url.searchParams.set("guid", guid);
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, error: "unavailable" };

    // The endpoint returns JSONP: `callback({...})`. Strip the wrapper.
    const text = await res.text();
    const jsonText = text.replace(/^[^(]*\(/, "").replace(/\)\s*;?\s*$/, "");
    const data = JSON.parse(jsonText) as {
      Abn?: string;
      AbnStatus?: string;
      EntityName?: string;
      BusinessName?: string[];
      Message?: string;
    };

    if (!data.Abn || (data.Message && data.Message.trim().length > 0)) {
      return { ok: false, error: "not_found" };
    }
    const entityName =
      data.EntityName?.trim() ||
      data.BusinessName?.find((n) => n.trim().length > 0)?.trim() ||
      null;
    return { ok: true, active: data.AbnStatus === "Active", entityName, abn };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}
