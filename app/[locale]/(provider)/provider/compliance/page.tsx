import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Upload,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getCountry } from "@/components/domain/countryCookie";
import { db } from "@/lib/db";
import {
  providerProfiles,
  providerDocuments,
} from "@/lib/db/schema/providers";
import { getCurrentUser } from "@/lib/auth/server";
import { saveUpload } from "@/lib/upload/local";

type DocType = "police_check" | "first_aid" | "insurance" | "identity" | "wwc";

const KNOWN_TYPES: DocType[] = [
  "police_check",
  "first_aid",
  "insurance",
];

async function uploadDocAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const type = String(formData.get("type") ?? "") as DocType;
  const documentNumber =
    String(formData.get("documentNumber") ?? "").trim() || null;
  const expiresAtStr = String(formData.get("expiresAt") ?? "").trim();
  const file = formData.get("file");

  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  if (me.role !== "provider") nextRedirect(`/${locale}/home`);

  if (!KNOWN_TYPES.includes(type)) {
    nextRedirect(`/${locale}/provider/compliance?error=badType`);
  }

  const [profile] = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, me.id))
    .limit(1);
  if (!profile) nextRedirect(`/${locale}/provider/register`);

  if (!(file instanceof File)) {
    nextRedirect(`/${locale}/provider/compliance?error=empty`);
  }
  const result = await saveUpload(file, `compliance/${profile.id}`);
  if ("error" in result) {
    nextRedirect(`/${locale}/provider/compliance?error=${result.error}`);
  }

  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

  // Upsert by (providerId, type) — schema has a unique index on this pair.
  await db
    .insert(providerDocuments)
    .values({
      providerId: profile.id,
      type,
      fileUrl: result.url,
      documentNumber,
      status: "pending",
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [providerDocuments.providerId, providerDocuments.type],
      set: {
        fileUrl: result.url,
        documentNumber,
        status: "pending",
        expiresAt,
        reviewedAt: null,
        reviewerNote: null,
        updatedAt: new Date(),
      },
    });

  nextRedirect(`/${locale}/provider/compliance?uploaded=${type}`);
}

