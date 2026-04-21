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
