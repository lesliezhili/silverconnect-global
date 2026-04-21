#!/bin/bash
# Run from inside your silverconnect-global folder:
#   bash push-location-fix.sh
set -e
cd "$(dirname "$0")" 2>/dev/null || true
[ -f "package.json" ] || { echo "❌ Run from silverconnect-global folder"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Writing lib/location.ts..."
mkdir -p lib
cat > lib/location.ts << 'FILE_lib_location_ts'
// Victoria inner-east postcode registry
export interface PostcodeInfo {
  postcode: string
  suburb: string
  state: string
  lat: number
  lng: number
  region: string
  goLiveThreshold: number
}

export const VICTORIA_POSTCODES: PostcodeInfo[] = [
  { postcode: '3102', suburb: 'Kew East',          state: 'VIC', lat: -37.8040, lng: 145.0513, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3101', suburb: 'Kew',               state: 'VIC', lat: -37.8006, lng: 145.0320, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3103', suburb: 'Balwyn',             state: 'VIC', lat: -37.8067, lng: 145.0843, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3104', suburb: 'Balwyn North',       state: 'VIC', lat: -37.7906, lng: 145.0888, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3122', suburb: 'Hawthorn',           state: 'VIC', lat: -37.8222, lng: 145.0362, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3123', suburb: 'Auburn',             state: 'VIC', lat: -37.8293, lng: 145.0510, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3124', suburb: 'Camberwell',         state: 'VIC', lat: -37.8363, lng: 145.0600, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3125', suburb: 'Burwood',            state: 'VIC', lat: -37.8485, lng: 145.1058, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3126', suburb: 'Canterbury',         state: 'VIC', lat: -37.8234, lng: 145.0730, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3127', suburb: 'Box Hill South',     state: 'VIC', lat: -37.8200, lng: 145.1260, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3128', suburb: 'Box Hill',           state: 'VIC', lat: -37.8197, lng: 145.1200, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3130', suburb: 'Nunawading',         state: 'VIC', lat: -37.8175, lng: 145.1760, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3131', suburb: 'Ringwood',           state: 'VIC', lat: -37.8114, lng: 145.2270, region: 'East',       goLiveThreshold: 5 },
  { postcode: '3132', suburb: 'Mitcham',            state: 'VIC', lat: -37.8200, lng: 145.1950, region: 'East',       goLiveThreshold: 5 },
  { postcode: '3068', suburb: 'Clifton Hill',       state: 'VIC', lat: -37.7880, lng: 144.9940, region: 'Inner North', goLiveThreshold: 5 },
  { postcode: '3065', suburb: 'Fitzroy',            state: 'VIC', lat: -37.7995, lng: 144.9790, region: 'Inner North', goLiveThreshold: 5 },
  { postcode: '3000', suburb: 'Melbourne CBD',      state: 'VIC', lat: -37.8136, lng: 144.9631, region: 'CBD',        goLiveThreshold: 5 },
  { postcode: '3121', suburb: 'Richmond',           state: 'VIC', lat: -37.8248, lng: 144.9999, region: 'Inner East', goLiveThreshold: 5 },
]

export const DEFAULT_LOCATION: PostcodeInfo = VICTORIA_POSTCODES[0] // 3102 Kew East

export function findByPostcode(postcode: string): PostcodeInfo | undefined {
  return VICTORIA_POSTCODES.find(p => p.postcode === postcode)
}

export function findNearestPostcode(lat: number, lng: number): PostcodeInfo {
  let nearest = DEFAULT_LOCATION
  let minDist = Infinity
  for (const p of VICTORIA_POSTCODES) {
    const dist = Math.sqrt(Math.pow(p.lat - lat, 2) + Math.pow(p.lng - lng, 2))
    if (dist < minDist) { minDist = dist; nearest = p }
  }
  return nearest
}

// Distance in km between two lat/lng points
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export interface LocationState {
  postcode: string
  suburb: string
  state: string
  lat: number
  lng: number
  source: 'gps' | 'postcode' | 'default'
  detected: boolean
}

export function locationFromPostcodeInfo(info: PostcodeInfo, source: LocationState['source']): LocationState {
  return {
    postcode: info.postcode,
    suburb: info.suburb,
    state: info.state,
    lat: info.lat,
    lng: info.lng,
    source,
    detected: source !== 'default',
  }
}
FILE_lib_location_ts
echo '  ✅ lib/location.ts'
mkdir -p lib
cat > lib/matching.ts << 'FILE_lib_matching_ts'
import { Provider, PROVIDERS } from './providers'
import { distanceKm, findByPostcode, VICTORIA_POSTCODES } from './location'
import type { ServiceCategory } from './types'

export interface MatchScore {
  provider: Provider
  distanceKm: number
  score: number // 0-100
  reasons: string[]
}

export interface MatchRequest {
  customerPostcode: string
  serviceCategory?: ServiceCategory
  preferChristian?: boolean
  maxDistanceKm?: number
  fundingType?: string
}

export function matchProviders(req: MatchRequest): MatchScore[] {
  const customerPc = findByPostcode(req.customerPostcode)
  if (!customerPc) return []

  const maxDist = req.maxDistanceKm ?? 15

  const scored: MatchScore[] = []

  for (const provider of PROVIDERS) {
    if (!provider.isVerified) continue

    const providerPc = findByPostcode(provider.postcode)
    if (!providerPc) continue

    const dist = distanceKm(customerPc.lat, customerPc.lng, providerPc.lat, providerPc.lng)
    if (dist > maxDist) continue

    // Service match
    if (req.serviceCategory && !provider.services.includes(req.serviceCategory)) continue

    let score = 0
    const reasons: string[] = []

    // Distance scoring (0-35 pts) — closer is better
    const distScore = Math.max(0, 35 - (dist / maxDist) * 35)
    score += distScore
    if (dist < 2) reasons.push(`Only ${dist.toFixed(1)}km away`)
    else reasons.push(`${dist.toFixed(1)}km from you`)

    // Rating scoring (0-25 pts)
    const ratingScore = ((provider.rating - 4.0) / 1.0) * 25
    score += ratingScore
    if (provider.rating >= 4.95) reasons.push('Top rated ★' + provider.rating)

    // Christian preference (0-20 pts)
    if (req.preferChristian && provider.isChristian) {
      score += 20
      reasons.push('Faith-aligned care')
    }

    // Experience (0-10 pts)
    const expScore = Math.min(10, provider.experienceYears * 2)
    score += expScore
    if (provider.experienceYears >= 5) reasons.push(`${provider.experienceYears} yrs experience`)

    // Featured bonus (5 pts)
    if (provider.isFeatured) { score += 5; reasons.push('Top provider') }

    // Funding compatibility (5 pts)
    if (req.fundingType === 'ndis' && provider.ndisRegistered) {
      score += 5; reasons.push('NDIS registered')
    }
    if (req.fundingType === 'dva') {
      score += 5; reasons.push('DVA accepted')
    }

    scored.push({ provider, distanceKm: dist, score: Math.round(score), reasons })
  }

  return scored.sort((a, b) => b.score - a.score)
}

export function getPostcodeCoverage() {
  return VICTORIA_POSTCODES.map(pc => {
    const providers = PROVIDERS.filter(p => p.postcode === pc.postcode && p.isVerified)
    const christians = providers.filter(p => p.isChristian).length
    const isLive = providers.length >= pc.goLiveThreshold
    return {
      ...pc,
      providerCount: providers.length,
      christianCount: christians,
      isLive,
      pctFull: Math.min(100, Math.round((providers.length / pc.goLiveThreshold) * 100)),
    }
  })
}

// Extend providers with distance from a given postcode
export function providersNearPostcode(postcode: string, maxKm = 15): MatchScore[] {
  return matchProviders({ customerPostcode: postcode, maxDistanceKm: maxKm })
}
FILE_lib_matching_ts
echo '  ✅ lib/matching.ts'
mkdir -p components
cat > components/LocationDetector.tsx << 'FILE_components_LocationDetector_tsx'
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LocationState, findByPostcode, findNearestPostcode,
  locationFromPostcodeInfo, DEFAULT_LOCATION, VICTORIA_POSTCODES
} from '@/lib/location'

