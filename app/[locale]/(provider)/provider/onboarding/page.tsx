"use client";
import { useState, useEffect } from "react";

interface Requirement { id: string; label: string; required: boolean; submitted?: boolean; }

export default function ProviderOnboardingPage() {
  const [country, setCountry] = useState<"AU" | "NZ">("AU");
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [bankFormat, setBankFormat] = useState<{ fields: string[]; example: string }>({ fields: [], example: "" });
  const [taxReg, setTaxReg] = useState<{ label: string; format: string }>({ label: "ABN", format: "" });
  const [training, setTraining] = useState<string[]>([]);
  const [bank, setBank] = useState<Record<string, string>>({});
  const [taxNumber, setTaxNumber] = useState("");
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/provider/onboarding?country=" + country).then(r => r.json()).then(d => {
      if (d.requirements) setRequirements(d.requirements);
      if (d.bankFormat) setBankFormat(d.bankFormat);
      if (d.taxRegistration) setTaxReg(d.taxRegistration);
      if (d.training) setTraining(d.training);
    });
  }, [country]);

  const toggleDoc = (id: string) => { const s = new Set(checkedDocs); s.has(id) ? s.delete(id) : s.add(id); setCheckedDocs(s); };
  const requiredCount = requirements.filter(r => r.required).length;
  const completedRequired = requirements.filter(r => r.required && checkedDocs.has(r.id)).length;
  const progress = requiredCount > 0 ? Math.round((completedRequired / requiredCount) * 100) : 0;

  const submit = async () => {
    setSubmitting(true); setSuccess("");
    const docs = Array.from(checkedDocs).map(id => ({ type: id, url: "pending-upload" }));
    const res = await fetch("/api/provider/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ providerId: "d73656c1-bde8-47cf-a86b-924453f88072", country, documents: docs, bankDetails: bank, taxNumber }) });
    const data = await res.json();
    if (data.success) setSuccess("Onboarding submitted! We\u2019ll review your documents within 24-48 hours.");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Provider Onboarding</h1>
        <p className="text-sm text-gray-500 mt-1">Complete your registration to start accepting jobs</p>
      </div>

      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 text-sm text-emerald-700 font-medium">\u2705 {success}</div>}

      {/* Country Toggle */}
      <div className="bg-white rounded-xl border p-4 mb-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Where will you provide services?</p>
        <div className="flex gap-2">
          <button onClick={() => setCountry("AU")} className={"flex-1 py-3 rounded-lg border-2 text-sm font-semibold flex items-center justify-center gap-2 transition " + (country === "AU" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600")}>
            \ud83c\udde6\ud83c\uddfa Australia
          </button>
          <button onClick={() => setCountry("NZ")} className={"flex-1 py-3 rounded-lg border-2 text-sm font-semibold flex items-center justify-center gap-2 transition " + (country === "NZ" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600")}>
            \ud83c\uddf3\ud83c\uddff New Zealand
          </button>
        </div>
        {country === "NZ" && <p className="text-xs text-blue-600 mt-2">\u2139\ufe0f NZ providers need Police Vetting, IRD number, and ACC registration</p>}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Completion</span>
          <span className="text-sm font-bold text-emerald-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: progress + "%" }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">{completedRequired}/{requiredCount} required documents</p>
      </div>

      {/* Document Checklist */}
      <div className="bg-white rounded-xl border p-4 mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Required Documents</h2>
        <div className="space-y-3">
          {requirements.map(req => (
            <label key={req.id} className={"flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition " + (checkedDocs.has(req.id) ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-200 hover:border-gray-300")}>
              <input type="checkbox" checked={checkedDocs.has(req.id)} onChange={() => toggleDoc(req.id)} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{req.label}</p>
                {req.required && <span className="text-xs text-red-500">Required</span>}
                {!req.required && <span className="text-xs text-gray-400">Optional</span>}
              </div>
              {checkedDocs.has(req.id) && <span className="text-emerald-500">\u2713</span>}
            </label>
          ))}
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white rounded-xl border p-4 mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Bank Account</h2>
        <p className="text-xs text-gray-500 mb-3">For receiving payments. Format: {bankFormat.example}</p>
        <div className={"grid gap-3 " + (country === "NZ" ? "grid-cols-4" : "grid-cols-2")}>
          {country === "NZ" ? (
            <>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Bank (2)</label>
                <input type="text" maxLength={2} placeholder="06" value={bank.bank_code || ""} onChange={e => setBank({...bank, bank_code: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Branch (4)</label>
                <input type="text" maxLength={4} placeholder="0101" value={bank.branch_code || ""} onChange={e => setBank({...bank, branch_code: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Account (7)</label>
                <input type="text" maxLength={7} placeholder="0012345" value={bank.account_number || ""} onChange={e => setBank({...bank, account_number: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Suffix</label>
                <input type="text" maxLength={3} placeholder="00" value={bank.suffix || ""} onChange={e => setBank({...bank, suffix: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-600 block mb-1">BSB</label>
                <input type="text" maxLength={7} placeholder="000-000" value={bank.bsb || ""} onChange={e => setBank({...bank, bsb: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Account Number</label>
                <input type="text" maxLength={9} placeholder="12345678" value={bank.account_number || ""} onChange={e => setBank({...bank, account_number: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </>
          )}
        </div>
        <div className="mt-3">
          <label className="text-xs text-gray-600 block mb-1">Account Name</label>
          <input type="text" placeholder="Your full name" value={bank.account_name || ""} onChange={e => setBank({...bank, account_name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Tax Registration */}
      <div className="bg-white rounded-xl border p-4 mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{taxReg.label}</h2>
        <p className="text-xs text-gray-500 mb-3">Format: {taxReg.format}</p>
        <input type="text" placeholder={country === "NZ" ? "12-345-678" : "51 824 753 556"} value={taxNumber} onChange={e => setTaxNumber(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>

      {/* Training Modules */}
      <div className="bg-white rounded-xl border p-4 mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Required Training</h2>
        <div className="space-y-2">
          {training.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-blue-500">\ud83d\udcd6</span> {t}
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button onClick={submit} disabled={submitting || completedRequired < requiredCount} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl text-base font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed">
        {submitting ? "Submitting..." : completedRequired < requiredCount ? `Complete ${requiredCount - completedRequired} more required items` : "Submit for Review"}
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">Typically reviewed within 24-48 hours</p>
    </div>
  );
}
