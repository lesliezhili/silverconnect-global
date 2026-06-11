"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

// Rate caps (must be below government scheme rates for platform sustainability)
const RATE_CAPS: Record<string, number> = {
  ndis: 67.56, tac: 65.00, worksafe: 62.00, dva: 60.00,
  my_aged_care: 55.00, hcp: 58.00, aged_pension: 55.00, super: 67.56,
};

const SCHEMES = [
  { id: "tac", label: "TAC (Transport Accident Commission)", placeholder: "TAC-2026-123456" },
  { id: "worksafe", label: "WorkSafe Victoria", placeholder: "WS-2026-123456" },
  { id: "ndis", label: "NDIS", placeholder: "4XX XXX XXXX" },
  { id: "my_aged_care", label: "My Aged Care", placeholder: "Client ID" },
  { id: "dva", label: "DVA (Veterans Affairs)", placeholder: "File number" },
  { id: "hcp", label: "Home Care Package", placeholder: "Client reference" },
  { id: "aged_pension", label: "Aged Pension / CHSP (Centrelink)", placeholder: "CRN e.g. 123 456 789A" },
  { id: "super", label: "Superannuation Fund (Self-funded retiree)", placeholder: "Member number" },
] as const;

export function FundingSetupForm({
  locale,
  existingClaims,
}: {
  locale: string;
  existingClaims: any[];
}) {
  const t = useTranslations("funding");
  const zh = locale === "zh";
  const [scheme, setScheme] = React.useState("");
  const [claimNumber, setClaimNumber] = React.useState("");
  const [approvalDate, setApprovalDate] = React.useState("");
  const [serviceScope, setServiceScope] = React.useState("");
  const [fundingAmount, setFundingAmount] = React.useState("");
  const [serviceDuration, setServiceDuration] = React.useState("");
  const [hourlyRate, setHourlyRate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

  // NDIS-specific
  const [participantNumber, setParticipantNumber] = React.useState("");
  const [planNumber, setPlanNumber] = React.useState("");

  const selectedScheme = SCHEMES.find((s) => s.id === scheme);
  const isNdis = scheme === "ndis";
  const isHcp = scheme === "hcp";

    // Rate cap helpers
  const getMaxRate = (s: string): number => {
    return RATE_CAPS[s] || 999;
  };

  const getRecommended = (): string => {
    return "52";
  };

  // Handle auto-extracted data from PDF
  const handleDocumentExtracted = (data: any) => {
    if (data.claimNumber) setClaimNumber(data.claimNumber);
    if (data.approvalDate) setApprovalDate(data.approvalDate);
    if (data.serviceScope) setServiceScope(data.serviceScope);
    if (data.fundingAmount) setFundingAmount(String(data.fundingAmount));
    if (data.serviceDuration) setServiceDuration(data.serviceDuration);
    if (data.hourlyRate) setHourlyRate(String(data.hourlyRate));
    if (data.scheme && !scheme) setScheme(data.scheme);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Validate rate against government cap
    if (hourlyRate && scheme) {
      const cap = getMaxRate(scheme);
      if (parseFloat(hourlyRate) > cap) {
        setError(zh
          ? `费率 $${hourlyRate}/hr 超过${scheme.toUpperCase()}上限 $${cap}/hr。请降低费率。`
          : `Rate $${hourlyRate}/hr exceeds ${scheme.toUpperCase()} cap of $${cap}/hr. Platform rates must be below government rates.`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/bookings/funding-scheme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: "profile-setup",
          scheme,
          claimNumber,
          participantNumber: isNdis ? participantNumber : undefined,
          planNumber: (isNdis || isHcp) ? planNumber : undefined,
          approvalLetterUrl: "pending-upload",
          approvalDate: approvalDate || undefined,
          serviceScope: serviceScope || undefined,
          fundingAmount: fundingAmount ? parseFloat(fundingAmount) : undefined,
          serviceDuration: serviceDuration || undefined,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setScheme(""); setClaimNumber(""); setApprovalDate("");
        setServiceScope(""); setFundingAmount(""); setServiceDuration("");
        setHourlyRate(""); setNotes(""); setParticipantNumber(""); setPlanNumber("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="mt-8 rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
        <p className="text-[24px]">✅</p>
        <p className="mt-2 text-[22px] font-bold text-green-800">
          {zh ? "提交成功" : "Submitted Successfully"}
        </p>
        <p className="mt-2 text-[18px] text-green-700">
          {zh ? "我们会在1-2个工作日内审核" : "We’ll verify within 1-2 business days"}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-5 rounded-xl bg-green-600 px-8 py-4 text-[20px] font-bold text-white"
        >
          {zh ? "添加另一个" : "Add Another Scheme"}
        </button>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-[22px] font-bold text-gray-900">
        {zh ? "添加政府资助" : "Add Government Funding"}
      </h2>
      <p className="mt-1 text-[18px] text-gray-500">
        {zh
          ? "上传您的批准信，我们会自动提取索赔信息"
          : "Upload your approval letter and we’ll auto-extract claim details"}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-5">
        {/* Step 1: Upload document FIRST (smart extraction) */}
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
          <p className="mb-3 text-[18px] font-semibold text-blue-800">
            ✨ {zh ? "第1步：上传批准信" : "Step 1: Upload your approval letter"}
          </p>
          <div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-[18px]"
            />
            <p className="mt-2 text-[16px] text-gray-500">
              {zh ? "PDF, JPG 或 PNG" : "PDF, JPG or PNG — max 10MB"}
            </p>
          </div>
        </div>

        {/* Step 2: Scheme Selection (may be auto-detected) */}
        <div>
          <label className="block text-[18px] font-semibold text-gray-700 mb-2">
            {zh ? "资助类型" : "Funding Scheme"} *
          </label>
          <select
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
            required
            className="w-full rounded-xl border-2 border-gray-300 bg-white p-4 text-[20px] text-gray-900"
          >
            <option value="">{zh ? "请选择..." : "Select scheme..."}</option>
            {SCHEMES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Step 3: Claim details (may be auto-filled) */}
        {scheme && (
          <>
            <div>
              <label className="block text-[18px] font-semibold text-gray-700 mb-2">
                {zh ? "索赔号" : "Claim / Client Number"} *
              </label>
              <input
                type="text"
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                required
                placeholder={selectedScheme?.placeholder}
                className="w-full rounded-xl border-2 border-gray-300 p-4 text-[20px] text-gray-900 placeholder:text-gray-400"
              />
              {claimNumber && (
                <p className="mt-1 text-[16px] text-green-600">
                  {zh ? "✅ 已填写" : "✅ Filled"}
                </p>
              )}
            </div>

            {/* NDIS specific */}
            {isNdis && (
              <>
                <div>
                  <label className="block text-[18px] font-semibold text-gray-700 mb-2">
                    NDIS Participant Number
                  </label>
                  <input type="text" value={participantNumber}
                    onChange={(e) => setParticipantNumber(e.target.value)}
                    placeholder="Participant reference"
                    className="w-full rounded-xl border-2 border-gray-300 p-4 text-[20px]" />
                </div>
                <div>
                  <label className="block text-[18px] font-semibold text-gray-700 mb-2">Plan Number</label>
                  <input type="text" value={planNumber}
                    onChange={(e) => setPlanNumber(e.target.value)}
                    placeholder="Plan number"
                    className="w-full rounded-xl border-2 border-gray-300 p-4 text-[20px]" />
                </div>
              </>
            )}

            {/* Approval Date */}
            <div>
              <label className="block text-[18px] font-semibold text-gray-700 mb-2">
                {zh ? "批准日期" : "Approval Date"}
              </label>
              <input type="date" value={approvalDate}
                onChange={(e) => setApprovalDate(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-300 p-4 text-[20px]" />
            </div>

            {/* Service Scope */}
            <div>
              <label className="block text-[18px] font-semibold text-gray-700 mb-2">
                {zh ? "服务范围" : "Approved Services / Scope"}
              </label>
              <textarea value={serviceScope}
                onChange={(e) => setServiceScope(e.target.value)}
                placeholder={zh ? "例：清洁、个人护理" : "e.g. Cleaning, Personal Care, Transport"}
                rows={2}
                className="w-full rounded-xl border-2 border-gray-300 p-4 text-[20px] resize-none" />
            </div>

            {/* Service Duration & Hourly Rate — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[18px] font-semibold text-gray-700 mb-2">
                  {zh ? "服务时长" : "Duration"}
                </label>
                <input type="text" value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  placeholder={zh ? "例：4小时/周" : "e.g. 4 hrs/week"}
                  className="w-full rounded-xl border-2 border-gray-300 p-4 text-[20px]" />
              </div>
              <div>
                <label className="block text-[18px] font-semibold text-gray-700 mb-2">
                  {zh ? "时薪" : "Rate $/hr"}
                </label>
                <input type="number" value={hourlyRate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHourlyRate(val);
                  }}
                  placeholder={scheme ? `Max $${getMaxRate(scheme as any)}/hr` : "$65"}
                  step="0.01"
                  max={scheme ? getMaxRate(scheme as any) : undefined}
                  className={`w-full rounded-xl border-2 p-4 text-[20px] ${
                    hourlyRate && scheme && parseFloat(hourlyRate) > getMaxRate(scheme as any)
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  }`} />
                {/* Rate cap warning */}
                {scheme && (
                  <div className="mt-2">
                    {hourlyRate && parseFloat(hourlyRate) > getMaxRate(scheme as any) ? (
                      <p className="text-[16px] text-red-600 font-semibold">
                        ⚠️ {zh
                          ? `费率不能超过${scheme.toUpperCase()}上限 $${getMaxRate(scheme as any)}/hr`
                          : `Must be below ${scheme.toUpperCase()} cap: $${getMaxRate(scheme as any)}/hr`}
                      </p>
                    ) : (
                      <p className="text-[16px] text-gray-500">
                        {zh
                          ? `${scheme.toUpperCase()}上限: $${getMaxRate(scheme as any)}/hr · 建议: ≤$${getRecommended()}/hr`
                          : `${scheme.toUpperCase()} cap: $${getMaxRate(scheme as any)}/hr · Recommended: ≤$${getRecommended()}/hr`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Total Funding Amount */}
            <div>
              <label className="block text-[18px] font-semibold text-gray-700 mb-2">
                {zh ? "资助总额" : "Total Funded Amount"}
              </label>
              <input type="number" value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
                placeholder="$"
                step="0.01"
                className="w-full rounded-xl border-2 border-gray-300 p-4 text-[20px]" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[18px] font-semibold text-gray-700 mb-2">
                {zh ? "备注" : "Notes"}
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={2} className="w-full rounded-xl border-2 border-gray-300 p-4 text-[20px] resize-none" />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 border border-red-200 p-4 text-[18px] text-red-700">{error}</p>
            )}

            <button type="submit" disabled={submitting || !claimNumber}
              className="w-full rounded-2xl bg-blue-600 py-5 text-[22px] font-bold text-white disabled:opacity-50"
              style={{ minHeight: "64px" }}>
              {submitting ? (zh ? "提交中..." : "Submitting...") : (zh ? "提交" : "Submit Funding Claim")}
            </button>
          </>
        )}
      </form>
    </section>
  );
}
