'use client'

import { useState } from 'react'
import {
  QUALIFICATIONS, REQUIRED_CHECKS, GOV_SCHEMES,
  NDIS_REGISTRATION_PATHS, STATE_SCREENING_LINKS, QUALIFICATION_NOTES,
} from '@/lib/types/certifications'
import type { QualificationId, SchemeId } from '@/lib/types/certifications'

type Step = 0 | 1 | 2 | 3 | 4

interface FormState {
  ndisPath: 'sole_trader' | 'registered_provider' | ''
  qualifications: QualificationId[]
  checkDates: Record<string, string>
  checkConfirmed: Record<string, boolean>
  schemes: SchemeId[]
  notes: string
}

const LEVEL_BADGE: Record<string, string> = {
  entry:    'bg-gray-100 text-gray-600',
  advanced: 'bg-blue-100 text-blue-700',
  diploma:  'bg-purple-100 text-purple-700',
  degree:   'bg-indigo-100 text-indigo-700',
}

const LEVEL_LABEL: Record<string, string> = {
  entry: 'Entry', advanced: 'Advanced', diploma: 'Diploma', degree: 'Degree',
}

export default function ProviderCertificationChecklist() {
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<FormState>({
    ndisPath: '', qualifications: [], checkDates: {}, checkConfirmed: {}, schemes: [], notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const toggleQual = (id: QualificationId) =>
    setForm(f => ({
      ...f,
      qualifications: f.qualifications.includes(id)
        ? f.qualifications.filter(q => q !== id)
        : [...f.qualifications, id],
    }))

  const toggleScheme = (id: SchemeId) =>
    setForm(f => ({
      ...f,
      schemes: f.schemes.includes(id)
        ? f.schemes.filter(s => s !== id)
        : [...f.schemes, id],
    }))

  const allMandatoryConfirmed = REQUIRED_CHECKS
    .filter(c => c.mandatory)
    .every(c => form.checkConfirmed[c.id])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/provider/certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className='max-w-2xl mx-auto p-8 text-center'>
        <div className='text-6xl mb-4'>✅</div>
        <h2 className='text-2xl font-bold text-green-700 mb-2'>Registration Submitted!</h2>
        <p className='text-gray-600 text-lg mb-4'>
          Our team will review your qualifications within 2 business days.
        </p>
        <p className='text-sm text-gray-400'>
          You will receive an email confirmation at your registered address.
          Bookings will be unlocked once all mandatory checks are verified.
        </p>
      </div>
    )
  }

  const steps = ['NDIS Path', 'Qualifications', 'Required Checks', 'Govt Schemes', 'Review']

  return (
    <div className='max-w-3xl mx-auto p-4 md:p-8'>

      {/* Progress steps */}
      <div className='flex items-center mb-6'>
        {steps.map((label, i) => (
          <div key={label} className='flex items-center flex-1 last:flex-none'>
            <div className='flex flex-col items-center'>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                step > i  ? 'bg-blue-600 border-blue-600 text-white' :
                step === i ? 'bg-white border-blue-600 text-blue-600' :
                                 'bg-white border-gray-300 text-gray-400'
              }`}>{step > i ? '✓' : i + 1}</div>
              <span className={`text-xs mt-1 hidden sm:block ${
                step === i ? 'text-blue-600 font-medium' : 'text-gray-400'
              }`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                step > i ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: NDIS Registration Path ──────────────────── */}
      {step === 0 && (
        <div>
          <h2 className='text-xl font-bold text-gray-900 mb-1'>Choose Your NDIS Registration Path</h2>
          <p className='text-sm text-gray-500 mb-2'>
            This determines your compliance checklist and which NDIS participants you can serve.
          </p>
          <div className='bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-sm text-blue-800'>
            <strong>Not sure?</strong> Start as an <em>Unregistered Sole Trader</em> — serve
            self-managed and plan-managed participants immediately, no audit. Upgrade to registered
            provider later once your client base is stable.
          </div>
          <div className='space-y-4'>
            {NDIS_REGISTRATION_PATHS.map(path => (
              <button
                key={path.id}
                type='button'
                onClick={() => { setForm(f => ({ ...f, ndisPath: path.id })); setStep(1) }}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all hover:border-blue-400 ${
                  form.ndisPath === path.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className='flex items-start justify-between gap-4 mb-2'>
                  <span className='font-bold text-gray-900 text-base'>{path.label}</span>
                  <span className='text-xs whitespace-nowrap bg-gray-100 text-gray-500 px-2 py-1 rounded-lg'>
                    {path.timeToStart}
                  </span>
                </div>
                <p className='text-sm text-gray-600 mb-3 leading-relaxed'>{path.description}</p>
                <div className='flex flex-wrap gap-2 mb-2'>
                  {path.canServe.map(s => (
                    <span key={s} className='text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full'>{s}</span>
                  ))}
                </div>
                {path.auditRequired ? (
                  <div className='mt-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg'>
                    ⚠️ Requires independent audit ({path.auditTypes?.map(a => `${a.type}: ${a.costRange}`).join(' | ')})
                  </div>
                ) : (
                  <div className='mt-2 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg'>
                    ✅ No audit required — start serving clients within weeks
                  </div>
                )}
                <p className='mt-3 text-xs text-blue-700 italic'>{path.practicalTip}</p>
              </button>
            ))}
          </div>
          <div className='mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800'>
            <strong>⚕️ Note:</strong> {QUALIFICATION_NOTES.cert3Warning}
          </div>
        </div>
      )}

      {/* ── Step 1: Qualifications ─────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className='text-xl font-bold text-gray-900 mb-1'>Your Qualifications</h2>
          <p className='text-sm text-gray-500 mb-6'>
            Select all qualifications you hold. You can add more later as you gain new certifications.
          </p>
          <div className='space-y-3'>
            {QUALIFICATIONS.map(q => {
              const selected = form.qualifications.includes(q.id)
              return (
                <label key={q.id} className={`flex gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200 bg-white'
                }`}>
                  <input
                    type='checkbox'
                    className='mt-1 w-5 h-5 accent-blue-600 flex-shrink-0 cursor-pointer'
                    checked={selected}
                    onChange={() => toggleQual(q.id)}
                  />
                  <div className='flex-1 min-w-0'>
                    <div className='flex flex-wrap items-center gap-2 mb-0.5'>
                      <span className='font-semibold text-gray-900'>{q.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        LEVEL_BADGE[q.level]
                      }`}>{LEVEL_LABEL[q.level]}</span>
                      <span className='text-xs font-mono bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded'>
                        {q.code}
                      </span>
                      {q.ahpra && (
                        <span className='text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium'>
                          ⚡ AHPRA {q.ahpraCategory}
                        </span>
                      )}
                      {q.assoc && (
                        <span className='text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium'>
                          {q.assoc}
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-gray-500 leading-relaxed'>{q.description}</p>
                    {q.streams && (
                      <div className='flex flex-wrap gap-1 mt-2'>
                        {q.streams.map(s => (
                          <span key={s} className='text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full'>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={form.qualifications.length === 0}
            className='mt-8 w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-lg disabled:opacity-40 hover:bg-blue-700 active:bg-blue-800 transition-colors'
          >
            {form.qualifications.length > 0
              ? `Next: Required Checks → (${form.qualifications.length} selected)`
              : 'Select at least one qualification to continue'}
          </button>
        </div>
      )}

      {/* ── Step 2: Required Checks ────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 className='text-xl font-bold text-gray-900 mb-1'>Required Checks & Documents</h2>
          <p className='text-sm text-gray-500 mb-2'>
            All <span className='text-red-600 font-medium'>mandatory</span> items must be confirmed
            before your first booking. Upload certificates in your profile after registration.
          </p>
          <div className='bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-sm text-amber-800'>
            <strong>NDIS Registration Steps:</strong>
            <ol className='list-decimal ml-5 mt-1 space-y-0.5 text-amber-700'>
              <li>Create an account at ndiscommission.gov.au</li>
              <li>Submit registration application + select registration groups</li>
              <li>Quality audit — self-assessment (unregistered) or third-party audit (registered)</li>
              <li>Complete NDIS Worker Screening Check in your state/territory</li>
              <li>Upload qualifications, police check &amp; insurance documents</li>
            </ol>
          </div>
          <div className='space-y-3'>
            {REQUIRED_CHECKS.map(c => (
              <div key={c.id} className={`p-4 rounded-xl border-2 ${
                c.mandatory ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-white'
              }`}>
                <div className='flex items-start gap-3'>
                  <input
                    type='checkbox'
                    id={'chk_' + c.id}
                    className='mt-1 w-5 h-5 accent-green-600 flex-shrink-0 cursor-pointer'
                    checked={!!form.checkConfirmed[c.id]}
                    onChange={e => setForm(f => ({
                      ...f,
                      checkConfirmed: { ...f.checkConfirmed, [c.id]: e.target.checked },
                    }))}
                  />
                  <div className='flex-1'>
                    <label htmlFor={'chk_' + c.id} className='flex flex-wrap items-center gap-2 cursor-pointer'>
                      <span className='font-semibold text-gray-900'>{c.label}</span>
                      {c.mandatory
                        ? <span className='text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium'>Mandatory</span>
                        : <span className='text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full'>Recommended</span>
                      }
                    </label>
                    <p className='text-sm text-gray-500 mt-0.5 leading-relaxed'>{c.sublabel}</p>
                    <div className='flex flex-wrap items-end gap-4 mt-2'>
                      {c.expiry && (
                        <div>
                          <label className='text-xs text-gray-400 block mb-1'>Expiry / Issue date</label>
                          <input
                            type='date'
                            value={form.checkDates[c.id] ?? ''}
                            onChange={e => setForm(f => ({
                              ...f,
                              checkDates: { ...f.checkDates, [c.id]: e.target.value },
                            }))}
                            className='text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                        </div>
                      )}
                      {c.link && (
                        <a
                          href={c.link}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-xs text-blue-600 hover:underline pb-1.5'
                        >
                          Apply / Renew ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className='flex gap-3 mt-8'>
            <button
              onClick={() => setStep(1)}
              className='flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50'
            >← Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={!allMandatoryConfirmed}
              className='flex-[2] py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg disabled:opacity-40 hover:bg-blue-700 transition-colors'
            >
              {allMandatoryConfirmed ? 'Next: Government Schemes →' : 'Confirm all mandatory checks first'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Government Schemes ─────────────────────── */}
      {step === 3 && (
        <div>
          <h2 className='text-xl font-bold text-gray-900 mb-1'>Government Funding Schemes</h2>
          <p className='text-sm text-gray-500 mb-5'>
            Select schemes you want to offer services through.
            SilverConnect manages billing, claims, and paperwork for all selected schemes.
          </p>
          {(['AU', 'CN'] as const).map(country => (
            <div key={country} className='mb-8'>
              <h3 className='text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2'>
                <span className='text-xl'>{country === 'AU' ? '' : ''}</span>
                {country === 'AU' ? 'Australia' : 'China 中国'}
              </h3>
              <div className='space-y-3'>
                {GOV_SCHEMES.filter(s => s.country === country).map(scheme => {
                  const selected = form.schemes.includes(scheme.id)
                  return (
                    <label key={scheme.id} className={`flex gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200 bg-white'
                    }`}>
                      <input
                        type='checkbox'
                        className='mt-1 w-5 h-5 accent-green-600 flex-shrink-0 cursor-pointer'
                        checked={selected}
                        onChange={() => toggleScheme(scheme.id)}
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='font-semibold text-gray-900 mb-0.5'>{scheme.label}</div>
                        {scheme.labelZh && scheme.labelZh !== scheme.label.split('(')[1]?.replace(')', '') && (
                          <div className='text-sm text-gray-400 mb-1'>{scheme.labelZh}</div>
                        )}
                        <p className='text-sm text-gray-600 leading-relaxed mb-2'>{scheme.description}</p>
                        <div className='flex flex-wrap gap-2 text-xs'>
                          <span className='bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full'>
                             {scheme.forGroup.split('—')[0].trim()}
                          </span>
                          <span className='bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full'>
                             {scheme.platformFeeNote}
                          </span>
                        </div>
                        {scheme.registrationLink && (
                          <a
                            href={scheme.registrationLink}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-xs text-blue-600 hover:underline mt-2 inline-block'
                          >
                            Register as provider ↗
                          </a>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
          <div className='flex gap-3'>
            <button onClick={() => setStep(2)} className='flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50'>← Back</button>
            <button onClick={() => setStep(4)} className='flex-[2] py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors'>
              Next: Review &amp; Submit →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Review ─────────────────────────────────── */}
      {step === 4 && (
        <div>
          <h2 className='text-xl font-bold text-gray-900 mb-6'>Review Your Registration</h2>

          <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4'>
            <h3 className='font-semibold text-blue-800 mb-2'>
               Qualifications ({form.qualifications.length})
            </h3>
            {form.qualifications.map(id => {
              const q = QUALIFICATIONS.find(x => x.id === id)
              return q ? (
                <div key={id} className='text-sm text-blue-700'>✓ {q.label} <span className='text-blue-400'>({q.code})</span></div>
              ) : null
            })}
          </div>

          <div className='bg-green-50 border border-green-200 rounded-xl p-4 mb-4'>
            <h3 className='font-semibold text-green-800 mb-2'>✔️ Required Checks</h3>
            {REQUIRED_CHECKS.filter(c => form.checkConfirmed[c.id]).map(c => (
              <div key={c.id} className='text-sm text-green-700'>
                ✓ {c.label}
                {form.checkDates[c.id] && (
                  <span className='text-green-500 ml-2 text-xs'>expires {form.checkDates[c.id]}</span>
                )}
              </div>
            ))}
          </div>

          {form.schemes.length > 0 && (
            <div className='bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4'>
              <h3 className='font-semibold text-amber-800 mb-2'>
                 Government Schemes ({form.schemes.length})
              </h3>
              {form.schemes.map(id => {
                const s = GOV_SCHEMES.find(x => x.id === id)
                return s ? (
                  <div key={id} className='text-sm text-amber-700'>✓ {s.label}</div>
                ) : null
              })}
            </div>
          )}

          <div className='mb-5'>
            <label className='block text-sm font-medium text-gray-700 mb-1.5'>
              Additional notes <span className='text-gray-400 font-normal'>(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder='E.g. languages spoken, years of experience, areas of specialisation, availability...'
              className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white'
            />
          </div>

          <p className='text-xs text-gray-400 mb-4'>
            By submitting, you confirm all information is accurate and you consent to SilverConnect verifying your documents.
            Misrepresentation of qualifications may result in account suspension.
          </p>

          <div className='flex gap-3'>
            <button onClick={() => setStep(3)} className='flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50'>← Back</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className='flex-[2] py-3.5 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-colors'
            >
              {submitting ? 'Submitting...' : '✓ Submit Registration'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
