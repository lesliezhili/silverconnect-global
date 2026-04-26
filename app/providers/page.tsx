// app/providers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Phone, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Provider {
  id: string;
  full_name: string;
  category: string;
  rating: number;
  total_ratings: number;
  postcode: string;
  city: string;
  distance: string;
  is_verified: boolean;
  phone: string;
  email: string;
  specialties: string[];
  bio: string;
  years_experience: number;
  certifications: string[];
  profile_image: string;
  avatar: string;
}

// Category display names
const CATEGORY_MAP: Record<string, string> = {
  cleaning: 'Home Cleaning',
  cooking: 'Meal Services',
  gardening: 'Garden Care',
  personal: 'Personal Care',
  maintenance: 'Home Maintenance',
};

// Helper function to get emoji based on category
function getCategoryEmoji(category: string | undefined): string {
  const emojiMap: Record<string, string> = {
    'Personal Care': '👵',
    'Home Care': '🏠',
    'Social Support': '💕',
    'Home Maintenance': '🔧',
    'Medical Care': '🏥',
    'Transport Services': '🚗',
    'Cleaning': '🧹',
    'Gardening': '🌱',
    'Meal Services': '🍲',
  };
  return emojiMap[category || ''] || '👵';
}

// Demo providers for when Supabase is not configured
function getDemoProviders(): Provider[] {
  return [
    {
      id: 'demo-1',
      full_name: 'Golden Care Services',
      category: 'Personal Care',
      rating: 4.9,
      total_ratings: 127,
      postcode: '3000',
      city: 'Melbourne',
      distance: '0.8 km',
      is_verified: true,
      phone: '0400 123 456',
      email: 'info@goldencare.com.au',
      specialties: ['personal', 'cleaning'],
      bio: 'Experienced aged care provider with 10+ years in senior care.',
      years_experience: 10,
      certifications: ['First Aid', 'CPR', 'Dementia Care'],
      profile_image: '',
      avatar: '👵'
    },
    {
      id: 'demo-2',
      full_name: 'Helping Hands Senior Care',
      category: 'Home Care',
      rating: 4.8,
      total_ratings: 94,
      postcode: '3001',
      city: 'Melbourne',
      distance: '1.2 km',
      is_verified: true,
      phone: '0400 234 567',
      email: 'hello@helpinghands.com.au',
      specialties: ['personal', 'cooking'],
      bio: 'Compassionate care for seniors with meal preparation and companionship.',
      years_experience: 5,
      certifications: ['First Aid', 'NDIS Worker Orientation'],
      profile_image: '',
      avatar: '🤝'
    },
    {
      id: 'demo-3',
      full_name: 'Compassionate Companions',
      category: 'Social Support',
      rating: 4.7,
      total_ratings: 63,
      postcode: '3002',
      city: 'Melbourne',
      distance: '2.1 km',
      is_verified: true,
      phone: '0400 345 678',
      email: 'care@compassionate.com.au',
      specialties: ['personal'],
      bio: 'Dedicated companionship and social support for isolated seniors.',
      years_experience: 3,
      certifications: ['Dementia Care'],
      profile_image: '',
      avatar: '💕'
    },
    {
      id: 'demo-4',
      full_name: 'Reliable Home Maintenance',
      category: 'Home Maintenance',
      rating: 4.6,
      total_ratings: 42,
      postcode: '3003',
      city: 'Melbourne',
      distance: '3.0 km',
      is_verified: false,
      phone: '0400 456 789',
      email: 'repairs@reliable.com.au',
      specialties: ['maintenance', 'gardening'],
      bio: 'Handyman services for seniors - home repairs and garden maintenance.',
      years_experience: 8,
      certifications: [],
      profile_image: '',
      avatar: '🔧'
    },
    {
      id: 'demo-5',
      full_name: 'Nursing Care Plus',
      category: 'Medical Care',
      rating: 5.0,
      total_ratings: 38,
      postcode: '3004',
      city: 'Melbourne',
      distance: '3.5 km',
      is_verified: true,
      phone: '0400 567 890',
      email: 'nurses@nursingcare.com.au',
      specialties: ['personal', 'maintenance'],
      bio: 'Qualified nursing staff with medication management expertise.',
      years_experience: 12,
      certifications: ['First Aid', 'CPR', 'Wound Care'],
      profile_image: '',
      avatar: '🏥'
    },
    {
      id: 'demo-6',
      full_name: 'Happy Seniors Transport',
      category: 'Transport Services',
      rating: 4.8,
      total_ratings: 56,
      postcode: '3005',
      city: 'Melbourne',
      distance: '4.2 km',
      is_verified: true,
      phone: '0400 678 901',
      email: 'rides@happyseniors.com.au',
      specialties: ['personal'],
      bio: 'Safe transport to medical appointments, shopping, and social outings.',
      years_experience: 6,
      certifications: ['First Aid'],
      profile_image: '',
      avatar: '🚗'
    }
  ];
}