const STORAGE_KEY = 'sc_location'

export function useLocation() {
  const [location, setLocation] = useState<LocationState>(() =>
    locationFromPostcodeInfo(DEFAULT_LOCATION, 'default')
  )
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load saved location on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as LocationState
        if (parsed.postcode && parsed.suburb) {
          setLocation(parsed)
          return
        }
      }
    } catch {}
    // Auto-detect on first load
    detectGPS()
  }, [])

  const detectGPS = useCallback(() => {
    setDetecting(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('GPS not available')
      setDetecting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestPostcode(pos.coords.latitude, pos.coords.longitude)
        const loc = locationFromPostcodeInfo(nearest, 'gps')
        setLocation(loc)
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)) } catch {}
        setDetecting(false)
        setError(null)
      },
      (err) => {
        const msg = err.code === 1 ? 'Location permission denied'
          : err.code === 2 ? 'Location unavailable'
          : 'Location detection timed out'
        setError(msg)
        setDetecting(false)
        // Keep default 3102
      },
      { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
    )
  }, [])

  const setByPostcode = useCallback((postcode: string) => {
    const info = findByPostcode(postcode.trim())
    if (info) {
      const loc = locationFromPostcodeInfo(info, 'postcode')
      setLocation(loc)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)) } catch {}
      setError(null)
      return true
    }
    setError(`Postcode ${postcode} not found in our service area`)
    return false
  }, [])

  return { location, detecting, error, detectGPS, setByPostcode }
}

