'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Booking {
  id: number;
  serviceName: string;
  date: string;
  time: string;
  seniorName: string;
  amount: number;
  status: string;
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('silverconnect_bookings');
    if (saved) {
      setBookings(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No bookings yet</p>
            <Link href="/get-care">
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold">
                Book Your First Service
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{booking.serviceName}</h3>
                    <p className="text-gray-600">📅 {booking.date} at {booking.time}</p>
                    <p className="text-gray-600">👤 {booking.seniorName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-bold text-xl">${booking.amount}</p>
                    <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm mt-2">
                      {booking.status}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button className="text-blue-600 hover:underline text-sm">Reschedule</button>
                  <button className="text-red-600 hover:underline text-sm">Cancel</button>
                  <button className="text-gray-600 hover:underline text-sm">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
