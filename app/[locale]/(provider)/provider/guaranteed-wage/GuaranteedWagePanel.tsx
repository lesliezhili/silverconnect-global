"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, Clock, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

type Cycle = {
  id: string;
  cycleStart: string;
  cycleEnd: string;
  actualEarnings: string;
  guaranteedAmount: string;
  topupAmount: string;
};

type Eligibility = {
  eligible: boolean;
  completedBookings: number;
  avgRating: number;
  tenureDays: number;
  requirements: {
    minCompletedBookings: number;
    minAvgRating: number;
    minTenureDays: number;
  };
} | null;

/** Suggested guaranteed cycle amount = committed hours/week × a floor rate (weekly cycle). */
const SUGGESTED_HOURLY_FLOOR = 32;

export function GuaranteedWagePanel({
  status,
  committedHours,
  guaranteedAmount,
  eligibility,
  cycles,
}: {
  status: string | null;
  committedHours: number | null;
  guaranteedAmount: string | null;
  eligibility: Eligibility;
  cycles: Cycle[];
}) {
  const t = useTranslations("guaranteedWage");
  const [hours, setHours] = React.useState(committedHours ?? 15);
  const [amount, setAmount] = React.useState(
    guaranteedAmount ?? String(Math.round((committedHours ?? 15) * SUGGESTED_HOURLY_FLOOR)),
  );
  const [currentStatus, setCurrentStatus] = React.useState(status);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  function suggestAmount(nextHours: number) {
    setHours(nextHours);
    setAmount(String(Math.round(nextHours * SUGGESTED_HOURLY_FLOOR)));
  }

  async function enroll() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/provider/guaranteed-wage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ committedHours: hours, guaranteedAmount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("enrollFailed"));
        return;
      }
      setCurrentStatus("pending");
    } catch {
      setError(t("enrollFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/provider/guaranteed-wage", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("cancelFailed"));
        return;
      }
      setCurrentStatus(null);
    } catch {
      setError(t("cancelFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const statusLabels: Record<string, string> = {
    pending: t("statusPending"),
    approved: t("statusApproved"),
    rejected: t("statusRejected"),
    suspended: t("statusSuspended"),
  };
  const statusColors: Record<string, string> = {
    pending: "bg-warning-soft text-warning",
    approved: "bg-success-soft text-success",
    rejected: "bg-danger-soft text-danger",
    suspended: "bg-danger-soft text-danger",
  };

  return (
    <>
      {error && (
        <p className="mt-3 rounded-md bg-danger-soft px-4 py-3 text-[15px] text-danger">
          {error}
        </p>
      )}

      {currentStatus ? (
        <section className="mt-6 rounded-lg border border-border bg-bg-base p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand" aria-hidden />
            <span
              className={`inline-flex h-7 items-center rounded-pill px-3 text-[14px] font-bold ${statusColors[currentStatus] ?? ""}`}
            >
              {statusLabels[currentStatus] ?? currentStatus}
            </span>
          </div>
          <p className="mt-3 text-[16px] text-text-secondary">
            {t("committedHours", { hours: committedHours ?? hours })}
          </p>
          <p className="mt-1 text-h2 font-extrabold text-brand">
            ${guaranteedAmount ?? amount} <span className="text-[15px] font-semibold text-text-tertiary">{t("perCycle")}</span>
          </p>
          {currentStatus !== "rejected" && (
            <Button
              type="button"
              variant="secondary"
              block
              disabled={submitting}
              onClick={cancel}
              className="mt-4"
            >
              {t("cancelEnrollment")}
            </Button>
          )}
        </section>
      ) : eligibility && !eligibility.eligible ? (
        <section className="mt-6 rounded-lg border border-border bg-bg-base p-5">
          <p className="text-[16px] font-bold text-text-primary">{t("trialTitle")}</p>
          <p className="mt-1 text-[15px] text-text-secondary">{t("trialBody")}</p>

          <ul className="mt-4 flex flex-col gap-3">
            <TrialMilestone
              done={eligibility.completedBookings >= eligibility.requirements.minCompletedBookings}
              label={t("trialBookings", {
                count: eligibility.completedBookings,
                min: eligibility.requirements.minCompletedBookings,
              })}
            />
            <TrialMilestone
              done={eligibility.avgRating >= eligibility.requirements.minAvgRating}
              label={t("trialRating", {
                rating: eligibility.avgRating.toFixed(1),
                min: eligibility.requirements.minAvgRating.toFixed(1),
              })}
            />
            <TrialMilestone
              done={eligibility.tenureDays >= eligibility.requirements.minTenureDays}
              label={t("trialTenure", {
                count: eligibility.tenureDays,
                min: eligibility.requirements.minTenureDays,
              })}
            />
          </ul>
        </section>
      ) : (
        <section className="mt-6 rounded-lg border border-border bg-bg-base p-5">
          <p className="text-[16px] font-bold text-text-primary">{t("enrollTitle")}</p>
          <p className="mt-1 text-[15px] text-text-secondary">{t("enrollBody")}</p>

          <div className="mt-4">
            <Label htmlFor="committedHours">{t("committedHoursLabel")}</Label>
            <input
              id="committedHours"
              type="number"
              min={1}
              max={80}
              value={hours}
              onChange={(e) => suggestAmount(Number(e.target.value) || 1)}
              className="block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body focus:border-brand focus:outline-none"
            />
          </div>

          <div className="mt-4">
            <Label htmlFor="guaranteedAmount">{t("guaranteedAmountLabel")}</Label>
            <input
              id="guaranteedAmount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body focus:border-brand focus:outline-none"
            />
            <p className="mt-1.5 text-[15px] text-text-tertiary">{t("guaranteedAmountHint")}</p>
          </div>

          <Button
            type="button"
            variant="primary"
            block
            disabled={submitting}
            onClick={enroll}
            className="mt-5"
          >
            {submitting ? t("enrolling") : t("enrollCta")}
          </Button>
        </section>
      )}

      <section className="mt-6">
        <p className="text-[16px] font-bold text-text-primary">{t("history")}</p>
        {cycles.length === 0 ? (
          <div className="mt-2 flex items-center gap-2 text-[15px] text-text-tertiary">
            <Clock size={16} aria-hidden />
            {t("noHistory")}
          </div>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {cycles.map((c) => {
              const topup = Number(c.topupAmount);
              return (
                <li key={c.id} className="rounded-md border border-border bg-bg-base px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] text-text-secondary">
                      {c.cycleStart} – {c.cycleEnd}
                    </span>
                    <span className="text-[16px] font-bold text-text-primary">
                      ${(Number(c.actualEarnings) + topup).toFixed(2)}
                    </span>
                  </div>
                  {topup > 0 && (
                    <p className="mt-1 text-[14px] font-semibold text-success">
                      {t("toppedUp", { amount: topup.toFixed(2) })}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function TrialMilestone({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      {done ? (
        <CheckCircle2 size={20} className="shrink-0 text-success" aria-hidden />
      ) : (
        <Circle size={20} className="shrink-0 text-text-tertiary" aria-hidden />
      )}
      <span className={`text-[16px] ${done ? "text-text-primary" : "text-text-secondary"}`}>
        {label}
      </span>
    </li>
  );
}
