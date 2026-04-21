'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AgedCarePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Aged Care Services Australia</h1>
          <p className="text-xl md:text-2xl mb-6">Comprehensive support for seniors and their families</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Simple content to test */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-3xl font-bold mb-4">Welcome to Aged Care Support</h2>
          <p className="text-lg text-gray-700 mb-4">
            SilverConnect Global provides comprehensive aged care services across Australia, 
            helping seniors maintain independence and quality of life in their own homes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-4">
              <div className="text-4xl mb-2">🏠</div>
              <h3 className="font-bold text-xl mb-2">Home Care</h3>
              <p className="text-gray-600">Support to stay independent at home</p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl mb-2">❤️</div>
              <h3 className="font-bold text-xl mb-2">Clinical Care</h3>
              <p className="text-gray-600">Professional nursing and medical support</p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl mb-2">🤝</div>
              <h3 className="font-bold text-xl mb-2">Social Support</h3>
              <p className="text-gray-600">Companionship and community connection</p>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h3 className="font-bold text-xl mb-3">Government Funding Available</h3>
            <p>Home Care Packages (HCP), CHSP, and DVA support available.</p>
            <button className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg">
              Check Eligibility
            </button>
          </div>
        </div>
      </div>
</div>
);
}
