'use client'

import { useState } from 'react'
import { useLocation } from './LocationDetector'
import { VICTORIA_POSTCODES } from '@/lib/location'
import { supabase } from '@/lib/supabase'

interface FormData {
  firstName: string; lastName: string; email: string; phone: string
  postcode: string; suburb: string
  services: string[]; experience: string; certifications: string[]
  isChristian: boolean; faithBackground: string
  ndisNumber: string; policeCheckConsent: boolean
  availability: string[]; bio: string; linkedIn: string
}

const SERVICES_OPTIONS = [
  'Home cleaning', 'Personal care', 'Medication assistance',
  'Transport & escort', 'Companionship', 'Meal preparation',
  'Wellness & exercise', 'Wound care / nursing', 'Garden care', 'Shopping assistance',
]
const CERT_OPTIONS = ['First Aid', 'CPR', 'NDIS Worker Orientation', 'Dementia Care', 'Manual Handling', 'Food Safety']
const AVAIL_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Map service names to category keys for database
const SERVICE_CATEGORY_MAP: Record<string, string> = {
  'Home cleaning': 'cleaning',
  'Personal care': 'personal',
  'Medication assistance': 'personal',
  'Transport & escort': 'personal',
  'Companionship': 'personal',
  'Meal preparation': 'cooking',
  'Wellness & exercise': 'personal',
  'Wound care / nursing': 'maintenance',
  'Garden care': 'gardening',
  'Shopping assistance': 'personal',
}

