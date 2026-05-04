import { setRequestLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, AlertTriangle, ShieldAlert, Camera } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link, redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

const SEV_KEYS = ["sevLow", "sevMid", "sevHigh"] as const;

export default async function SafetyReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session.signedIn) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("safetyReport");
  const sent = sp.sent === "1";

  if (sent) {
    return (
      <>
        <Header
          country={country}
          back
          signedIn={session.signedIn}
          initials={session.initials}
        />
        <main
          id="main-content"
          className="mx-auto flex w-full max-w-content flex-col items-center gap-3 px-5 pb-[120px] pt-12 text-center sm:pb-12"
        >
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={56} aria-hidden />
          </span>
          <h1 className="text-h1">{t("successTitle")}</h1>
          <p className="max-w-[340px] text-[16px] text-text-secondary">
            {t("successHint")}
          </p>
          <Link
            href="/home"
            className="mt-2 inline-flex h-14 items-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
          >
            {locale === "zh" ? "返回首页" : "Back to home"}
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        country={country}
        back
        signedIn={session.signedIn}
        initials={session.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="flex items-center gap-2 text-h2">
          <ShieldAlert size={26} className="text-danger" aria-hidden />
          {t("title")}
        </h1>
        <p className="mt-1 text-[15px] text-text-secondary">{t("sub")}</p>

        {/* Divert to SOS for high severity */}
        <div className="mt-4 flex items-start gap-2.5 rounded-md border-[1.5px] border-danger bg-danger-soft p-3.5">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger" aria-hidden />
          <div className="text-danger">
            <p className="text-[15px] font-bold">{t("sevHighDivertTitle")}</p>
            <p className="mt-0.5 text-[14px]">{t("sevHighDivertHint")}</p>
            <Link
              href="/chat?emergency=1"
              className="mt-2 inline-flex h-12 items-center rounded-md bg-danger px-5 text-[15px] font-bold text-white"
            >
              {t("openSos")}
            </Link>
          </div>
        </div>

        <form
          action="/api/safety/report?sent=1"
          method="get"
          className="mt-6 flex flex-col gap-6"
        >
          <fieldset>
            <legend className="text-[16px] font-bold">{t("severity")}</legend>
            <ul className="mt-3 flex flex-col gap-2.5" role="radiogroup" aria-required="true">
              {SEV_KEYS.map((k) => (
                <li key={k}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border-[1.5px] border-border bg-bg-base p-4 has-[:checked]:border-2 has-[:checked]:border-brand">
                    <input
                      type="radio"
                      name="severity"
                      value={k.replace(/^sev/, "").toLowerCase()}
                      required
                      className="peer sr-only"
                    />
                    <span
                      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border-strong after:hidden after:h-3 after:w-3 after:rounded-full after:bg-brand after:content-[''] peer-checked:border-brand peer-checked:after:block"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold">{t(k)}</p>
                      <p className="mt-0.5 text-[13px] text-text-secondary">
                        {t(`${k}Hint` as Parameters<typeof t>[0])}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <div>
            <Label htmlFor="when">{t("when")}</Label>
            <input
              id="when"
              name="when"
              type="datetime-local"
              required
              className="block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body text-text-primary focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <Label htmlFor="describe">{t("describe")}</Label>
            <textarea
              id="describe"
              name="describe"
              required
              minLength={30}
              rows={5}
              aria-describedby="describe-hint"
              className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3.5 text-[16px] text-text-primary placeholder:text-text-placeholder focus:border-brand focus:outline-none"
            />
            <p id="describe-hint" className="mt-1.5 text-[13px] text-text-tertiary">
              {t("describeHint")}
            </p>
          </div>

          <div>
            <Label htmlFor="evidence">{t("evidence")}</Label>
            <input
              id="evidence"
              name="evidence"
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              className="block w-full text-[14px] text-text-secondary file:mr-3 file:inline-flex file:h-12 file:items-center file:rounded-md file:border-[1.5px] file:border-border-strong file:bg-bg-base file:px-4 file:text-[14px] file:font-semibold file:text-text-primary"
            />
            <p className="mt-1.5 flex items-center gap-1 text-[13px] text-text-tertiary">
              <Camera size={14} aria-hidden /> {locale === "zh" ? "照片、视频或录音。" : "Photos, video or audio."}
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-md border-[1.5px] border-border bg-bg-base p-4 has-[:checked]:border-brand">
            <input
              type="checkbox"
              name="policeContacted"
              className="peer sr-only"
            />
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-border-strong peer-checked:border-brand peer-checked:bg-brand peer-checked:after:block after:hidden after:text-white after:content-['✓']"
              aria-hidden
            />
            <span className="text-[15px]">{t("policeContacted")}</span>
          </label>

          <Button type="submit" variant="primary" block size="md">
            {t("submit")}
          </Button>
        </form>
      </main>
    </>
  );
}