export default function ProvidersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [userPostcode, setUserPostcode] = useState('3000');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers from Supabase
  useEffect(() => {
    async function fetchProviders() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('service_providers')
          .select('*')
          .eq('is_verified', true)
          .order('rating', { ascending: false })
          .limit(20);

        if (error) {
          console.warn('Supabase error, using demo data:', error.message);
          setProviders(getDemoProviders());
        } else if (data && data.length > 0) {
          setProviders(data.map(p => ({
            ...p,
            category: (p.specialties?.[0] ? CATEGORY_MAP[p.specialties[0]] : 'General Care') || 'General Care',
            avatar: p.profile_image || getCategoryEmoji(p.category),
            total_ratings: p.total_ratings || 0,
            rating: p.rating || 5.0,
          })));
        } else {
          setProviders(getDemoProviders());
        }
      } catch (err) {
        console.warn('Error fetching providers, using demo data:', err);
        setProviders(getDemoProviders());
      } finally {
        setLoading(false);
      }
    }

    fetchProviders();
  }, []);

  // Get user's location on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setUserPostcode('3000');
        },
        () => {
          setUserPostcode('3000');
        }
      );
    }
  }, []);

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = 
      provider.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.specialties?.some(s => (CATEGORY_MAP[s] || s).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesService = selectedService === 'all' || 
      provider.specialties?.some(s => (CATEGORY_MAP[s] || s).toLowerCase().includes(selectedService.toLowerCase()));
    return matchesSearch && matchesService;
  });

  const allServices = Array.from(new Set(providers.flatMap(p => p.specialties?.map(s => CATEGORY_MAP[s] || s) || [])));

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
              <option value="cleaning">Home Cleaning</option>
              <option value="personal">Personal Care</option>
              <option value="cooking">Meal Services</option>
              <option value="gardening">Garden Care</option>
              <option value="maintenance">Home Maintenance</option>
            </select>

            <select
              className="w-full px-4 py-3 border rounded-lg text-lg"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="all">All Languages</option>
              <option value="English">English</option>
              <option value="Mandarin">Mandarin</option>
              <option value="Cantonese">Cantonese</option>
            </select>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <MapPin className="inline w-4 h-4 mr-1" />
            Showing providers near postcode: <strong>{userPostcode}</strong>
            <button className="ml-2 text-green-600 hover:underline">Change location</button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading providers...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-6">
            <p className="text-gray-600 text-lg">
              Found <strong className="text-green-600">{filteredProviders.length}</strong> providers
            </p>
          </div>
        )}

        {/* Providers Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProviders.map((provider) => (
              <div key={provider.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start gap-4">
                  <div className="text-5xl bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
                    {provider.avatar || '👵'}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{provider.full_name}</h3>
                        <p className="text-gray-600">{provider.category}</p>
                      </div>
                      {provider.is_verified && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Verified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="ml-1 font-semibold">{provider.rating?.toFixed(1) || '5.0'}</span>
                        <span className="text-gray-500 ml-1">({provider.total_ratings || 0} reviews)</span>
                      </div>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">{provider.city || 'Melbourne'}</span>
                    </div>

                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {provider.distance || provider.postcode}
                    </div>

                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {provider.specialties?.map((specialty, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
                            {CATEGORY_MAP[specialty] || specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3 text-sm text-gray-600">
                      <span className="font-semibold">Experience:</span> {provider.years_experience ? `${provider.years_experience} years` : 'New provider'}
                    </div>

                    <div className="mb-4">
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        {provider.is_verified ? 'Available now' : 'Pending verification'}
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
        )}

        {/* Empty State */}
        {filteredProviders.length === 0 && !loading && (
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