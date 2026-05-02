'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Country {
  code: string
  name: string
  name_zh: string
  flag: string
  currency: string
  symbol: string
}

// Fallback countries data if database fails
const FALLBACK_COUNTRIES: Country[] = [
  { code: 'AU', name: 'Australia', name_zh: '澳大利亚', flag: '🇦🇺', currency: 'AUD', symbol: '$' },
  { code: 'CA', name: 'Canada', name_zh: '加拿大', flag: '🇨🇦', currency: 'CAD', symbol: '$' },
  { code: 'US', name: 'United States', name_zh: '美国', flag: '🇺🇸', currency: 'USD', symbol: '$' },
  { code: 'CN', name: 'China', name_zh: '中国', flag: '🇨🇳', currency: 'CNY', symbol: '¥' }
]

interface CountrySelectorProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export default function CountrySelector({ value = 'AU', onChange, className = '' }: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES)
  const [loading, setLoading] = useState(true)
  const [selectedValue, setSelectedValue] = useState(value)

  useEffect(() => {
    fetchCountries()
  }, [])

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('code, name, currency_code, currency_symbol')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching countries:', error)
        setCountries(FALLBACK_COUNTRIES)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        // Map database countries to include flags
        const mappedCountries: Country[] = data.map(country => {
          let flag = '🌏'
          let name_zh = country.name
          if (country.code === 'AU') {
            flag = '🇦🇺'
            name_zh = '澳大利亚'
          } else if (country.code === 'CA') {
            flag = '🇨🇦'
            name_zh = '加拿大'
          } else if (country.code === 'US') {
            flag = '🇺🇸'
            name_zh = '美国'
          } else if (country.code === 'CN') {
            flag = '🇨🇳'
            name_zh = '中国'
          }
          
          return {
            code: country.code,
            name: country.name,
            name_zh: name_zh,
            flag: flag,
            currency: country.currency_code,
            symbol: country.currency_symbol
          }
        })
        setCountries(mappedCountries)
      } else {
        setCountries(FALLBACK_COUNTRIES)
      }
    } catch (err) {
      console.error('Error in fetchCountries:', err)
      setCountries(FALLBACK_COUNTRIES)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    setSelectedValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  if (loading) {
    return (
      <select className={`px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm ${className}`} disabled>
        <option>Loading...</option>
      </select>
    )
  }

  // Ensure countries is always an array before mapping
  const countriesList = Array.isArray(countries) ? countries : FALLBACK_COUNTRIES

  return (
    <select
      value={selectedValue}
      onChange={handleChange}
      className={`px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
    >
      {countriesList.map((country) => (
        <option key={country.code} value={country.code}>
          {country.flag} {country.name}
        </option>
      ))}
    </select>
  )
}