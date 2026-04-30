'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useLocation } from './LocationDetector'
import { supabase } from '@/lib/supabase'
import { SERVICES_AU } from '@/lib/services'

interface ProviderRegistrationProps {
  isOpen: boolean
  onClose: () => void
  language?: 'en' | 'zh'
  onSuccess?: () => void
}

interface ProviderForm {
  firstName: string
  lastName: string
  phone: string
  postcode: string
  suburb: string
  services: string[]
  experience: string
  certifications: string
  bio: string
  is_christian: boolean
  faith_background: string
}

const EXPERIENCE_OPTIONS = ['0-1', '1-3', '3-5', '5-10', '10+']
const DEFAULT_SERVICES = SERVICES_AU.slice(0, 8).map(s => s.name)

export default function ProviderRegistration({ isOpen, onClose, onSuccess }: ProviderRegistrationProps) {
  const { location } = useLocation()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [providerId, setProviderId] = useState<string | null>(null)

  const [formData, setFormData] = useState<ProviderForm>({
    firstName: '',
    lastName: '',
    phone: '',
    postcode: location.postcode,
    suburb: location.suburb,
    services: [],
    experience: '1-3',
    certifications: '',
    bio: '',
    is_christian: false,
    faith_background: '',
  })

  useEffect(() => {
    setFormData(prev => ({ ...prev, postcode: location.postcode, suburb: location.suburb }))
  }, [location.postcode, location.suburb])

  const setField = (key: keyof ProviderForm, value: ProviderForm[keyof ProviderForm]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }))
  }

  const createProviderProfile = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        setError('Please sign in first to become a provider.')
        setLoading(false)
        return
      }

      const requestBody = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        postcode: formData.postcode,
        suburb: formData.suburb,
        services: formData.services,
        experience: formData.experience,
        certifications: formData.certifications.split(',').map(c => c.trim()).filter(Boolean),
        bio: formData.bio,
        is_christian: formData.is_christian,
        faith_background: formData.faith_background,
      }

      const response = await fetch('/api/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade to provider')
      }

      if (data.provider?.id) {
        setProviderId(data.provider.id)
        setSuccess(true)
        setStep(4)
        onSuccess?.()
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to upgrade to provider. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="font-serif text-2xl font-semibold">Join as a Care Provider</h3>
            <p className="text-sm text-gray-500 mt-1">Complete this quick application and we’ll create your provider profile.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              Your provider profile is being created. You can now access the provider dashboard.
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">First name</label>
                  <input
                    value={formData.firstName}
                    onChange={e => setField('firstName', e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-green-200"
                    placeholder="Ava"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Last name</label>
                  <input
                    value={formData.lastName}
                    onChange={e => setField('lastName', e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-green-200"
                    placeholder="Nguyen"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Phone</label>
                  <input
                    value={formData.phone}
                    onChange={e => setField('phone', e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-green-200"
                    placeholder="04xx xxx xxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Suburb</label>
                  <input
                    value={formData.suburb}
                    onChange={e => setField('suburb', e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-green-200"
                    placeholder="Melbourne"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Postcode</label>
                <input
                  value={formData.postcode}
                  onChange={e => setField('postcode', e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-green-200"
                  placeholder="3000"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Services you offer</label>
                  <span className="text-xs text-gray-400">Select at least one</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_SERVICES.map(service => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${formData.services.includes(service)
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}>
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Years of experience</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_OPTIONS.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setField('experience', option)}
                      className={`rounded-full border px-3 py-2 text-xs ${formData.experience === option
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Professional bio</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setField('bio', e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-green-200"
                  placeholder="Tell us about your care experience..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Certifications</label>
                <input
                  value={formData.certifications}
                  onChange={e => setField('certifications', e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-green-200"
                  placeholder="First aid, aged care, CPR, etc."
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple items with commas.</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.is_christian}
                    onChange={e => setField('is_christian', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600"
                  />
                  I identify as Christian and would like faith-aligned matching.
                </label>
                {formData.is_christian && (
                  <input
                    value={formData.faith_background}
                    onChange={e => setField('faith_background', e.target.value)}
                    className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-green-200"
                    placeholder="Faith background or church affiliation"
                  />
                )}
              </div>
            </div>
          )}

          {step === 4 && providerId && (
            <div className="rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h4 className="text-lg font-semibold text-green-900">Provider profile submitted</h4>
              <p className="text-sm text-green-800 mt-2">Your application is now live. Visit the provider dashboard to complete your listing.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            Step {Math.min(step, 4)} of 4
          </div>
          <div className="flex flex-wrap gap-3">
            {step > 1 && step < 4 && (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={step < 3 ? () => setStep(prev => prev + 1) : createProviderProfile}
                disabled={loading}
                className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {step < 3 ? 'Next' : loading ? 'Submitting...' : 'Submit Application'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-green-600 bg-white px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
