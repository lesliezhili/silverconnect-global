// app/bookings/discover/page.tsx
'use client';

import { useState } from 'react';

export default function CareDiscoveryUI() {
  const [tier, setTier] = useState<'Level_1' | 'Level_2' | 'Level_3'>('Level_1');
  const [postcode, setPostcode] = useState('3000');
  const [providers, setProviders] = useState([
    { id: 1, name: 'Sarah Jenkins', rating: 4.9, reviews: 32, badge: 'Level_1_Basic_Community', verified: true, time: '09:00 - 12:00' },
    { id: 2, name: 'David Zhang (Registered Nurse)', rating: 5.0, reviews: 14, badge: 'Level_3_Clinical_Professional', verified: true, time: '14:00 - 17:00' }
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar: NDIS Balance Track Indicator */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-blue-600">🌍 HeRun</span>
          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold tracking-wide">NON-PROFIT</span>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium">
          <span className="text-slate-500">NDIS Managed Allocation / NDIS 資金分配:</span>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-md border border-emerald-200 font-bold">$1,420.50 AUD</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Uber-Style Address Core Search Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">📍 Where do you require companion services? / 請輸入服務地址</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input type="text" placeholder="Enter service delivery street address..." className="w-full rounded-lg border border-slate-300 p-3 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 text-black outline-none" />
            </div>
            <div>
              <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Postcode" className="w-full rounded-lg border border-slate-300 p-3 text-sm bg-slate-50 text-black outline-none" />
            </div>
          </div>
        </div>

        {/* Tier Pricing Selector Engine Matrix */}
        <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-4">Select Care Level / 選擇服務密級層級</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { id: 'Level_1', name: 'Tier 1: Basic Companion', rate: '$35.00/hr', desc: 'Social assistance, household run, transport. No clinical credentials.' },
            { id: 'Level_2', name: 'Tier 2: Certified Support', rate: '$52.50/hr', desc: 'Personal hygiene care, high-needs support. Verified Cert IV Carer.' },
            { id: 'Level_3', name: 'Tier 3: Clinical Allied Health', rate: '$115.00/hr', desc: 'Diagnostic therapy, nursing care, physio. Primary AHPRA code locked.' }
          ].map((item) => (
            <div 
              key={item.id} 
              onClick={() => setTier(item.id as any)}
              className={`cursor-pointer rounded-xl p-5 border-2 transition-all ${tier === item.id ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-900">{item.name}</h4>
                <span className="text-blue-600 font-extrabold text-lg">{item.rate}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Mable-Style Interactive Profile List View */}
        <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-4">Available Partners in Postcode {postcode} / 當地服務夥伴</h3>
        <div className="space-y-4">
          {providers.filter(p => tier === 'Level_3' ? p.badge.includes('Clinical') : !p.badge.includes('Clinical')).map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-lg">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-slate-900 text-base">{p.name}</h5>
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">✓ Verified</span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-0.5">{p.badge.replace(/_/g, ' ')}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                    <span className="text-amber-500">★</span>
                    <span className="font-semibold text-slate-700">{p.rating}</span>
                    <span>({p.reviews} reviews)</span>
                    <span className="mx-1">•</span>
                    <span>Police Check Cleared</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-auto flex flex-col items-end gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                <span className="text-xs text-slate-500 font-medium">Availability Today: {p.time}</span>
                <button className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm">
                  Request Atomic Match
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}