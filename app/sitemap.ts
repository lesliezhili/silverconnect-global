import { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://silverconnect-global.vercel.app";
  return ["en", "zh"].flatMap((l) =>
    ["", "/auth/register", "/auth/login", "/cancellation-policy", "/terms", "/privacy-policy", "/help"].map((p) => ({
      url: `${base}/${l}${p}`, lastModified: new Date("2026-05-28"), changeFrequency: "weekly" as const, priority: p === "" ? 1.0 : 0.7,
    }))
  );
}