export default function ProviderRegistration({ onClose }: { onClose?: () => void }) {
  const { location } = useLocation()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    postcode: location.postcode, suburb: location.suburb,
    services: [], experience: '', certifications: [],
    isChristian: false, faithBackground: '',
    ndisNumber: '', policeCheckConsent: false,
    availability: [], bio: '', linkedIn: '',
  })

  const set = (k: keyof FormData, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleArr = (k: 'services' | 'certifications' | 'availability', val: string) => {
    setForm(f => ({
      ...f,
      [k]: (f[k] as string[]).includes(val)
        ? (f[k] as string[]).filter(x => x !== val)
        : [...(f[k] as string[]), val],
    }))
  }
const handleSubmit = async () => {
  setSubmitting(true);
  setError(null);

  try {
    const profileRes = await fetch('/api/provider/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        postcode: form.postcode,
        suburb: form.suburb,
        services: form.services,
        experience: form.experience,
        certifications: form.certifications,
        bio: form.bio,
      }),
    });

    let profileJson = null;
    try {
      profileJson = await profileRes.json();
    } catch {
      setError('Server returned an invalid response');
      setSubmitting(false);
      return;
    }

    if (profileJson.error) {
      setError(profileJson.error);
      setSubmitting(false);
      return;
    }

    // Save availability with the access token from profile creation
    if (form.availability.length > 0) {
      const availabilityRes = await fetch('/api/provider/availability', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(profileJson.accessToken ? { 'Authorization': `Bearer ${profileJson.accessToken}` } : {})
        },
        body: JSON.stringify({ availability: form.availability }),
      });
      
      if (!availabilityRes.ok) {
        const availJson = await availabilityRes.json();
        console.error('Availability error:', availJson);
        // Don't fail the whole flow for availability errors
      }
    }

    setDone(true);
    onClose?.();
  } catch (err: any) {
    console.error('Submission error:', err);
    setError(err.message || 'Failed to submit application');
  } finally {
    setSubmitting(false);
  }
}

  if (done) return (
    <div className="text-center py-8 px-4">
      <div className="text-5xl mb-4">🙏</div>
      <h3 className="font-serif text-2xl font-semibold mb-2">Application received!</h3>
      <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto mb-4">
        Thank you, <strong>{form.firstName}</strong>. We'll review your application and
        contact you within 48 hours to arrange police check and onboarding.
      </p>
      <div className="bg-[#E8F3EE] rounded-xl p-3 text-sm text-[#1A3F38] mb-4">
        📍 Matched to <strong>{form.suburb} {form.postcode}</strong> service area
      </div>
      {form.isChristian && (
        <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800 border border-amber-200 mb-4">
          ✝️ Thank you for serving your community with faith and love.<br/>
          <em className="text-xs">"Whatever you did for one of the least of these..." — Matthew 25:40</em>
        </div>
      )}
      <button onClick={onClose}
        className="px-6 py-2.5 bg-[#2D6A5E] text-white rounded-xl text-sm font-medium">
        Close
      </button>
    </div>
  )

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-3 border-b border-gray-100">
        <div>
          <h3 className="font-serif text-xl font-semibold">Join as a care provider</h3>
          <p className="text-xs text-gray-400 mt-0.5">Step {step} of 3 · {
            step === 1 ? 'Personal details' : step === 2 ? 'Services & availability' : 'Verification'
          }</p>
        </div>
        {onClose && <button onClick={onClose} className="text-gray-400 text-xl">×</button>}
      </div>

      {/* Step progress */}
      <div className="flex gap-1 mb-5">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-[#2D6A5E]' : 'bg-gray-100'}`} />
        ))}
      </div>

      {/* ── STEP 1: Personal + Location ── */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">First name *</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Grace" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Last name *</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Chen" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Email *</label>
            <input type="email" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
              value={form.email} onChange={e => set('email', e.target.value)} placeholder="grace@email.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Mobile *</label>
            <input type="tel" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
              value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="04xx xxx xxx" />
          </div>

          {/* Location — postcode picker */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
              Your suburb / postcode * <span className="text-[#2D6A5E] normal-case">(where you can work)</span>
            </label>
            <div className="flex gap-2">
              <select
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
                value={form.postcode}
                onChange={e => {
                  const pc = VICTORIA_POSTCODES.find(p => p.postcode === e.target.value)
                  if (pc) { set('postcode', pc.postcode); set('suburb', pc.suburb) }
                }}>
                {VICTORIA_POSTCODES.map(p => (
                  <option key={p.postcode} value={p.postcode}>{p.postcode} — {p.suburb}</option>
                ))}
              </select>
            </div>
            <div className="mt-1.5 text-xs text-[#4A8C7D]">
              📍 Currently showing: <strong>{form.suburb} {form.postcode}</strong>
              {form.postcode === location.postcode && location.source === 'gps' && ' (GPS detected ✓)'}
            </div>
          </div>

          {/* Christian priority */}
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-amber-600"
                checked={form.isChristian}
                onChange={e => set('isChristian', e.target.checked)} />
              <div>
                <div className="text-sm font-medium text-amber-900">✝️ I identify as a Christian care provider</div>
                <div className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Christian providers are prioritised in our recruitment and matched with customers
                  who request values-aligned care. This is optional.
                </div>
              </div>
            </label>
            {form.isChristian && (
              <div className="mt-2">
                <select className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm bg-white"
                  value={form.faithBackground} onChange={e => set('faithBackground', e.target.value)}>
                  <option value="">Select denomination (optional)</option>
                  <option>Anglican / Church of England</option>
                  <option>Baptist</option>
                  <option>Catholic</option>
                  <option>Pentecostal / Charismatic</option>
                  <option>Presbyterian</option>
                  <option>Uniting Church</option>
                  <option>Orthodox</option>
                  <option>Other Christian</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Services + Availability ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Services you can provide *</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES_OPTIONS.map(s => (
                <label key={s} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm transition-colors ${
                  form.services.includes(s) ? 'border-[#2D6A5E] bg-[#E8F3EE] text-[#1A3F38]' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="checkbox" className="accent-[#2D6A5E]"
                    checked={form.services.includes(s)}
                    onChange={() => toggleArr('services', s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Availability</label>
            <div className="flex gap-2 flex-wrap">
              {AVAIL_OPTIONS.map(d => (
                <label key={d} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm transition-colors ${
                  form.availability.includes(d) ? 'border-[#2D6A5E] bg-[#2D6A5E] text-white' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="checkbox" className="hidden"
                    checked={form.availability.includes(d)}
                    onChange={() => toggleArr('availability', d)} />
                  {d}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Certifications</label>
            <div className="flex flex-wrap gap-2">
              {CERT_OPTIONS.map(c => (
                <label key={c} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs transition-colors ${
                  form.certifications.includes(c) ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="checkbox" className="hidden"
                    checked={form.certifications.includes(c)}
                    onChange={() => toggleArr('certifications', c)} />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Years of experience</label>
            <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-[#2D6A5E]"
              value={form.experience} onChange={e => set('experience', e.target.value)}>
              <option value="">Select...</option>
              <option>Less than 1 year</option>
              <option>1–2 years</option>
              <option>3–5 years</option>
              <option>5–10 years</option>
              <option>10+ years</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Bio (optional)</label>
            <textarea rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
              value={form.bio} onChange={e => set('bio', e.target.value)}
              placeholder="Tell seniors and families a little about yourself and why you love care work..." />
          </div>
        </div>
      )}

      {/* ── STEP 3: Verification ── */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-sm text-blue-800">
            <strong>What happens next:</strong>
            <ul className="mt-1.5 space-y-1 list-disc list-inside text-xs leading-relaxed">
              <li>We review your application within 48 hours</li>
              <li>We guide you through a National Police Check (free through us)</li>
              <li>Short video call interview (15 min)</li>
              <li>NDIS Worker Orientation Module (free online, 90 min)</li>
              <li>You're activated for your postcode and matched with customers</li>
            </ul>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">NDIS registration number (if you have one)</label>
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
              value={form.ndisNumber} onChange={e => set('ndisNumber', e.target.value)} placeholder="NDI..." />
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-[#2D6A5E]"
                checked={form.policeCheckConsent}
                onChange={e => set('policeCheckConsent', e.target.checked)} />
              <div className="text-xs text-gray-600 leading-relaxed">
                I consent to SilverConnect initiating a National Police Check through
                an approved provider. I understand this is required for all care workers. *
              </div>
            </label>
          </div>

          {/* Summary */}
          <div className="bg-[#E8F3EE] rounded-xl p-3 text-sm">
            <div className="font-medium text-[#1A3F38] mb-2">Application summary</div>
            <div className="space-y-1 text-xs text-[#2D6A5E]">
              <div>📍 Service area: <strong>{form.suburb} {form.postcode}</strong></div>
              <div>🔧 Services: <strong>{form.services.slice(0,3).join(', ')}{form.services.length > 3 ? ` +${form.services.length-3} more` : ''}</strong></div>
              <div>📅 Available: <strong>{form.availability.join(', ') || 'Not specified'}</strong></div>
              {form.isChristian && <div>✝️ <strong>Christian provider</strong> — priority matching</div>}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-gray-300">
            ← Back
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && (!form.firstName || !form.email)}
            className="flex-1 py-2.5 rounded-xl bg-[#2D6A5E] text-white text-sm font-medium hover:bg-[#1A3F38] disabled:opacity-50">
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit}
            disabled={!form.policeCheckConsent || submitting}
            className="flex-1 py-2.5 rounded-xl bg-[#2D6A5E] text-white text-sm font-medium hover:bg-[#1A3F38] disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
        )}
      </div>
    </div>
  )
}
