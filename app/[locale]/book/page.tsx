"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function BookingPage() {
  const { locale } = useParams();
  const isZh = locale === "zh";
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ serviceId: "", date: "", time: "09:00", duration: "2", notes: "" });

  async function submitBooking() {
    setLoading(true); setError("");
    const res = await fetch("/api/bookings/create", { method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ serviceId: form.serviceId, targetDatetime: `${form.date}T${form.time}:00Z`, durationHours: parseInt(form.duration), notes: form.notes })});
    const data = await res.json();
    if (!res.ok) { setError(data.error||"Failed"); setLoading(false); return; }
    setResult(data); setStep(3); setLoading(false);
  }
  async function payBooking() {
    if (!result?.bookingId) return; setLoading(true);
    const res = await fetch(`/api/bookings/${result.bookingId}/pay`, { method: "POST" });
    const data = await res.json();
    if (res.ok) setResult({...result, paid: true});
    setLoading(false);
  }

  const services = [
    { id:"home_help", icon:"🏠", en:"Home Help", zh:"家庭帮助" },
    { id:"personal_care", icon:"🛁", en:"Personal Care", zh:"个人护理" },
    { id:"clinical", icon:"💊", en:"Clinical Care", zh:"临床护理" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex justify-center mb-8">
          {[1,2,3].map(s=>(<div key={s} className={`w-10 h-12 rounded-full flex items-center justify-center mx-2 ${s<=step?"bg-teal-600 text-white":"bg-gray-200"}`}>{s}</div>))}
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step===1 && (<>
            <h1 className="text-2xl font-bold text-teal-700 mb-6">{isZh?"选择服务":"Choose Service"}</h1>
            <div className="space-y-3">{services.map(s=>(
              <button key={s.id} onClick={()=>{setForm({...form,serviceId:s.id});setStep(2);}} className="w-full p-4 border-2 rounded-xl text-left hover:border-teal-500 hover:bg-teal-50">
                <span className="text-2xl mr-3">{s.icon}</span><span className="font-semibold">{isZh?s.zh:s.en}</span>
              </button>))}</div></>)}
          {step===2 && (<>
            <h1 className="text-2xl font-bold text-teal-700 mb-6">{isZh?"选择时间":"Pick Time"}</h1>
            <div className="space-y-4">
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} min={new Date().toISOString().split("T")[0]} className="w-full px-4 py-3 border rounded-lg text-lg"/>
              <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} className="w-full px-4 py-3 border rounded-lg text-lg"/>
              <select value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} className="w-full px-4 py-3 border rounded-lg text-lg">
                {[1,2,3,4,5,6,7,8].map(h=>(<option key={h} value={h}>{h} {isZh?"小时":"hrs"}</option>))}</select>
              <textarea placeholder={isZh?"备注":"Notes"} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full px-4 py-3 border rounded-lg" rows={3}/>
              <button onClick={submitBooking} disabled={loading||!form.date} className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50">{loading?"...":(isZh?"确认":"Confirm")}</button>
              {error && <p className="text-red-600">{error}</p>}
            </div></>)}
          {step===3 && result && (<>
            <h1 className="text-2xl font-bold text-green-700 mb-4">{isZh?"预约成功！":"Booking Confirmed!"}</h1>
            <div className="bg-green-50 p-4 rounded-lg mb-4"><p><strong>Total:</strong> ${result.totalCharge} {result.currency}</p></div>
            {!result.paid && <button onClick={payBooking} disabled={loading} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">{loading?"...":(isZh?"支付":"Pay Now")}</button>}
            {result.paid && <p className="text-green-600 text-center font-semibold">✅ {isZh?"已支付":"Paid"}</p>}
          </>)}
        </div>
      </div>
    </main>);
}
