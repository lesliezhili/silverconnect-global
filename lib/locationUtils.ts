// Haversine formula to calculate distance between two coordinates
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Get user's current location
export const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Australian suburbs with their coordinates and postcodes
const AUSTRALIAN_SUBURBS = [
  // Melbourne, VIC
  { name: 'Melbourne', state: 'VIC', postcode: '3000', lat: -37.8136, lon: 144.9631, radius: 3 },
  { name: 'Brunswick', state: 'VIC', postcode: '3056', lat: -37.7579, lon: 144.9615, radius: 2 },
  { name: 'Fitzroy', state: 'VIC', postcode: '3065', lat: -37.8001, lon: 144.9824, radius: 1.5 },
  { name: 'Collingwood', state: 'VIC', postcode: '3066', lat: -37.8155, lon: 145.0033, radius: 1.5 },
  { name: 'Hawthorn', state: 'VIC', postcode: '3122', lat: -37.8242, lon: 145.0486, radius: 2 },
  { name: 'Balwyn', state: 'VIC', postcode: '3103', lat: -37.8202, lon: 145.1074, radius: 2 },
  { name: 'Box Hill', state: 'VIC', postcode: '3128', lat: -37.8306, lon: 145.1299, radius: 2 },
  { name: 'Camberwell', state: 'VIC', postcode: '3124', lat: -37.8342, lon: 145.0761, radius: 2 },
  { name: 'Canterbury', state: 'VIC', postcode: '3126', lat: -37.8407, lon: 145.1058, radius: 2 },
  { name: 'Glen Waverley', state: 'VIC', postcode: '3150', lat: -37.8875, lon: 145.1649, radius: 2 },
  { name: 'Oakleigh', state: 'VIC', postcode: '3166', lat: -37.9030, lon: 145.0889, radius: 1.5 },
  { name: 'Moorabbin', state: 'VIC', postcode: '3189', lat: -37.9457, lon: 145.0836, radius: 1.5 },
  { name: 'Southbank', state: 'VIC', postcode: '3006', lat: -37.8242, lon: 144.9736, radius: 1.5 },
  { name: 'South Yarra', state: 'VIC', postcode: '3141', lat: -37.8394, lon: 144.9878, radius: 2 },
  { name: 'Toorak', state: 'VIC', postcode: '3142', lat: -37.8521, lon: 144.9885, radius: 2 },
  { name: 'Prahran', state: 'VIC', postcode: '3181', lat: -37.8596, lon: 145.0024, radius: 1.5 },
  { name: 'Thornbury', state: 'VIC', postcode: '3071', lat: -37.7706, lon: 145.0305, radius: 2 },
  { name: 'Northcote', state: 'VIC', postcode: '3070', lat: -37.7662, lon: 145.0158, radius: 1.5 },
  { name: 'Coburg', state: 'VIC', postcode: '3058', lat: -37.7382, lon: 144.9761, radius: 2 },
  { name: 'Preston', state: 'VIC', postcode: '3072', lat: -37.7509, lon: 145.0122, radius: 2 },
  { name: 'Kew East', state: 'VIC', postcode: '3102', lat: -37.8294, lon: 145.0929, radius: 1.5 },
  // Sydney, NSW (backup)
  { name: 'Sydney', state: 'NSW', postcode: '2000', lat: -33.8688, lon: 151.2093, radius: 3 },
  // Brisbane, QLD (backup)
  { name: 'Brisbane', state: 'QLD', postcode: '4000', lat: -27.4705, lon: 153.0260, radius: 3 },
];

export interface SuburbLocation {
  name: string;
  state: string;
  postcode: string;
}

// Get suburb, state, and postcode from coordinates
export const getSuburbFromCoordinates = (
  latitude: number,
  longitude: number
): SuburbLocation | null => {
  for (const suburb of AUSTRALIAN_SUBURBS) {
    const distance = calculateDistance(
      latitude,
      longitude,
      suburb.lat,
      suburb.lon
    );
    if (distance <= suburb.radius) {
      return {
        name: suburb.name,
        state: suburb.state,
        postcode: suburb.postcode,
      };
    }
  }
  return null;
};

// Filter providers within 1km radius
export const filterProvidersByDistance = (
  providers: any[],
  userLat: number,
  userLon: number,
  radiusKm: number = 1
): any[] => {
  return providers.filter((provider) => {
    if (!provider.latitude || !provider.longitude) return false;
    const distance = calculateDistance(
      userLat,
      userLon,
      provider.latitude,
      provider.longitude
    );
    return distance <= radiusKm;
  });
};

// Detect country from latitude and longitude using regional bounds.
export const getCountryCodeFromCoordinates = (
  latitude: number,
  longitude: number
): 'AU' | 'CN' | 'CA' | null => {
  if (latitude >= -45 && latitude <= 0 && longitude >= 110 && longitude <= 160) {
    return 'AU';
  }
  if (latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135) {
    return 'CN';
  }
  if (latitude >= 41 && latitude <= 83 && longitude >= -141 && longitude <= -52) {
    return 'CA';
  }
  return null;
};

// Sort providers by rating or distance
export const sortProviders = (
  providers: any[],
  sortBy: 'rating' | 'distance' | 'specialty' = 'rating',
  userLat?: number,
  userLon?: number
): any[] => {
  const sorted = [...providers];

  if (sortBy === 'rating') {
    return sorted.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'distance' && userLat && userLon) {
    return sorted.sort((a, b) => {
      const distA = calculateDistance(userLat, userLon, a.latitude, a.longitude);
      const distB = calculateDistance(userLat, userLon, b.latitude, b.longitude);
      return distA - distB;
    });
  } else if (sortBy === 'specialty') {
    // Could sort by number of specialties or years of experience
    return sorted.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
  }

  return sorted;
};
