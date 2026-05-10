import { setRequestLocale, getTranslations } from "next-intl/server";
import { Check, Loader2, Clock, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

type StepState = "done" | "inProgress" | "waiting" | "action";

interface Step {
  key:
    | "obSubmitted"
    | "obDocs"
    | "obBackground"
    | "obStripe"
    | "obLive";
  state: StepState;
  whenISO?: string;
}

const STEPS: Step[] = [
  { key: "obSubmitted", state: "done", whenISO: new Date(Date.now() - 86400000 * 2).toISOString() },
  { key: "obDocs", state: "inProgress", whenISO: new Date(Date.now() - 86400000).toISOString() },
  { key: "obBackground", state: "waiting" },
  { key: "obStripe", state: "waiting" },
  { key: "obLive", state: "waiting" },
];

export default async function OnboardingStatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  const country = await getCountry();
  const t = await getTranslations("provider");

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
        className="mx-auto w-full max-w-content px-5 pb-12 pt-6"
      >
        <h1 className="text-h2">{t("onboardingTitle")}</h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          {t("onboardingSub")}
        </p>

        <ol className="mt-6 flex flex-col">
          {STEPS.map((s, i) => (
            <StepRow
              key={s.key}
              step={s}
              last={i === STEPS.length - 1}
              label={t(s.key)}
              stateLabel={t(
                s.state === "done"
                  ? "obDone"
                  : s.state === "inProgress"
                  ? "obInProgress"
                  : s.state === "waiting"
                  ? "obWaiting"
                  : "obAction"
              )}
              when={
                s.whenISO
                  ? new Date(s.whenISO).toLocaleDateString(
                      locale === "en" ? "en-AU" : locale,
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )
                  : undefined
              }
            />
          ))}
        </ol>

        <div className="mt-8 rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[14px] text-text-secondary">
            {t("rBioHint")}
          </p>
          <Link
            href="/provider/register?step=2"
            className="mt-3 inline-flex h-12 items-center rounded-md border-[1.5px] border-brand bg-bg-base px-5 text-[15px] font-bold text-brand"
          >
            {t("docUpload")}
          </Link>
        </div>
      </main>
    </>
  );
}

function StepRow({
  step,
  last,
  label,
  stateLabel,
  when,
}: {
  step: Step;
  last: boolean;
  label: string;
  stateLabel: string;
  when?: string;
}) {
  const Icon =
    step.state === "done"
      ? Check
      : step.state === "inProgress"
      ? Loader2
      : step.state === "action"
      ? AlertCircle
      : Clock;
  const colorClass =
    step.state === "done"
      ? "bg-success-soft text-success"
      : step.state === "inProgress"
      ? "bg-brand-soft text-brand"
      : step.state === "action"
      ? "bg-warning-soft text-warning"
      : "bg-bg-surface-2 text-text-tertiary";
  return (
    <li className="grid grid-cols-[40px_1fr] gap-3">
      <div className="flex flex-col items-center">
        <span
          aria-hidden
          className={
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full " +
            colorClass
          }
        >
          <Icon size={20} className={step.state === "inProgress" ? "animate-spin" : undefined} />
        </span>
        {!last && <span aria-hidden className="my-1 w-px flex-1 bg-border" />}
      </div>
      <div className={"pb-6 " + (last ? "" : "border-b border-transparent")}>
        <p className="text-[16px] font-bold text-text-primary">{label}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-text-secondary">
          {stateLabel}
          {when && <span className="ml-2 font-normal text-text-tertiary">· {when}</span>}
        </p>
      </div>
    </li>
  );
}
