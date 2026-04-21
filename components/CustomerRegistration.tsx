'use client'

import { useState } from 'react'
import { useLocation } from './LocationDetector'
import { VICTORIA_POSTCODES } from '@/lib/location'
import { FUNDING_OPTIONS } from '@/lib/types'

interface CustomerForm {
  // Account holder (usually family member)
  holderFirstName: string; holderLastName: string
  holderEmail: string; holderPhone: string; holderRelationship: string
  // Senior / care recipient
  seniorFirstName: string; seniorLastName: string; seniorDOB: string
  seniorPostcode: string; seniorSuburb: string
  // Care needs
  services: string[]; frequency: string; fundingType: string
  hcpLevel: string; ndisNumber: string; medicareNumber: string
  // Preferences
  preferChristian: boolean; preferLanguage: string
  emergencyName: string; emergencyPhone: string; emergencyRelation: string
  notes: string
}

const SERVICES_NEEDED = [
  'Home cleaning', 'Personal care', 'Medication assistance',
  'Transport & escort', 'Companionship', 'Meal preparation',
  'Wellness & exercise', 'Garden care', 'Shopping assistance',
]
const LANGUAGES = ['English', 'Mandarin', 'Cantonese', 'Vietnamese', 'Greek', 'Italian', 'Arabic', 'Other']

