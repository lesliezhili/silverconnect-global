'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, MapPin, DollarSign, Star } from 'lucide-react';
import BookingModal from '@/components/BookingModal';

interface Service {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  category: string;
  duration_minutes: number;
  image_url: string;
}

interface Provider {
  id: string;
  full_name: string;
  rating: number;
  total_ratings: number;
  profile_image: string;
  price_estimate: number;
}

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Services', name_zh: '所有服务' },
    { id: 'cleaning', name: 'Cleaning', name_zh: '清洁' },
    { id: 'cooking', name: 'Cooking', name_zh: '烹饪' },
    { id: 'gardening', name: 'Gardening', name_zh: '园艺' },
    { id: 'personal', name: 'Personal Care', name_zh: '个人护理' },
    { id: 'maintenance', name: 'Maintenance', name_zh: '维修' }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchProviders();
    }
  }, [selectedService]);

  const fetchServices = async () => {
    const response = await fetch('/api/services');
    const data = await response.json();
    setServices(data.services || []);
    setLoading(false);
  };

  const fetchProviders = async () => {
    const response = await fetch(`/api/matching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: selectedService?.id,
        countryCode: 'AU',
        maxDistanceKm: 20,
        minRating: 3
      })
    });
    const data = await response.json();
    setProviders(data.providers || []);
  };

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Book a Care Service</h1>
          <p className="text-xl opacity-90">Professional care workers ready to help</p>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
              onClick={() => setSelectedService(service)}
            >
              <div className="h-40 bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center">
                <span className="text-5xl">
                  {service.category === 'cleaning' && '🧹'}
                  {service.category === 'cooking' && '🍳'}
                  {service.category === 'gardening' && '🌿'}
                  {service.category === 'personal' && '🤝'}
                  {service.category === 'maintenance' && '🔧'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{service.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    Select
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Providers List */}
      {selectedService && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 transform transition-transform overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Select Provider</h2>
            <button
              onClick={() => setSelectedService(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Selected Service</p>
              <p className="font-medium">{selectedService.name}</p>
              <p className="text-sm text-gray-500">{selectedService.duration_minutes} minutes</p>
            </div>

            {providers.map(provider => (
              <div
                key={provider.id}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedProvider?.id === provider.id
                    ? 'border-green-500 bg-green-50'
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedProvider(provider)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                    {provider.full_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{provider.full_name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{provider.rating}</span>
                      <span className="text-gray-400 text-sm">({provider.total_ratings})</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-green-600 font-semibold">
                        ${provider.price_estimate}
                      </span>
                      <span className="text-gray-500 text-sm"> / session</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {selectedProvider && (
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Continue to Booking
              </button>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedService && selectedProvider && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          providerId={selectedProvider.id}
          providerName={selectedProvider.full_name}
          serviceId={selectedService.id}
          serviceName={selectedService.name}
          onBookingComplete={() => {
            setShowBookingModal(false);
            setSelectedService(null);
            setSelectedProvider(null);
          }}
        />
      )}
    </div>
  );
}