interface Props {
  onLocationChange?: (loc: LocationState) => void
  compact?: boolean
}

export default function LocationDetector({ onLocationChange, compact = false }: Props) {
  const { location, detecting, error, detectGPS, setByPostcode } = useLocation()
  const [showModal, setShowModal] = useState(false)
  const [postcodeInput, setPostcodeInput] = useState('')
  const [inputError, setInputError] = useState('')

  useEffect(() => {
    onLocationChange?.(location)
  }, [location, onLocationChange])

  const handlePostcodeSubmit = () => {
    setInputError('')
    if (!/^\d{4}$/.test(postcodeInput.trim())) {
      setInputError('Enter a valid 4-digit postcode')
      return
    }
    const ok = setByPostcode(postcodeInput.trim())
    if (ok) setShowModal(false)
    else setInputError(`${postcodeInput} is not yet in our service area — try a nearby postcode`)
  }

  const sourceIcon = location.source === 'gps' ? '📍'
    : location.source === 'postcode' ? '🔍' : '📌'
  const sourceTip = location.source === 'gps' ? 'Detected by GPS'
    : location.source === 'postcode' ? 'Set manually'
    : 'Default — tap to set your location'

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#2D6A5E] transition-colors"
        >
          <span>{sourceIcon}</span>
          <span className="font-medium">{location.suburb} {location.postcode}</span>
          <span className="text-gray-400 text-xs">▾</span>
        </button>
        {showModal && (
          <LocationModal
            location={location}
            detecting={detecting}
            error={error}
            postcodeInput={postcodeInput}
            inputError={inputError}
            onPostcodeChange={v => { setPostcodeInput(v); setInputError('') }}
            onPostcodeSubmit={handlePostcodeSubmit}
            onDetectGPS={detectGPS}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${
        location.source === 'default'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-[#E8F3EE] border-[#C8E3D6]'
      }`}>
        <span className="text-xl">{sourceIcon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900">
              {location.suburb}, {location.state}
            </span>
            <span className="text-xs bg-white px-1.5 py-0.5 rounded-full border border-gray-200 text-gray-500">
              {location.postcode}
            </span>
            {location.source === 'gps' && (
              <span className="text-xs bg-[#2D6A5E] text-white px-1.5 py-0.5 rounded-full">GPS</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{sourceTip}</div>
          {error && <div className="text-xs text-amber-700 mt-0.5">{error}</div>}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {(location.source === 'default' || error) && (
            <button
              onClick={detectGPS}
              disabled={detecting}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-[#2D6A5E] text-white font-medium disabled:opacity-60 hover:bg-[#1A3F38] transition-colors"
            >
              {detecting ? '...' : 'Detect'}
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#2D6A5E] hover:text-[#2D6A5E] transition-colors bg-white"
          >
            Change
          </button>
        </div>
      </div>

      {showModal && (
        <LocationModal
          location={location}
          detecting={detecting}
          error={error}
          postcodeInput={postcodeInput}
          inputError={inputError}
          onPostcodeChange={v => { setPostcodeInput(v); setInputError('') }}
          onPostcodeSubmit={handlePostcodeSubmit}
          onDetectGPS={detectGPS}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

function LocationModal({ location, detecting, error, postcodeInput, inputError,
  onPostcodeChange, onPostcodeSubmit, onDetectGPS, onClose }: {
  location: LocationState
  detecting: boolean; error: string | null
  postcodeInput: string; inputError: string
  onPostcodeChange: (v: string) => void
  onPostcodeSubmit: () => void
  onDetectGPS: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[500] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold">Set your location</h3>
            <p className="text-xs text-gray-400 mt-0.5">We match you with care workers nearby</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Current location */}
        <div className="bg-[#E8F3EE] rounded-xl p-3 mb-4 flex items-center gap-2">
          <span>📍</span>
          <div>
            <div className="text-sm font-medium text-[#1A3F38]">{location.suburb} {location.postcode}</div>
            <div className="text-xs text-[#4A8C7D]">{location.state} · {
              location.source === 'gps' ? 'GPS detected' :
              location.source === 'postcode' ? 'Manually set' : 'Default'
            }</div>
          </div>
        </div>

        {/* GPS detect */}
        <button
          onClick={onDetectGPS}
          disabled={detecting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#C8E3D6] text-[#2D6A5E] font-medium text-sm hover:bg-[#E8F3EE] transition-colors disabled:opacity-60 mb-3"
        >
          {detecting
            ? <><span className="animate-spin">⌛</span> Detecting your location...</>
            : <><span>📡</span> Use my current GPS location</>
          }
        </button>
        {error && <p className="text-xs text-amber-700 mb-3 text-center">{error}</p>}

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or enter postcode</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Postcode entry */}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="e.g. 3102"
            value={postcodeInput}
            onChange={e => onPostcodeChange(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && onPostcodeSubmit()}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#2D6A5E] bg-gray-50"
            autoFocus
          />
          <button
            onClick={onPostcodeSubmit}
            className="px-4 py-2.5 bg-[#2D6A5E] text-white rounded-xl text-sm font-medium hover:bg-[#1A3F38] transition-colors"
          >
            Set
          </button>
        </div>
        {inputError && <p className="text-xs text-red-600 mb-2">{inputError}</p>}

        {/* Quick postcodes */}
        <div className="mt-3">
          <div className="text-xs text-gray-400 mb-2">Our service area — quick select:</div>
          <div className="flex flex-wrap gap-1.5">
            {VICTORIA_POSTCODES.slice(0, 8).map(p => (
              <button key={p.postcode}
                onClick={() => { onPostcodeChange(p.postcode); }}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  location.postcode === p.postcode
                    ? 'bg-[#2D6A5E] text-white border-[#2D6A5E]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#2D6A5E]'
                }`}>
                {p.postcode} {p.suburb}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
FILE_components_LocationDetector_tsx
echo '  ✅ components/LocationDetector.tsx'
mkdir -p components
cat > components/ProviderRegistration.tsx << 'FILE_components_ProviderRegistration_tsx'
'use client'

import { useState } from 'react'
import { useLocation } from './LocationDetector'
import { VICTORIA_POSTCODES } from '@/lib/location'

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

export default function ProviderRegistration({ onClose }: { onClose?: () => void }) {
  const { location } = useLocation()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
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
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    setDone(true)
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
FILE_components_ProviderRegistration_tsx
echo '  ✅ components/ProviderRegistration.tsx'
mkdir -p components
cat > components/CustomerRegistration.tsx << 'FILE_components_CustomerRegistration_tsx'
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
          ? `✅ ${FUNDING_OPTIONS.find(f => f.type === form.fundingType)?.label} funding noted — we'll apply your subsidy at checkout`
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
FILE_components_CustomerRegistration_tsx
echo '  ✅ components/CustomerRegistration.tsx'

echo "▶ Updating app/page.tsx..."
cat > app/page.tsx << 'PAGEOF'
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { isSupabaseConfigured } from '@/lib/supabase'
import { SERVICES_AU } from '@/lib/services'
import { useLocation } from '@/components/LocationDetector'
import LocationDetector from '@/components/LocationDetector'
import { providersNearPostcode } from '@/lib/matching'
import dynamic from 'next/dynamic'

const ProviderRegistration = dynamic(() => import('@/components/ProviderRegistration'), { ssr: false })
const CustomerRegistration  = dynamic(() => import('@/components/CustomerRegistration'),  { ssr: false })

export default function HomePage() {
  const { location } = useLocation()
  const [modal, setModal] = useState<'provider' | 'customer' | null>(null)
  const nearbyProviders = providersNearPostcode(location.postcode, 15)
  const topProviders    = nearbyProviders.slice(0, 3)

  return (
    <main className="min-h-screen bg-[#FBF7F2]">

      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-center text-xs text-amber-800">
          Demo mode — add Supabase credentials to .env.local for live data
        </div>
      )}

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#2D6A5E] flex items-center justify-center">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M12 21.7C5.8 17.4 2 13.5 2 9.5 2 6.4 4.4 4 7.5 4c1.7 0 3.4.8 4.5 2.1C13.1 4.8 14.8 4 16.5 4 19.6 4 22 6.4 22 9.5c0 4-3.8 7.9-10 12.2z"/>
              </svg>
            </div>
            <div>
              <div className="font-serif font-semibold text-lg leading-tight">SilverConnect</div>
              <div className="text-[9px] text-gray-400 tracking-widest uppercase">Care with Love</div>
            </div>
          </div>
          <div className="flex-1 max-w-xs">
            <LocationDetector compact onLocationChange={undefined} />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/services"   className="px-3 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-50 hidden md:block">Services</Link>
            <Link href="/providers"  className="px-3 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-50 hidden md:block">Providers</Link>
            <Link href="/agedcare"   className="px-3 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-50 hidden md:block">Aged Care</Link>
            <button onClick={() => setModal('provider')}
              className="px-3 py-2 rounded-full text-sm border border-gray-200 text-gray-700 hover:border-[#2D6A5E] hover:text-[#2D6A5E] hidden md:block">
              Join as provider
            </button>
            <button onClick={() => setModal('customer')}
              className="px-4 py-2 rounded-full bg-[#2D6A5E] text-white text-sm font-medium hover:bg-[#1A3F38]">
              Get care
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 pt-12 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full mb-5 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
            Trusted by 12,000+ seniors across 3 countries
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl font-semibold leading-tight mb-4">
            Care delivered with<br />
            <em className="italic text-amber-700">grace &amp; dignity</em>
          </h1>
          <p className="text-gray-500 leading-relaxed max-w-lg mb-4">
            Victoria&#39;s most trusted senior services platform. Book vetted,
            NDIS-registered care workers near <strong>{location.suburb}</strong> in minutes.
          </p>
          <blockquote className="border-l-2 border-amber-400 pl-3 font-serif italic text-sm text-gray-400 mb-5">
            &#34;Love one another as I have loved you.&#34; — John 15:12
          </blockquote>

          <div className="mb-5">
            <LocationDetector onLocationChange={undefined} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-lg">
            <div className="grid grid-cols-2">
              <button className="flex flex-col px-4 py-3 rounded-xl text-left hover:bg-gray-50">
                <span className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-0.5">Service type</span>
                <span className="text-sm text-gray-800">Home help &amp; cleaning</span>
              </button>
              <button className="flex flex-col px-4 py-3 rounded-xl text-left hover:bg-gray-50 border-l border-gray-100">
                <span className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-0.5">Location</span>
                <span className="text-sm text-gray-800 truncate">{location.suburb} {location.postcode}</span>
              </button>
            </div>
            <div className="border-t border-gray-100 mx-2 my-1" />
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs text-gray-400">
                <strong className="text-gray-600">{nearbyProviders.length} provider{nearbyProviders.length !== 1 ? 's' : ''}</strong> near {location.suburb}
              </span>
              <Link href="/booking"
                className="bg-[#2D6A5E] text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-[#1A3F38]">
                Find care
              </Link>
            </div>
          </div>

          <div className="flex gap-4 mt-4 flex-wrap">
            {['NDIS registered','Police checked','4.9/5 rating','My Aged Care accepted'].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-4 h-4 rounded-full bg-[#E8F3EE] flex items-center justify-center text-[#2D6A5E] text-[8px] font-bold">&#10003;</div>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-medium">
                Care workers near {location.suburb} {location.postcode}
              </div>
              <Link href="/providers" className="text-xs text-[#2D6A5E] font-medium">View all</Link>
            </div>
            {topProviders.length > 0 ? (
              <div className="space-y-2">
                {topProviders.map(({ provider: p, distanceKm: d, reasons }) => (
                  <div key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-[#E8F3EE] cursor-pointer transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#E8F3EE] flex items-center justify-center text-sm font-semibold text-[#2D6A5E] flex-shrink-0">
                      {p.avatarInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        {p.isChristian && <span className="text-xs">&#10013;&#65039;</span>}
                      </div>
                      <div className="text-xs text-gray-400">{p.role} · {d.toFixed(1)}km away</div>
                      <div className="text-xs text-[#4A8C7D]">{reasons[0]}</div>
                    </div>
                    <div className="text-xs font-medium text-amber-600">&#9733; {p.rating}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-4">
                No providers yet in {location.postcode} — recruiting now!
                <button onClick={() => setModal('provider')}
                  className="block mx-auto mt-2 text-xs text-[#2D6A5E] font-medium">
                  Become a provider
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#E8F3EE] rounded-2xl p-4 border border-[#C8E3D6]">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-medium text-[#1A3F38]">
                {location.suburb} {location.postcode} coverage
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                nearbyProviders.length >= 5
                  ? 'bg-[#2D6A5E] text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {nearbyProviders.length >= 5 ? 'Live' : 'Building'}
              </span>
            </div>
            <div className="text-sm text-[#2D6A5E] mb-2">
              {nearbyProviders.length} provider{nearbyProviders.length !== 1 ? 's' : ''} within 15km
              {nearbyProviders.length < 5 && ` · ${5 - nearbyProviders.length} more to go-live`}
            </div>
            <div className="h-1.5 bg-[#C8E3D6] rounded-full overflow-hidden">
              <div className="h-full bg-[#2D6A5E] rounded-full"
                style={{ width: `${Math.min(100, (nearbyProviders.length / 5) * 100)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setModal('customer')}
              className="flex flex-col items-start p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#2D6A5E] hover:shadow-md transition-all text-left">
              <span className="text-2xl mb-2">&#128116;</span>
              <div className="text-sm font-medium mb-1">Get care</div>
              <div className="text-xs text-gray-400 leading-relaxed">Register for senior care services</div>
            </button>
            <button onClick={() => setModal('provider')}
              className="flex flex-col items-start p-4 bg-amber-50 rounded-2xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all text-left">
              <span className="text-2xl mb-2">&#10013;&#65039;</span>
              <div className="text-sm font-medium mb-1 text-amber-900">Join as provider</div>
              <div className="text-xs text-amber-700 leading-relaxed">Christian carers prioritised</div>
            </button>
          </div>

          <div className="space-y-1.5">
            {[
              { c:'bg-green-400', msg:`Margaret T. booked cleaning in ${location.suburb}`, t:'2m', p:true },
              { c:'bg-blue-400',  msg:'Robert C. transport to RPA completed',                t:'5m', p:false },
              { c:'bg-amber-400', msg:'Grace C. accepted a new booking nearby',              t:'8m', p:false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-xl border border-gray-100 text-xs">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.c} ${item.p ? 'animate-pulse':''}`} />
                <span className="flex-1 text-gray-500">{item.msg}</span>
                <span className="text-gray-300">{item.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />
      <section className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="font-serif text-2xl font-semibold mb-1">Book in seconds</h2>
        <p className="text-gray-400 text-sm mb-5">
          {nearbyProviders.length > 0
            ? `${nearbyProviders.length} care workers available near ${location.suburb}`
            : 'Select a service to get started'}
        </p>
        <div className="grid grid-cols-5 gap-3">
          {[
            {ico:'&#127968;',name:'Home Help',    price:'From $35/hr'},
            {ico:'&#129330;',name:'Personal Care',price:'From $55/hr'},
            {ico:'&#128663;',name:'Transport',    price:'From $45/hr'},
            {ico:'&#127842;',name:'Meals',        price:'From $25/meal'},
            {ico:'&#128155;',name:'Companionship',price:'From $40/hr'},
          ].map(s => (
            <Link key={s.name} href="/booking"
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#2D6A5E] hover:shadow-md transition-all group text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-[#2D6A5E] flex items-center justify-center text-2xl transition-colors"
                dangerouslySetInnerHTML={{__html: s.ico}} />
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-[#2D6A5E] font-medium">{s.price}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="border-t border-gray-100" />
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-end mb-5">
          <div>
            <h2 className="font-serif text-2xl font-semibold">All services</h2>
            <p className="text-gray-400 text-sm mt-1">GST inclusive · HCP &amp; NDIS · {location.suburb}</p>
          </div>
          <Link href="/services" className="text-sm text-[#2D6A5E] font-medium">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SERVICES_AU.slice(0,4).map(s => (
            <Link key={s.id} href="/booking"
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="h-24 flex items-center justify-center text-4xl bg-gray-50">{s.icon}</div>
              <div className="p-3">
                <div className="font-medium text-sm mb-1">{s.name}</div>
                <div className="text-xs text-gray-400 mb-2 leading-relaxed">{s.description}</div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">${s.basePrice}<span className="text-xs text-gray-400 font-normal">/hr</span></span>
                  <span className="text-xs text-amber-600 font-medium">&#9733; {s.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#1A3F38] text-white py-14 mt-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center gap-8 flex-wrap">
          <div>
            <h2 className="font-serif text-3xl font-semibold mb-2">Begin with love today</h2>
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              Connecting seniors in {location.suburb} with compassionate, vetted care workers.
            </p>
            <blockquote className="font-serif italic text-xs text-white/40 border-l-2 border-white/20 pl-3 mt-3">
              &#34;Whatever you did for one of the least of these, you did for me.&#34; — Matthew 25:40
            </blockquote>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => setModal('customer')}
              className="px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm">
              Register for care
            </button>
            <button onClick={() => setModal('provider')}
              className="px-7 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white text-sm text-center">
              Join as a care provider
            </button>
          </div>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-[500] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            {modal === 'provider'
              ? <ProviderRegistration onClose={() => setModal(null)} />
              : <CustomerRegistration  onClose={() => setModal(null)} />
            }
          </div>
        </div>
      )}
    </main>
  )
}
PAGEOF
echo "  ✅ app/page.tsx"

echo "▶ Staging all changes..."
git add lib/location.ts lib/matching.ts \
  components/LocationDetector.tsx \
  components/ProviderRegistration.tsx \
  components/CustomerRegistration.tsx \
  app/page.tsx

echo "▶ Committing..."
git commit -m "feat: real GPS location detection + postcode matching + registration

- lib/location.ts: 18 Victoria postcodes, Haversine distance, GPS/postcode/default detection
- lib/matching.ts: score-based provider matching (distance, rating, Christian preference, NDIS)
- components/LocationDetector.tsx: real GPS with 3102 Kew East fallback, postcode entry, localStorage cache
- components/ProviderRegistration.tsx: 3-step provider signup with postcode, faith preference, police check
- components/CustomerRegistration.tsx: 3-step customer signup with location, services, HCP/NDIS funding
- app/page.tsx: live nearby provider count, location-aware hero, both registration modals

Location detection order: saved localStorage → GPS auto-detect → 3102 Kew East default

'Love one another as I have loved you.' — John 15:12" 2>/dev/null || echo "Nothing new to commit"

echo "▶ Pushing to GitHub..."
git push origin main

echo ""
echo "✅ PUSHED — starting dev server at http://localhost:3000"
npm run dev