export default function CustomerRegistration({ onClose }: { onClose?: () => void }) {
  const { location } = useLocation()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState<CustomerForm>({
    holderFirstName: '', holderLastName: '', holderEmail: '', holderPhone: '',
    holderRelationship: 'Self',
    seniorFirstName: '', seniorLastName: '', seniorDOB: '',
    seniorPostcode: location.postcode, seniorSuburb: location.suburb,
    services: [], frequency: 'weekly', fundingType: 'none', hcpLevel: '',
    ndisNumber: '', medicareNumber: '',
    preferChristian: false, preferLanguage: 'English',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    notes: '',
  })

  const set = (k: keyof CustomerForm, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const toggleService = (s: string) => setForm(f => ({
    ...f,
    services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s],
  }))

  const handleSubmit = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    setDone(true)
  }

  if (done) return (
    <div className="text-center py-8 px-4">
      <div className="text-5xl mb-4">💛</div>
      <h3 className="font-serif text-2xl font-semibold mb-2">You're registered!</h3>
      <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto mb-4">
        Welcome, <strong>{form.holderFirstName}</strong>. We're matching care workers
        near <strong>{form.seniorSuburb} {form.seniorPostcode}</strong> for{' '}
        <strong>{form.seniorFirstName}</strong> right now.
      </p>
      <div className="bg-[#E8F3EE] rounded-xl p-3 text-sm text-[#1A3F38] mb-3">
        {form.fundingType !== 'none'
          ? `✅ ${FUNDING_OPTIONS[form.fundingType as keyof typeof FUNDING_OPTIONS]} funding noted — we'll apply your subsidy at checkout`
          : '✅ Self-funded — our team will be in touch to confirm your first booking'
        }
      </div>
      {form.preferChristian && (
        <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 border border-amber-200 mb-4">
          ✝️ We'll prioritise faith-aligned care workers in your matches.
        </div>
      )}
      <button onClick={onClose}
        className="px-6 py-2.5 bg-[#2D6A5E] text-white rounded-xl text-sm font-medium">
        Find care workers now
      </button>
    </div>
  )

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-3 border-b border-gray-100">
        <div>
          <h3 className="font-serif text-xl font-semibold">Register for care</h3>
          <p className="text-xs text-gray-400 mt-0.5">Step {step} of 3 · {
            step === 1 ? 'Your details' : step === 2 ? 'Care needs & location' : 'Preferences & funding'
          }</p>
        </div>
        {onClose && <button onClick={onClose} className="text-gray-400 text-xl">×</button>}
      </div>

      <div className="flex gap-1 mb-5">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-[#2D6A5E]' : 'bg-gray-100'}`} />
        ))}
      </div>

      {/* ── STEP 1: Account holder ── */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-xs text-blue-800">
            This account can be created by the senior themselves, or by a family member / carer on their behalf.
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">I am registering as *</label>
            <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-[#2D6A5E]"
              value={form.holderRelationship} onChange={e => set('holderRelationship', e.target.value)}>
              <option>Self (I am the senior)</option>
              <option>Son / Daughter</option>
              <option>Spouse / Partner</option>
              <option>Other family member</option>
              <option>Legal guardian / carer</option>
              <option>Case manager</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Your first name *</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                value={form.holderFirstName} onChange={e => set('holderFirstName', e.target.value)} placeholder="Jennifer" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Last name *</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                value={form.holderLastName} onChange={e => set('holderLastName', e.target.value)} placeholder="Liu" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Email *</label>
            <input type="email" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
              value={form.holderEmail} onChange={e => set('holderEmail', e.target.value)} placeholder="jennifer@email.com" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Mobile *</label>
            <input type="tel" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
              value={form.holderPhone} onChange={e => set('holderPhone', e.target.value)} placeholder="04xx xxx xxx" />
          </div>

          {form.holderRelationship !== 'Self (I am the senior)' && (
            <>
              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Senior's details</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Senior's first name *</label>
                  <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                    value={form.seniorFirstName} onChange={e => set('seniorFirstName', e.target.value)} placeholder="Margaret" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Last name *</label>
                  <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                    value={form.seniorLastName} onChange={e => set('seniorLastName', e.target.value)} placeholder="Thompson" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date of birth</label>
                <input type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                  value={form.seniorDOB} onChange={e => set('seniorDOB', e.target.value)} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STEP 2: Care needs + Location ── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Location */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
              Care location — suburb/postcode *
            </label>
            <select
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-[#2D6A5E]"
              value={form.seniorPostcode}
              onChange={e => {
                const pc = VICTORIA_POSTCODES.find(p => p.postcode === e.target.value)
                if (pc) { set('seniorPostcode', pc.postcode); set('seniorSuburb', pc.suburb) }
              }}>
              {VICTORIA_POSTCODES.map(p => (
                <option key={p.postcode} value={p.postcode}>{p.postcode} — {p.suburb}</option>
              ))}
            </select>
            <div className="mt-1.5 text-xs text-[#4A8C7D]">
              📍 <strong>{form.seniorSuburb} {form.seniorPostcode}</strong>
              {form.seniorPostcode === location.postcode && location.source === 'gps' && ' — matches your GPS location ✓'}
            </div>
          </div>

          {/* Services needed */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Services needed *</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES_NEEDED.map(s => (
                <label key={s} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm transition-colors ${
                  form.services.includes(s) ? 'border-[#2D6A5E] bg-[#E8F3EE] text-[#1A3F38]' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="checkbox" className="accent-[#2D6A5E]"
                    checked={form.services.includes(s)} onChange={() => toggleService(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">How often is care needed?</label>
            <div className="flex gap-2 flex-wrap">
              {['Once-off', 'Weekly', 'Twice weekly', 'Daily', 'As needed'].map(f => (
                <button key={f}
                  onClick={() => set('frequency', f)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    form.frequency === f ? 'bg-[#2D6A5E] text-white border-[#2D6A5E]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency contact */}
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Emergency contact</div>
            <div className="grid grid-cols-2 gap-2">
              <input className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                value={form.emergencyName} onChange={e => set('emergencyName', e.target.value)} placeholder="Contact name" />
              <input type="tel" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} placeholder="04xx xxx xxx" />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Funding + Preferences ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Government funding</label>
            <div className="space-y-2">
              {FUNDING_OPTIONS.map(f => (
                <label key={f.type} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  form.fundingType === f.type ? 'border-[#2D6A5E] bg-[#E8F3EE]' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" name="funding" className="mt-0.5 accent-[#2D6A5E]"
                    checked={form.fundingType === f.type}
                    onChange={() => set('fundingType', f.type)} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{f.label}</div>
                    <div className="text-xs text-gray-500">{f.description}
                      {f.monthlySubsidy ? ` · ~$${f.monthlySubsidy.toLocaleString()}/month subsidy` : ''}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {(form.fundingType === 'hcp2' || form.fundingType === 'hcp3' || form.fundingType === 'hcp4') && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Medicare number (for HCP verification)</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-[#2D6A5E]"
                value={form.medicareNumber} onChange={e => set('medicareNumber', e.target.value)} placeholder="Medicare card number" />
            </div>
          )}

          {form.fundingType === 'ndis' && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">NDIS participant number</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-[#2D6A5E]"
                value={form.ndisNumber} onChange={e => set('ndisNumber', e.target.value)} placeholder="NDI..." />
            </div>
          )}

          {/* Preferences */}
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Preferred language</label>
              <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-[#2D6A5E]"
                value={form.preferLanguage} onChange={e => set('preferLanguage', e.target.value)}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-amber-500"
                checked={form.preferChristian} onChange={e => set('preferChristian', e.target.checked)} />
              <div>
                <div className="text-sm font-medium text-gray-800">✝️ Prefer a Christian care worker</div>
                <div className="text-xs text-gray-500 mt-0.5">We'll prioritise faith-aligned providers in your matches where available</div>
              </div>
            </label>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Additional notes</label>
              <textarea rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Allergies, access instructions, health conditions, pet in home..." />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
            ← Back
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && (!form.holderFirstName || !form.holderEmail)}
            className="flex-1 py-2.5 rounded-xl bg-[#2D6A5E] text-white text-sm font-medium hover:bg-[#1A3F38] disabled:opacity-50">
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-[#2D6A5E] text-white text-sm font-medium hover:bg-[#1A3F38] disabled:opacity-50">
            {submitting ? 'Registering...' : 'Complete registration'}
          </button>
        )}
      </div>
    </div>
  )
}
