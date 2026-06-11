"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const { locale } = useParams();
  const [role, setRole] = useState<"customer"|"provider"|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState(""); const [lat, setLat] = useState(""); const [lng, setLng] = useState("");
  const [ecName, setEcName] = useState(""); const [ecPhone, setEcPhone] = useState(""); const [ecRelation, setEcRelation] = useState("");
  const [abn, setAbn] = useState(""); const [baseRate, setBaseRate] = useState("45"); const [postcodes, setPostcodes] = useState(""); const [tier, setTier] = useState("basic");
  const isZh = locale === "zh";

  async function submitCustomer() {
    setLoading(true);
    const res = await fetch("/api/customers/onboard", { method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ address, coordinates: {lat:parseFloat(lat),lng:parseFloat(lng)}, emergencyContact: {name:ecName,phone:ecPhone,relationship:ecRelation}, country:"AU" })});
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push(`/${locale}/dashboard`);
  }
  async function submitProvider() {
    setLoading(true);
    const res = await fetch("/api/providers/onboard", { method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ serviceTypes:["home_help"], baseRate:parseFloat(baseRate), servicePostcodes:postcodes.split(",").map(s=>s.trim()), abn:abn||undefined, country:"AU", serviceTier:tier })});
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push(`/${locale}/dashboard`);
  }

  if (!role) return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-teal-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-teal-700 mb-6">{isZh?"欢迎！你是谁？":"Welcome! Who are you?"}</h1>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={()=>setRole("customer")} className="p-6 border-2 border-teal-200 rounded-xl hover:border-teal-500 hover:bg-teal-50">
            <div className="text-4xl mb-2">👴</div><div className="font-semibold">{isZh?"我需要帮助":"I Need Care"}</div></button>
          <button onClick={()=>setRole("provider")} className="p-6 border-2 border-amber-200 rounded-xl hover:border-amber-500 hover:bg-amber-50">
            <div className="text-4xl mb-2">🩺</div><div className="font-semibold">{isZh?"我提供服务":"I Provide Care"}</div></button>
        </div>
      </div>
    </main>);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-teal-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-teal-700 mb-4">{role==="customer"?(isZh?"客户注册":"Customer Setup"):(isZh?"服务者注册":"Provider Setup")}</h1>
        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded mb-4">{error}</p>}
        {role==="customer" ? (
          <div className="space-y-3">
            <input placeholder={isZh?"家庭地址":"Home Address"} value={address} onChange={e=>setAddress(e.target.value)} className="w-full px-4 py-3 border rounded-lg"/>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Latitude" type="number" step="any" value={lat} onChange={e=>setLat(e.target.value)} className="px-4 py-3 border rounded-lg"/>
              <input placeholder="Longitude" type="number" step="any" value={lng} onChange={e=>setLng(e.target.value)} className="px-4 py-3 border rounded-lg"/>
            </div>
            <h3 className="font-semibold text-gray-700">{isZh?"紧急联系人":"Emergency Contact"}</h3>
            <input placeholder={isZh?"姓名":"Name"} value={ecName} onChange={e=>setEcName(e.target.value)} className="w-full px-4 py-3 border rounded-lg"/>
            <input placeholder={isZh?"电话":"Phone"} value={ecPhone} onChange={e=>setEcPhone(e.target.value)} className="w-full px-4 py-3 border rounded-lg"/>
            <input placeholder={isZh?"关系":"Relationship"} value={ecRelation} onChange={e=>setEcRelation(e.target.value)} className="w-full px-4 py-3 border rounded-lg"/>
            <button onClick={submitCustomer} disabled={loading} className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50">{loading?"...":(isZh?"完成":"Complete")}</button>
          </div>
        ) : (
          <div className="space-y-3">
            <input placeholder="ABN" value={abn} onChange={e=>setAbn(e.target.value)} className="w-full px-4 py-3 border rounded-lg"/>
            <input placeholder={isZh?"时薪(AUD)":"Hourly Rate"} type="number" value={baseRate} onChange={e=>setBaseRate(e.target.value)} className="w-full px-4 py-3 border rounded-lg"/>
            <input placeholder={isZh?"邮编(逗号分隔)":"Postcodes (comma sep)"} value={postcodes} onChange={e=>setPostcodes(e.target.value)} className="w-full px-4 py-3 border rounded-lg"/>
            <select value={tier} onChange={e=>setTier(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
              <option value="basic">{isZh?"基础":"Basic Home Help"}</option>
              <option value="certified">{isZh?"认证":"Certified Care"}</option>
              <option value="clinical">{isZh?"临床":"Clinical"}</option>
            </select>
            <button onClick={submitProvider} disabled={loading} className="w-full py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50">{loading?"...":(isZh?"提交":"Submit")}</button>
          </div>
        )}
      </div>
    </main>);
}
