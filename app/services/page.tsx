// app/services/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Clock, Shield, Heart, Home, Wrench, ShoppingBag, Users, Coffee, Truck } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import { translations, Language } from '@/lib/translations';

interface Service {
  id: string;
  nameKey: string;
  descKey: string;
  categoryKey: string;
  duration: string;
  priceRange: string;
  popular: boolean;
  icon: React.JSX.Element;
  featuresKey: string;
}

const services: Service[] = [
  {
    id: '1',
    nameKey: 'personalCare',
    descKey: 'personalCareDesc',
    categoryKey: 'healthWellbeing',
    duration: '30-60 min',
    priceRange: '$45-65',
    popular: true,
    icon: <Heart className="w-8 h-8" />,
    featuresKey: 'personalCareFeatures'
  },
  {
    id: '2',
    nameKey: 'homeCleaning',
    descKey: 'homeCleaningDesc',
    categoryKey: 'household',
    duration: '1-3 hours',
    priceRange: '$35-55',
    popular: true,
    icon: <Home className="w-8 h-8" />,
    featuresKey: 'homeCleaningFeatures'
  },
  {
    id: '3',
    nameKey: 'homeMaintenance',
    descKey: 'homeMaintenanceDesc',
    categoryKey: 'household',
    duration: '1-2 hours',
    priceRange: '$55-80',
    popular: false,
    icon: <Wrench className="w-8 h-8" />,
    featuresKey: 'homeMaintenanceFeatures'
  },
  {
    id: '4',
    nameKey: 'shoppingAssistance',
    descKey: 'shoppingAssistanceDesc',
    categoryKey: 'dailyLiving',
    duration: '1-2 hours',
    priceRange: '$30-45',
    popular: true,
    icon: <ShoppingBag className="w-8 h-8" />,
    featuresKey: 'shoppingAssistanceFeatures'
  },
  {
    id: '5',
    nameKey: 'companionship',
    descKey: 'companionshipDesc',
    categoryKey: 'socialSupport',
    duration: '1-3 hours',
    priceRange: '$30-40',
    popular: true,
    icon: <Users className="w-8 h-8" />,
    featuresKey: 'companionshipFeatures'
  },
  {
    id: '6',
    nameKey: 'mealPreparation',
    descKey: 'mealPreparationDesc',
    categoryKey: 'dailyLiving',
    duration: '1-2 hours',
    priceRange: '$40-60',
    popular: true,
    icon: <Coffee className="w-8 h-8" />,
    featuresKey: 'mealPreparationFeatures'
  },
  {
    id: '7',
    nameKey: 'transportServices',
    descKey: 'transportServicesDesc',
    categoryKey: 'mobility',
    duration: '1-4 hours',
    priceRange: '$35-50',
    popular: false,
    icon: <Truck className="w-8 h-8" />,
    featuresKey: 'transportServicesFeatures'
  },
  {
    id: '8',
    nameKey: 'nursingCare',
    descKey: 'nursingCareDesc',
    categoryKey: 'healthWellbeing',
    duration: '30-60 min',
    priceRange: '$70-95',
    popular: false,
    icon: <Heart className="w-8 h-8" />,
    featuresKey: 'nursingCareFeatures'
  }
];

const getCategoryLabel = (key: string, lang: Language): string => {
  const t = translations[lang] as any;
  return t[key] || key;
};

const getServiceName = (key: string, lang: Language): string => {
  const t = translations[lang] as any;
  return t[key] || key;
};

const getServiceDesc = (key: string, lang: Language): string => {
  const t = translations[lang] as any;
  return t[key] || key;
};

const getServiceFeatures = (key: string, lang: Language): string[] => {
  const t = translations[lang] as any;
  return t[key] || [];
};

export default function ServicesPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') as Language | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Sync language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedLanguage', language);
  }, [language]);

  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  // Get categories based on language
  const categories = [
    { key: 'All', label: t('allServices') },
    { key: 'healthWellbeing', label: getCategoryLabel('healthWellbeing', language) },
    { key: 'household', label: getCategoryLabel('household', language) },
    { key: 'dailyLiving', label: getCategoryLabel('dailyLiving', language) },
    { key: 'socialSupport', label: getCategoryLabel('socialSupport', language) },
    { key: 'mobility', label: getCategoryLabel('mobility', language) }
  ];

  const filteredServices = services.filter(service => {
    const serviceName = getServiceName(service.nameKey, language).toLowerCase();
    const serviceDesc = getServiceDesc(service.descKey, language).toLowerCase();
    const matchesSearch = serviceName.includes(searchTerm.toLowerCase()) ||
                          serviceDesc.includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.categoryKey === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-end mb-4">
            <LanguageSelector 
              language={language} 
              onLanguageChange={setLanguage}
              compact
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('ourServices')}</h1>
            <p className="text-xl md:text-2xl mb-8">{t('servicesSubtitle')}</p>
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchServices')}
                className="w-full pl-12 pr-4 py-4 text-gray-800 rounded-lg text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map(category => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`px-6 py-2 rounded-full text-lg transition ${
                selectedCategory === category.key
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-green-600">
                    {service.icon}
                  </div>
                  {service.popular && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {t('popular')}
                    </span>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{getServiceName(service.nameKey, language)}</h3>
                <p className="text-gray-600 mb-4">{getServiceDesc(service.descKey, language)}</p>
                
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.duration}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Shield className="w-4 h-4 mr-1" />
                    {t('insuredProviders')}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold text-green-600">{service.priceRange}<span className="text-sm text-gray-500">{t('perHour')}</span></p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t('whatsIncluded')}</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {getServiceFeatures(service.featuresKey, language).slice(0, 2).map((feature, idx) => (
                      <li key={`${service.id}-${idx}`} className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> {feature}
                      </li>
                    ))}
                    {getServiceFeatures(service.featuresKey, language).length > 2 && (
                      <li key={`${service.id}-more`} className="text-gray-500">+ {getServiceFeatures(service.featuresKey, language).length - 2} more</li>
                    )}
                  </ul>
                </div>

                <Link href={`/services/${service.id}`}>
                  <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold">
                    {t('bookThisService')}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('noServicesFound')}</p>
          </div>
        )}

        {/* Funding Information */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('governmentFunding')}</h3>
          <p className="text-gray-700 mb-4">
            {t('fundingDescription')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-blue-700">{t('homeCarePackage')}</h4>
              <p className="text-sm text-gray-600">{t('homeCareLevels')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-blue-700">{t('chsp')}</h4>
              <p className="text-sm text-gray-600">{t('chspDescription')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-blue-700">{t('dva')}</h4>
              <p className="text-sm text-gray-600">{t('dvaDescription')}</p>
            </div>
          </div>
          <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            {t('checkEligibility')}
          </button>
        </div>
      </div>
    </div>
  );
}