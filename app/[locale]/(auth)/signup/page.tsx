"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    country: "AU",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        // NO role field — everyone starts as customer
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      router.push(`/${locale}/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-amber-50">
      <div className="w-full max-w-md space-y-8">
        {/* Progress dots — elder-friendly */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-4 h-4 rounded-full transition-colors ${
                s <= step ? "bg-amber-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Name — "What should we call you?" */}
        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-[26px] font-semibold text-gray-900 text-center">
              What should we call you?
            </h1>
            <p className="text-[18px] text-gray-500 text-center">
              Your name helps helpers know who they are visiting.
            </p>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              className="w-full h-[56px] text-[20px] px-4 border-2 border-gray-300 rounded-xl
                         focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              autoFocus
            />
            <button
              onClick={() => form.name.trim() && setStep(2)}
              disabled={!form.name.trim()}
              className="w-full h-[56px] text-[20px] font-medium bg-amber-600 text-white
                         rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Email & Password */}
        {step === 2 && (
          <div className="space-y-6">
            <h1 className="text-[26px] font-semibold text-gray-900 text-center">
              Create your account
            </h1>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Your email address"
              className="w-full h-[56px] text-[20px] px-4 border-2 border-gray-300 rounded-xl
                         focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              autoFocus
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Choose a password (8+ characters)"
              className="w-full h-[56px] text-[20px] px-4 border-2 border-gray-300 rounded-xl
                         focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="h-[56px] px-6 text-[20px] border-2 border-gray-300 rounded-xl
                           hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => form.email && form.password.length >= 8 && setStep(3)}
                disabled={!form.email || form.password.length < 8}
                className="flex-1 h-[56px] text-[20px] font-medium bg-amber-600 text-white
                           rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Country */}
        {step === 3 && (
          <div className="space-y-6">
            <h1 className="text-[26px] font-semibold text-gray-900 text-center">
              Where are you located?
            </h1>
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full h-[56px] text-[20px] px-4 border-2 border-gray-300 rounded-xl
                         focus:border-amber-500 outline-none"
            >
              <option value="AU">Australia</option>
            </select>

            {error && (
              <p className="text-red-600 text-[18px] text-center bg-red-50 p-3 rounded-xl">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="h-[56px] px-6 text-[20px] border-2 border-gray-300 rounded-xl
                           hover:bg-gray-50 transition-colors"
              >
                Back
              </button>

              {/* 信仰选项 */}
              <label className="flex items-center gap-3 text-[15px] text-gray-600 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-amber-500"
                  onChange={(e) => {
                    fetch('/api/user/faith', {
                      method: e.target.checked ? 'POST' : 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: e.target.checked ? JSON.stringify({ faith: 'christian' }) : undefined,
                    })
                  }}
                />
                ✝️ 我是基督徒，希望查看基督徒社区服务
              </label>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-[56px] text-[20px] font-medium bg-amber-600 text-white
                           rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Creating account..." : "Join SilverConnect"}
              </button>
            </div>

            <p className="text-[16px] text-gray-400 text-center">
              Want to help others? You can become a helper anytime from your profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
