'use client';

import { Star, MapPin, Award } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { calculateDistance } from '@/lib/locationUtils';

interface Provider {
  id: string;
  full_name: string;
  profile_image?: string;
  bio: string;
  rating: number;
  total_ratings: number;
  years_experience: number;
  specialties: string[];
  latitude: number;
  longitude: number;
  city: string;
}

interface ProviderCardProps {
  readonly provider: Provider;
  readonly userLat: number;
  readonly userLon: number;
  readonly language: Language;
  readonly onBook: (provider: Provider) => void;
}

export default function ProviderCard({
  provider,
  userLat,
  userLon,
  language,
  onBook,
}: ProviderCardProps) {
  const distance = calculateDistance(userLat, userLon, provider.latitude, provider.longitude);
  const t = translations[language];
  
  // Get translated provider name if available
  const getProviderName = (name: string): string => {
    if (language === 'zh' && (t as any).providerNames?.[name]) {
      return (t as any).providerNames[name];
    }
    return name;
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition bg-white">
      {/* Provider Avatar */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {provider.profile_image ? (
            <img
              src={provider.profile_image}
              alt={provider.full_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
              {provider.full_name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg">{getProviderName(provider.full_name)}</h3>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star size={16} fill="currentColor" />
              <span className="font-semibold">{provider.rating.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">({provider.total_ratings})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distance and Location */}
      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
        <MapPin size={16} />
        <span>
          {distance.toFixed(2)} {t.kmAway || 'km away'} • {provider.city}
        </span>
      </div>

      {/* Experience */}
      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
        <Award size={16} />
        <span>{provider.years_experience} {t.yearsExperience || 'years experience'}</span>
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{provider.bio}</p>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1 mb-4">
        {provider.specialties?.slice(0, 3).map((specialty: string, idx: number) => (
          <span key={`${specialty}-${idx}`} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {specialty}
          </span>
        ))}
        {provider.specialties?.length > 3 && (
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
            +{provider.specialties.length - 3}
          </span>
        )}
      </div>

      {/* Book Button */}
      <button
        onClick={() => onBook(provider)}
        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
      >
        {t.bookNow || 'Book Now'}
      </button>
    </div>
  );
}
