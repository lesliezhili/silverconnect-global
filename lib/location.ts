export interface LocationState {
  suburb: string
  postcode: string
  state: string
  country: string
  latitude: number | null
  longitude: number | null
  source: 'gps' | 'manual' | 'ip' | null
}

export const DEFAULT_LOCATION: LocationState = {
  suburb: 'Melbourne',
  postcode: '3000',
  state: 'VIC',
  country: 'Australia',
  latitude: null,
  longitude: null,
  source: null
}

export const VICTORIA_POSTCODES = [
  { postcode: '3000', suburb: 'Melbourne', state: 'VIC' },
  { postcode: '3002', suburb: 'East Melbourne', state: 'VIC' },
  { postcode: '3003', suburb: 'West Melbourne', state: 'VIC' },
  { postcode: '3004', suburb: 'St Kilda Road', state: 'VIC' },
  { postcode: '3006', suburb: 'Southbank', state: 'VIC' },
  { postcode: '3008', suburb: 'Docklands', state: 'VIC' },
  { postcode: '3010', suburb: 'North Melbourne', state: 'VIC' },
  { postcode: '3011', suburb: 'Footscray', state: 'VIC' },
  { postcode: '3012', suburb: 'West Footscray', state: 'VIC' },
  { postcode: '3013', suburb: 'Yarraville', state: 'VIC' },
  { postcode: '3015', suburb: 'Newport', state: 'VIC' },
  { postcode: '3016', suburb: 'Williamstown', state: 'VIC' },
  { postcode: '3018', suburb: 'Altona', state: 'VIC' },
  { postcode: '3020', suburb: 'Sunshine', state: 'VIC' },
  { postcode: '3021', suburb: 'St Albans', state: 'VIC' },
  { postcode: '3022', suburb: 'Deer Park', state: 'VIC' },
  { postcode: '3023', suburb: 'Caroline Springs', state: 'VIC' },
  { postcode: '3024', suburb: 'Wyndham Vale', state: 'VIC' },
  { postcode: '3025', suburb: 'Altona North', state: 'VIC' },
  { postcode: '3026', suburb: 'Laverton', state: 'VIC' },
  { postcode: '3027', suburb: 'Williams Landing', state: 'VIC' },
  { postcode: '3028', suburb: 'Seabrook', state: 'VIC' },
  { postcode: '3029', suburb: 'Point Cook', state: 'VIC' },
  { postcode: '3030', suburb: 'Werribee', state: 'VIC' },
  { postcode: '3031', suburb: 'Flemington', state: 'VIC' },
  { postcode: '3032', suburb: 'Ascot Vale', state: 'VIC' },
  { postcode: '3033', suburb: 'Kensington', state: 'VIC' },
  { postcode: '3034', suburb: 'Avondale Heights', state: 'VIC' },
  { postcode: '3036', suburb: 'Keilor', state: 'VIC' },
  { postcode: '3037', suburb: 'Sydenham', state: 'VIC' },
  { postcode: '3038', suburb: 'Keilor Downs', state: 'VIC' },
  { postcode: '3039', suburb: 'Moonee Ponds', state: 'VIC' },
  { postcode: '3040', suburb: 'Essendon', state: 'VIC' },
  { postcode: '3041', suburb: 'Strathmore', state: 'VIC' },
  { postcode: '3042', suburb: 'Keilor Park', state: 'VIC' },
  { postcode: '3043', suburb: 'Tullamarine', state: 'VIC' },
  { postcode: '3044', suburb: 'Pascoe Vale', state: 'VIC' },
  { postcode: '3046', suburb: 'Glenroy', state: 'VIC' },
  { postcode: '3047', suburb: 'Broadmeadows', state: 'VIC' },
  { postcode: '3048', suburb: 'Coolaroo', state: 'VIC' },
  { postcode: '3049', suburb: 'Attwood', state: 'VIC' },
  { postcode: '3050', suburb: 'Royal Melbourne Hospital', state: 'VIC' },
  { postcode: '3051', suburb: 'North Melbourne', state: 'VIC' },
  { postcode: '3052', suburb: 'Parkville', state: 'VIC' },
  { postcode: '3053', suburb: 'Carlton', state: 'VIC' },
  { postcode: '3054', suburb: 'Carlton North', state: 'VIC' },
  { postcode: '3055', suburb: 'Brunswick', state: 'VIC' },
  { postcode: '3056', suburb: 'Brunswick North', state: 'VIC' },
  { postcode: '3057', suburb: 'Brunswick East', state: 'VIC' },
  { postcode: '3058', suburb: 'Coburg', state: 'VIC' },
  { postcode: '3059', suburb: 'Coburg North', state: 'VIC' },
  { postcode: '3060', suburb: 'Fawkner', state: 'VIC' },
  { postcode: '3061', suburb: 'Campbellfield', state: 'VIC' },
  { postcode: '3062', suburb: 'Somerton', state: 'VIC' },
  { postcode: '3063', suburb: 'Oaklands Junction', state: 'VIC' }
]

export function findByPostcode(postcode: string) {
  return VICTORIA_POSTCODES.find(p => p.postcode === postcode)
}

export function findNearestPostcode(postcode: string) {
  const current = findByPostcode(postcode)
  if (!current) return VICTORIA_POSTCODES[0]
  return current
}

export function locationFromPostcodeInfo(postcodeInfo: { postcode: string; suburb: string; state: string }) {
  return {
    suburb: postcodeInfo.suburb,
    postcode: postcodeInfo.postcode,
    state: postcodeInfo.state,
    country: 'Australia',
    latitude: null,
    longitude: null,
    source: 'manual' as const
  }
}

export function getLocationFromPostcode(postcode: string): LocationState | null {
  const info = findByPostcode(postcode)
  if (!info) return null
  
  return {
    suburb: info.suburb,
    postcode: info.postcode,
    state: info.state,
    country: 'Australia',
    latitude: null,
    longitude: null,
    source: 'manual'
  }
}

export function isValidPostcode(postcode: string): boolean {
  const postcodeRegex = /^[0-9]{4}$/
  if (!postcodeRegex.test(postcode)) return false
  const postcodeNum = parseInt(postcode, 10)
  return postcodeNum >= 200 && postcodeNum <= 9999
}