// app/providers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Phone, Mail, CheckCircle } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  postcode: string;
  distance: string;
  verified: boolean;
  phone: string;
  email: string;
  services: string[];
  languages: string[];
  availability: string;
  priceRange: string;
  avatar: string;
}

// Mock provider data (replace with Supabase later)
const mockProviders: Provider[] = [
  {
    id: '1',
    name: 'Golden Care Services',
    category: 'Aged Care Specialist',
    rating: 4.9,
    reviews: 127,
    postcode: '3000',
    distance: '0.8 km',
    verified: true,
    phone: '0400 123 456',
    email: 'info@goldencare.com.au',
    services: ['Personal Care', 'Cleaning', 'Companionship'],
    languages: ['English', 'Mandarin'],
    availability: 'Available today',
    priceRange: '$45-65/hr',
    avatar: '👵'
  },
  {
    id: '2',
    name: 'Helping Hands Senior Care',
    category: 'Home Care Provider',
    rating: 4.8,
    reviews: 94,
    postcode: '3001',
    distance: '1.2 km',
    verified: true,
    phone: '0400 234 567',
    email: 'hello@helpinghands.com.au',
    services: ['Nursing', 'Personal Care', 'Meal Prep'],
    languages: ['English', 'Italian'],
    availability: 'Available tomorrow',
    priceRange: '$50-70/hr',
    avatar: '🤝'
  },
  {
    id: '3',
    name: 'Compassionate Companions',
    category: 'Social Support',
    rating: 4.7,
    reviews: 63,
    postcode: '3002',
    distance: '2.1 km',
    verified: true,
    phone: '0400 345 678',
    email: 'care@compassionate.com.au',
    services: ['Companionship', 'Shopping', 'Transport'],
    languages: ['English', 'Greek'],
    availability: 'Available today',
    priceRange: '$35-50/hr',
    avatar: '💕'
  },
  {
    id: '4',
    name: 'Reliable Home Maintenance',
    category: 'Home Repairs',
    rating: 4.6,
    reviews: 42,
    postcode: '3003',
    distance: '3.0 km',
    verified: false,
    phone: '0400 456 789',
    email: 'repairs@reliable.com.au',
    services: ['Maintenance', 'Gardening', 'Handyman'],
    languages: ['English'],
    availability: 'Available in 2 days',
    priceRange: '$55-80/hr',
    avatar: '🔧'
  },
  {
    id: '5',
    name: 'Nursing Care Plus',
    category: 'Medical Care',
    rating: 5.0,
    reviews: 38,
    postcode: '3004',
    distance: '3.5 km',
    verified: true,
    phone: '0400 567 890',
    email: 'nurses@nursingcare.com.au',
    services: ['Nursing', 'Medication Management', 'Physiotherapy'],
    languages: ['English', 'Vietnamese'],
    availability: 'Limited availability',
    priceRange: '$70-95/hr',
    avatar: '🏥'
  },
  {
    id: '6',
    name: 'Happy Seniors Transport',
    category: 'Transport Services',
    rating: 4.8,
    reviews: 56,
    postcode: '3005',
    distance: '4.2 km',
    verified: true,
    phone: '0400 678 901',
    email: 'rides@happyseniors.com.au',
    services: ['Transport', 'Medical Appointments', 'Shopping Trips'],
    languages: ['English', 'Hindi'],
    availability: 'Available today',
    priceRange: '$30-45/hr',
    avatar: '🚗'
  }
];

export default function ProvidersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [userPostcode, setUserPostcode] = useState('3000');

  // Get user's location on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In production, reverse geocode to get postcode
          setUserPostcode('3000');
        },
        () => {
          setUserPostcode('3000');
        }
      );
    }
  }, []);

  const filteredProviders = mockProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          provider.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesService = selectedService === 'all' || provider.services.some(s => s.toLowerCase().includes(selectedService.toLowerCase()));
    const matchesLanguage = selectedLanguage === 'all' || provider.languages.includes(selectedLanguage);
    return matchesSearch && matchesService && matchesLanguage;
  });

  const allServices = Array.from(new Set(mockProviders.flatMap(p => p.services)));
  const allLanguages = Array.from(new Set(mockProviders.flatMap(p => p.languages)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Find Care Providers Near You</h1>
          <p className="text-xl">Verified, trusted providers ready to help seniors in your area</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or service..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="w-full px-4 py-3 border rounded-lg text-lg"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="all">All Services</option>
              {allServices.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>

            <select
              className="w-full px-4 py-3 border rounded-lg text-lg"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="all">All Languages</option>
              {allLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <MapPin className="inline w-4 h-4 mr-1" />
            Showing providers near postcode: <strong>{userPostcode}</strong>
            <button className="ml-2 text-green-600 hover:underline">Change location</button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 text-lg">
            Found <strong className="text-green-600">{filteredProviders.length}</strong> providers
          </p>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProviders.map((provider) => (
            <div key={provider.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex items-start gap-4">
                <div className="text-5xl bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
                  {provider.avatar}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{provider.name}</h3>
                      <p className="text-gray-600">{provider.category}</p>
                    </div>
                    {provider.verified && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold ml-1">{provider.rating}</span>
                      <span className="text-gray-500 ml-1">({provider.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {provider.distance}
                    </div>
                    <div className="text-green-600 font-semibold">{provider.priceRange}</div>
                  </div>

                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {provider.services.map((service, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3 text-sm text-gray-600">
                    <span className="font-semibold">Languages:</span> {provider.languages.join(', ')}
                  </div>

                  <div className="mb-4">
                    <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      {provider.availability}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold">
                      Book Now
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <Mail className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No providers found matching your criteria.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedService('all');
                setSelectedLanguage('all');
              }}
              className="mt-4 text-green-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}