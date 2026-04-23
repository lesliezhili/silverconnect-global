'use client';

import { useState } from 'react';
import { Clock, Star, MapPin, Shield, BookOpen } from 'lucide-react';
import { translations, Language } from '@/lib/translations';

interface ServiceCardProps {
  service: any;
  price: any;
  country: any;
  onBook: (service: any) => void;
  user: any;
  language?: Language;
}

function getTranslation(language: Language, key: string) {
  return (translations[language] as any)[key] || key;
}

export default function ServiceCard({ service, price, country, onBook, user, language = 'en' }: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const t = (key: string) => getTranslation(language, key);

  if (!price) {
    // Show service with "Contact for pricing" if no price available
    return (
      <div
        className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 opacity-75"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="h-48 bg-gradient-to-r from-gray-400 to-gray-500 relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-gray-700">
            {service.category}
          </div>
          {service.duration_minutes && (
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {service.duration_minutes} min
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-600">
                {t('priceOnRequest')}
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-4 line-clamp-3">{service.description}</p>

          <button
            onClick={() => onBook(service)}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition font-medium"
          >
            {t('contactForPricing')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-green-700">
          {service.category}
        </div>
        {service.duration_minutes && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {service.duration_minutes} min
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
          <div className="text-right">
            <span className="text-2xl font-bold text-green-600">
              {country.symbol}{price.price_with_tax}
            </span>
            <span className="text-xs text-gray-500 block">{country.currency}</span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4 text-sm line-clamp-2">
          {service.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span>4.9 (1,234 reviews)</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Shield className="w-3 h-3" />
            <span>Insured</span>
          </div>
        </div>
        
        <button
          onClick={() => {
            if (!user) {
              alert(t('signInRequired'));
              return;
            }
            onBook(service);
          }}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          {t('bookNow')}
        </button>
        
        <div className="mt-3 text-xs text-center text-gray-400">
          {t('freeCancellationSupport')}
        </div>
      </div>
    </div>
  );
}
