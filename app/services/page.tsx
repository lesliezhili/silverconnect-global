// app/services/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Clock, Shield, Heart, Home, Wrench, ShoppingBag, Users, Coffee, Truck } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  priceRange: string;
  popular: boolean;
  icon: React.JSX.Element;
  features: string[];
}

const services: Service[] = [
  {
    id: '1',
    name: 'Personal Care',
    category: 'Health & Wellbeing',
    description: 'Assistance with bathing, dressing, grooming, and daily hygiene routines.',
    duration: '30-60 min',
    priceRange: '$45-65',
    popular: true,
    icon: <Heart className="w-8 h-8" />,
    features: ['Bathing assistance', 'Dressing help', 'Grooming support', 'Toileting assistance']
  },
  {
    id: '2',
    name: 'Home Cleaning',
    category: 'Household',
    description: 'Regular housekeeping, vacuuming, dusting, mopping, and bathroom cleaning.',
    duration: '1-3 hours',
    priceRange: '$35-55',
    popular: true,
    icon: <Home className="w-8 h-8" />,
    features: ['Vacuuming & mopping', 'Dusting surfaces', 'Bathroom cleaning', 'Kitchen cleaning']
  },
  {
    id: '3',
    name: 'Home Maintenance',
    category: 'Household',
    description: 'Small repairs, handyman services, and home safety modifications.',
    duration: '1-2 hours',
    priceRange: '$55-80',
    popular: false,
    icon: <Wrench className="w-8 h-8" />,
    features: ['Light bulb replacement', 'Safety grab bars', 'Door/window repairs', 'Gutter cleaning']
  },
  {
    id: '4',
    name: 'Shopping Assistance',
    category: 'Daily Living',
    description: 'Grocery shopping, errands, and prescription pickups.',
    duration: '1-2 hours',
    priceRange: '$30-45',
    popular: true,
    icon: <ShoppingBag className="w-8 h-8" />,
    features: ['Grocery shopping', 'Prescription pickup', 'Returns & exchanges', 'List management']
  },
  {
    id: '5',
    name: 'Companionship',
    category: 'Social Support',
    description: 'Friendly visits, conversation, social activities, and emotional support.',
    duration: '1-3 hours',
    priceRange: '$30-40',
    popular: true,
    icon: <Users className="w-8 h-8" />,
    features: ['Friendly conversation', 'Reading together', 'Walks outdoors', 'Game playing']
  },
  {
    id: '6',
    name: 'Meal Preparation',
    category: 'Daily Living',
    description: 'Nutritious meal planning, cooking, and dietary management.',
    duration: '1-2 hours',
    priceRange: '$40-60',
    popular: true,
    icon: <Coffee className="w-8 h-8" />,
    features: ['Meal planning', 'Grocery list creation', 'Cooking meals', 'Dietary compliance']
  },
  {
    id: '7',
    name: 'Transport Services',
    category: 'Mobility',
    description: 'Safe transportation to appointments, social events, and errands.',
    duration: '1-4 hours',
    priceRange: '$35-50',
    popular: false,
    icon: <Truck className="w-8 h-8" />,
    features: ['Medical appointments', 'Social outings', 'Shopping trips', 'Door-to-door service']
  },
  {
    id: '8',
    name: 'Nursing Care',
    category: 'Health & Wellbeing',
    description: 'Professional nursing services including medication management and wound care.',
    duration: '30-60 min',
    priceRange: '$70-95',
    popular: false,
    icon: <Heart className="w-8 h-8" />,
    features: ['Medication management', 'Wound care', 'Health monitoring', 'Vital signs check']
  }
];

const categories = ['All', 'Health & Wellbeing', 'Household', 'Daily Living', 'Social Support', 'Mobility'];

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Senior Care Services</h1>
          <p className="text-xl md:text-2xl mb-8">Professional, compassionate care tailored to your needs</p>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              className="w-full pl-12 pr-4 py-4 text-gray-800 rounded-lg text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full text-lg transition ${
                selectedCategory === category
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
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
                      Popular
                    </span>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.duration}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Shield className="w-4 h-4 mr-1" />
                    Insured providers
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold text-green-600">{service.priceRange}<span className="text-sm text-gray-500">/hour</span></p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">What's included:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {service.features.slice(0, 2).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> {feature}
                      </li>
                    ))}
                    {service.features.length > 2 && (
                      <li className="text-gray-500">+ {service.features.length - 2} more services</li>
                    )}
                  </ul>
                </div>

                <Link href={`/services/${service.id}`}>
                  <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold">
                    Book This Service
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No services found matching your criteria.</p>
          </div>
        )}

        {/* Funding Information */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Government Funding Available</h3>
          <p className="text-gray-700 mb-4">
            Many of our services are covered by government programs including:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-blue-700">Home Care Package</h4>
              <p className="text-sm text-gray-600">Levels 1-4 available</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-blue-700">CHSP</h4>
              <p className="text-sm text-gray-600">Commonwealth Home Support</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-blue-700">DVA</h4>
              <p className="text-sm text-gray-600">Veterans' Home Care</p>
            </div>
          </div>
          <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            Check Your Eligibility
          </button>
        </div>
      </div>
    </div>
  );
}