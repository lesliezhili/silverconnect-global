// Multi-country postcode registry
export interface PostcodeInfo {
  postcode: string
  suburb: string
  state: string
  country: string
  lat: number
  lng: number
  region: string
  goLiveThreshold: number
}

export const VICTORIA_POSTCODES: PostcodeInfo[] = [
  { postcode: '3102', suburb: 'Kew East',          state: 'VIC', country: 'AU', lat: -37.8040, lng: 145.0513, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3101', suburb: 'Kew',               state: 'VIC', country: 'AU', lat: -37.8006, lng: 145.0320, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3103', suburb: 'Balwyn',             state: 'VIC', country: 'AU', lat: -37.8067, lng: 145.0843, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3104', suburb: 'Balwyn North',       state: 'VIC', country: 'AU', lat: -37.7906, lng: 145.0888, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3122', suburb: 'Hawthorn',           state: 'VIC', country: 'AU', lat: -37.8222, lng: 145.0362, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3123', suburb: 'Auburn',             state: 'VIC', country: 'AU', lat: -37.8293, lng: 145.0510, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3124', suburb: 'Camberwell',         state: 'VIC', country: 'AU', lat: -37.8363, lng: 145.0600, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3125', suburb: 'Burwood',            state: 'VIC', country: 'AU', lat: -37.8485, lng: 145.1058, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3126', suburb: 'Canterbury',         state: 'VIC', country: 'AU', lat: -37.8234, lng: 145.0730, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3127', suburb: 'Box Hill South',     state: 'VIC', country: 'AU', lat: -37.8200, lng: 145.1260, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3128', suburb: 'Box Hill',           state: 'VIC', country: 'AU', lat: -37.8197, lng: 145.1200, region: 'Inner East', goLiveThreshold: 5 },
  { postcode: '3130', suburb: 'Nunawading',         state: 'VIC', country: 'AU', lat: -37.8175, lng: 145.1760, region: 'East',       goLiveThreshold: 5 },
  { postcode: '3131', suburb: 'Ringwood',           state: 'VIC', country: 'AU', lat: -37.8114, lng: 145.2270, region: 'East',       goLiveThreshold: 5 },
  { postcode: '3132', suburb: 'Mitcham',            state: 'VIC', country: 'AU', lat: -37.8200, lng: 145.1950, region: 'East',       goLiveThreshold: 5 },
  { postcode: '3068', suburb: 'Clifton Hill',       state: 'VIC', country: 'AU', lat: -37.7880, lng: 144.9940, region: 'Inner North', goLiveThreshold: 5 },
  { postcode: '3065', suburb: 'Fitzroy',            state: 'VIC', country: 'AU', lat: -37.7995, lng: 144.9790, region: 'Inner North', goLiveThreshold: 5 },
  { postcode: '3000', suburb: 'Melbourne CBD',      state: 'VIC', country: 'AU', lat: -37.8136, lng: 144.9631, region: 'CBD',        goLiveThreshold: 5 },
  { postcode: '3121', suburb: 'Richmond',           state: 'VIC', country: 'AU', lat: -37.8248, lng: 144.9999, region: 'Inner East', goLiveThreshold: 5 },
]

export const DEFAULT_LOCATION: PostcodeInfo = VICTORIA_POSTCODES[0] // 3102 Kew East

// Canadian postcodes (sample major cities)
export const CANADA_POSTCODES: PostcodeInfo[] = [
  // Toronto, ON
  { postcode: 'M5A', suburb: 'Downtown Toronto',    state: 'ON', country: 'CA', lat: 43.6532, lng: -79.3832, region: 'Downtown', goLiveThreshold: 5 },
  { postcode: 'M4E', suburb: 'The Beaches',         state: 'ON', country: 'CA', lat: 43.6715, lng: -79.2939, region: 'East End', goLiveThreshold: 5 },
  { postcode: 'M6G', suburb: 'Kensington Market',   state: 'ON', country: 'CA', lat: 43.6544, lng: -79.4007, region: 'Downtown', goLiveThreshold: 5 },
  { postcode: 'M5R', suburb: 'Yorkville',           state: 'ON', country: 'CA', lat: 43.6714, lng: -79.3948, region: 'Midtown', goLiveThreshold: 5 },
  { postcode: 'M4N', suburb: 'North York',          state: 'ON', country: 'CA', lat: 43.7615, lng: -79.4111, region: 'North York', goLiveThreshold: 5 },
  { postcode: 'M1P', suburb: 'Scarborough',         state: 'ON', country: 'CA', lat: 43.7764, lng: -79.2585, region: 'Scarborough', goLiveThreshold: 5 },
  { postcode: 'M9V', suburb: 'Etobicoke',           state: 'ON', country: 'CA', lat: 43.6435, lng: -79.5655, region: 'Etobicoke', goLiveThreshold: 5 },
  { postcode: 'M8V', suburb: 'Mississauga',        state: 'ON', country: 'CA', lat: 43.5890, lng: -79.6441, region: 'Mississauga', goLiveThreshold: 5 },

  // Vancouver, BC
  { postcode: 'V6B', suburb: 'Yaletown',            state: 'BC', country: 'CA', lat: 49.2827, lng: -123.1207, region: 'Downtown', goLiveThreshold: 5 },
  { postcode: 'V5N', suburb: 'Kitsilano',           state: 'BC', country: 'CA', lat: 49.2694, lng: -123.1553, region: 'West Side', goLiveThreshold: 5 },
  { postcode: 'V6E', suburb: 'West End',            state: 'BC', country: 'CA', lat: 49.2841, lng: -123.1319, region: 'Downtown', goLiveThreshold: 5 },
  { postcode: 'V7V', suburb: 'Richmond',            state: 'BC', country: 'CA', lat: 49.1666, lng: -123.1368, region: 'South', goLiveThreshold: 5 },

  // Montreal, QC
  { postcode: 'H2X', suburb: 'Le Plateau',          state: 'QC', country: 'CA', lat: 45.5183, lng: -73.5691, region: 'Plateau', goLiveThreshold: 5 },
  { postcode: 'H3A', suburb: 'Downtown Montreal',   state: 'QC', country: 'CA', lat: 45.5045, lng: -73.5747, region: 'Downtown', goLiveThreshold: 5 },
  { postcode: 'H4A', suburb: 'NDG',                 state: 'QC', country: 'CA', lat: 45.4687, lng: -73.6233, region: 'West Island', goLiveThreshold: 5 },
]