export default async function CompliancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  if (me.role !== "provider") nextRedirect(`/${locale}/home`);
  const country = await getCountry();
  const t = await getTranslations("pCompliance");
  const tProvider = await getTranslations("provider");

  const error = typeof sp.error === "string" ? sp.error : null;
  const uploaded = typeof sp.uploaded === "string" ? sp.uploaded : null;

  const [profile] = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, me.id))
    .limit(1);
  if (!profile) nextRedirect(`/${locale}/provider/register`);

  const rows = await db
    .select({
      type: providerDocuments.type,
      status: providerDocuments.status,
      fileUrl: providerDocuments.fileUrl,
      documentNumber: providerDocuments.documentNumber,
      expiresAt: providerDocuments.expiresAt,
      updatedAt: providerDocuments.updatedAt,
    })
    .from(providerDocuments)
    .where(eq(providerDocuments.providerId, profile.id));

  const byType = new Map(rows.map((r) => [r.type as DocType, r]));
  const now = new Date();
  const docs = KNOWN_TYPES.map((type) => {
    const r = byType.get(type);
    let state: "missing" | "valid" | "expiring" | "expired" = "missing";
    let days = 0;
    if (r) {
      if (r.expiresAt) {
        const ms = r.expiresAt.getTime() - now.getTime();
        days = Math.round(ms / 86400000);
        state = days < 0 ? "expired" : days < 30 ? "expiring" : "valid";
      } else {
        state = "valid";
      }
    }
    return { type, row: r, state, days };
  });

  const anyExpiring = docs.some(
    (d) => d.state === "expiring" || d.state === "expired" || d.state === "missing",
  );
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <>
      <Header
        country={country}
        back
        signedIn={true}
        initials={me.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-h2">{t("title")}</h1>
        <p className="mt-1 text-[15px] text-text-secondary">{t("sub")}</p>

        {anyExpiring && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-md border-[1.5px] border-warning bg-warning-soft px-3.5 py-3 text-[14px] font-semibold text-warning"
          >
            <AlertTriangle size={18} aria-hidden /> {t("expiringWarn")}
          </div>
        )}

        {uploaded && (
          <div
            role="status"
            className="mt-3 rounded-md bg-success-soft px-3.5 py-2.5 text-[14px] font-semibold text-success"
          >
            Document uploaded — pending admin review
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mt-3 rounded-md border-[1.5px] border-danger bg-danger-soft px-3.5 py-2.5 text-[14px] font-semibold text-danger"
          >
            {error === "tooLarge"
              ? "File is too large (max 10 MB)"
              : error === "badType"
                ? "Only JPG / PNG / WebP / HEIC / PDF are accepted"
                : error === "empty"
                  ? "Pick a file to upload"
                  : "Upload failed"}
          </div>
        )}

        <ul className="mt-5 flex flex-col gap-3">
          {docs.map((d) => {
            const Icon = d.state === "valid" ? CheckCircle2 : AlertTriangle;
            const cls =
              d.state === "valid"
                ? "bg-success-soft text-success"
                : d.state === "expiring"
                  ? "bg-warning-soft text-warning"
                  : d.state === "expired"
                    ? "bg-danger-soft text-danger"
                    : "bg-bg-surface-2 text-text-tertiary";
            const labelKey =
              d.type === "police_check"
                ? "docPolice"
                : d.type === "first_aid"
                  ? "docFirstAid"
                  : "docInsurance";
            return (
              <li
                key={d.type}
                className="rounded-lg border border-border bg-bg-base p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${cls}`}
                  >
                    <FileText size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold">
                      {tProvider(labelKey)}
                    </p>
                    {d.row?.expiresAt && (
                      <p className="mt-0.5 text-[13px] text-text-secondary tabular-nums">
                        {t("expiresOn", { when: fmt(d.row.expiresAt) })}
                      </p>
                    )}
                    {d.row?.documentNumber && (
                      <p className="mt-0.5 text-[12px] text-text-tertiary tabular-nums">
                        # {d.row.documentNumber}
                      </p>
                    )}
                    <p
                      className={
                        "mt-1 inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide " +
                        cls
                      }
                    >
                      <Icon size={12} aria-hidden />
                      {d.state === "missing"
                        ? "missing"
                        : t(
                            d.state === "valid"
                              ? "valid"
                              : d.state === "expiring"
                                ? "expiring"
                                : "expired",
                          )}
                    </p>
                    {d.row?.status === "pending" && (
                      <p className="mt-1 text-[12px] text-text-tertiary">
                        Awaiting admin review
                      </p>
                    )}
                  </div>
                  {d.row?.fileUrl && (
                    <a
                      href={d.row.fileUrl}
                      target="_blank"
                      rel="noopener"
                      className="text-[12px] font-semibold text-brand"
                    >
                      view
                    </a>
                  )}
                </div>

                <form
                  action={uploadDocAction}
                  encType="multipart/form-data"
                  className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="type" value={d.type} />
                  <div>
                    <Label htmlFor={`num-${d.type}`}>Doc number</Label>
                    <Input
                      id={`num-${d.type}`}
                      name="documentNumber"
                      defaultValue={d.row?.documentNumber ?? ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`exp-${d.type}`}>Expires</Label>
                    <Input
                      id={`exp-${d.type}`}
                      name="expiresAt"
                      type="date"
                      defaultValue={
                        d.row?.expiresAt
                          ? d.row.expiresAt.toISOString().slice(0, 10)
                          : ""
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:items-stretch">
                    <Label htmlFor={`file-${d.type}`}>
                      <span className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border-[1.5px] border-border-strong bg-bg-base px-3 text-[13px] font-semibold text-text-primary">
                        <Upload size={14} aria-hidden /> Choose file
                      </span>
                    </Label>
                    <input
                      id={`file-${d.type}`}
                      name="file"
                      type="file"
                      required
                      accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                      className="sr-only"
                    />
                    <Button type="submit" variant="primary" block size="sm">
                      {t("reupload")}
                    </Button>
                  </div>
                </form>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 rounded-md border border-border bg-bg-surface-2 px-3.5 py-3 text-[13px] text-text-tertiary">
          Files saved to local storage for now. We&apos;ll migrate to managed
          object storage (S3 / Supabase) before public launch — your existing
          uploads will be moved automatically. Max 10&nbsp;MB · JPG / PNG /
          WebP / HEIC / PDF.
        </p>
      </main>
    </>
  );
}