// Chinese postcodes (sample major cities)
export const CHINA_POSTCODES: PostcodeInfo[] = [
  // Shanghai
  { postcode: '200000', suburb: 'Huangpu District',     state: 'SH', country: 'CN', lat: 31.2304, lng: 121.4737, region: 'Central', goLiveThreshold: 5 },
  { postcode: '200001', suburb: 'Bund Area',            state: 'SH', country: 'CN', lat: 31.2380, lng: 121.4910, region: 'Central', goLiveThreshold: 5 },
  { postcode: '200030', suburb: 'Jing\'an District',    state: 'SH', country: 'CN', lat: 31.2290, lng: 121.4480, region: 'Central', goLiveThreshold: 5 },
  { postcode: '200040', suburb: 'Hongkou District',     state: 'SH', country: 'CN', lat: 31.2500, lng: 121.5000, region: 'North', goLiveThreshold: 5 },
  { postcode: '200080', suburb: 'Yangpu District',      state: 'SH', country: 'CN', lat: 31.2700, lng: 121.5300, region: 'North', goLiveThreshold: 5 },
  { postcode: '201100', suburb: 'Minhang District',     state: 'SH', country: 'CN', lat: 31.1200, lng: 121.3800, region: 'Southwest', goLiveThreshold: 5 },
  { postcode: '201200', suburb: 'Pudong New Area',      state: 'SH', country: 'CN', lat: 31.2200, lng: 121.5400, region: 'East', goLiveThreshold: 5 },

  // Beijing
  { postcode: '100000', suburb: 'Dongcheng District',   state: 'BJ', country: 'CN', lat: 39.9042, lng: 116.4074, region: 'Central', goLiveThreshold: 5 },
  { postcode: '100010', suburb: 'Xicheng District',     state: 'BJ', country: 'CN', lat: 39.9123, lng: 116.3669, region: 'Central', goLiveThreshold: 5 },
  { postcode: '100020', suburb: 'Chaoyang District',    state: 'BJ', country: 'CN', lat: 39.9215, lng: 116.4433, region: 'East', goLiveThreshold: 5 },
  { postcode: '100030', suburb: 'Haidian District',     state: 'BJ', country: 'CN', lat: 39.9599, lng: 116.2981, region: 'West', goLiveThreshold: 5 },
  { postcode: '100050', suburb: 'Fengtai District',     state: 'BJ', country: 'CN', lat: 39.8584, lng: 116.2871, region: 'Southwest', goLiveThreshold: 5 },

  // Guangzhou
  { postcode: '510000', suburb: 'Tianhe District',      state: 'GD', country: 'CN', lat: 23.1291, lng: 113.2644, region: 'Central', goLiveThreshold: 5 },
  { postcode: '510080', suburb: 'Panyu District',       state: 'GD', country: 'CN', lat: 23.0000, lng: 113.3500, region: 'South', goLiveThreshold: 5 },
  { postcode: '510100', suburb: 'Huadu District',       state: 'GD', country: 'CN', lat: 23.4000, lng: 113.2200, region: 'North', goLiveThreshold: 5 },
]

// Combined postcodes for all countries
export const ALL_POSTCODES = [
  ...VICTORIA_POSTCODES,
  ...CANADA_POSTCODES,
  ...CHINA_POSTCODES
]

export function findByPostcode(postcode: string): PostcodeInfo | undefined {
  return ALL_POSTCODES.find(p => p.postcode === postcode)
}

export function findNearestPostcode(lat: number, lng: number): PostcodeInfo {
  let nearest = DEFAULT_LOCATION
  let minDist = Infinity
  for (const p of ALL_POSTCODES) {
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
