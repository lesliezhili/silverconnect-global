'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function BookingPageContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service');
  
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    serviceId: serviceId || '',
    serviceName: '',
    date: '',
    time: '',
    seniorName: '',
    seniorPhone: '',
    seniorEmail: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    address: '',
    postcode: '',
    specialInstructions: '',
    fundingType: 'private'
  });

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Mock services data
  const services = {
    '1': { name: 'Home Cleaning', price: 55, duration: '2 hours' },
    '2': { name: 'Personal Care', price: 65, duration: '1 hour' },
    '3': { name: 'Meal Preparation', price: 50, duration: '1.5 hours' },
    '4': { name: 'Companionship', price: 40, duration: '2 hours' },
    '5': { name: 'Transport', price: 45, duration: '1 hour' },
    '6': { name: 'Gardening', price: 55, duration: '2 hours' },
    '7': { name: 'Home Maintenance', price: 70, duration: '1 hour' },
    '8': { name: 'Nursing Care', price: 85, duration: '1 hour' }
  };

  // Generate available time slots
  useEffect(() => {
    const times = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];
    setAvailableTimes(times);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
    
    // Save to localStorage for demo
    const bookings = JSON.parse(localStorage.getItem('silverconnect_bookings') || '[]');
    const newBooking = {
      id: Date.now(),
      ...bookingData,
      serviceName: services[bookingData.serviceId as keyof typeof services]?.name || 'Service',
      amount: services[bookingData.serviceId as keyof typeof services]?.price || 0,
      status: 'confirmed',
      timestamp: new Date().toISOString()
    };
    bookings.push(newBooking);
    localStorage.setItem('silverconnect_bookings', JSON.stringify(bookings));
    
    // Simulate SMS and email
    console.log('Booking confirmed:', newBooking);
  };

  const selectedService = services[bookingData.serviceId as keyof typeof services];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Steps - 5 Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {/* Step 1 */}
            <div className="flex-1 flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${step > 1 ? 'bg-green-600' : 'bg-gray-300'}`} />
            </div>
            
            {/* Step 2 */}
            <div className="flex-1 flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-2 ${step > 2 ? 'bg-green-600' : 'bg-gray-300'}`} />
            </div>
            
            {/* Step 3 */}
            <div className="flex-1 flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <div className={`flex-1 h-1 mx-2 ${step > 3 ? 'bg-green-600' : 'bg-gray-300'}`} />
            </div>
            
            {/* Step 4 */}
            <div className="flex-1 flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 4 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                4
              </div>
              <div className={`flex-1 h-1 mx-2 ${step > 4 ? 'bg-green-600' : 'bg-gray-300'}`} />
            </div>
            
            {/* Step 5 */}
            <div className="flex-1 flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 5 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                5
              </div>
            </div>
          </div>
          
          {/* Step Labels */}
          <div className="flex justify-between mt-2 text-sm">
            <div className="flex-1 text-center">Select Service</div>
            <div className="flex-1 text-center">Your Details</div>
            <div className="flex-1 text-center">Date & Time</div>
            <div className="flex-1 text-center">Emergency Contact</div>
            <div className="flex-1 text-center">Confirm</div>
          </div>
        </div>

        {!showConfirmation ? (
          <form onSubmit={handleSubmit}>
            {/* Step 1: Select Service */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6">Step 1: Select a Service</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(services).map(([id, service]) => (
                    <label
                      key={id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                        bookingData.serviceId === id 
                          ? 'border-green-600 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="serviceId"
                        value={id}
                        checked={bookingData.serviceId === id}
                        onChange={handleChange}
                        className="mr-3"
                      />
                      <div className="inline-block">
                        <div className="font-bold">{service.name}</div>
                        <div className="text-sm text-gray-600">${service.price}/hour • {service.duration}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {bookingData.serviceId && selectedService && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-blue-800">
                      💡 {selectedService.name} includes: Professional, insured, and background-checked providers
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!bookingData.serviceId}
                  className={`w-full py-3 rounded-lg font-semibold ${
                    bookingData.serviceId 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue to Step 2
                </button>
              </div>
            )}

            {/* Step 2: Your Details */}
            {step === 2 && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6">Step 2: Your Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="seniorName"
                      required
                      className="w-full border rounded-lg p-3 text-lg"
                      value={bookingData.seniorName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone *</label>
                      <input
                        type="tel"
                        name="seniorPhone"
                        required
                        className="w-full border rounded-lg p-3"
                        value={bookingData.seniorPhone}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        name="seniorEmail"
                        className="w-full border rounded-lg p-3"
                        value={bookingData.seniorEmail}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      className="w-full border rounded-lg p-3"
                      value={bookingData.address}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Postcode *</label>
                    <input
                      type="text"
                      name="postcode"
                      required
                      className="w-full border rounded-lg p-3"
                      value={bookingData.postcode}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Funding Type</label>
                    <select
                      name="fundingType"
                      className="w-full border rounded-lg p-3"
                      value={bookingData.fundingType}
                      onChange={handleChange}
                    >
                      <option value="private">Private Payment</option>
                      <option value="hcp">Home Care Package</option>
                      <option value="chsp">CHSP</option>
                      <option value="dva">DVA</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Continue to Step 3
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6">Step 3: Select Date & Time</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Date *</label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full border rounded-lg p-3 text-lg"
                      value={bookingData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Time *</label>
                    <select
                      name="time"
                      required
                      className="w-full border rounded-lg p-3 text-lg"
                      value={bookingData.time}
                      onChange={handleChange}
                    >
                      <option value="">Select time</option>
                      {availableTimes.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⏰ Our providers are available 7 days a week, 7am - 7pm
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!bookingData.date || !bookingData.time}
                    className={`flex-1 py-3 rounded-lg font-semibold ${
                      bookingData.date && bookingData.time
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Continue to Step 4
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Emergency Contact */}
            {step === 4 && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6">Step 4: Emergency Contact</h2>
                <p className="text-gray-600 mb-6">We'll notify this person if we can't reach you</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Emergency Contact Name *</label>
                    <input
                      type="text"
                      name="emergencyName"
                      required
                      className="w-full border rounded-lg p-3 text-lg"
                      value={bookingData.emergencyName}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Emergency Phone *</label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      required
                      className="w-full border rounded-lg p-3"
                      value={bookingData.emergencyPhone}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Relationship *</label>
                    <select
                      name="emergencyRelation"
                      required
                      className="w-full border rounded-lg p-3"
                      value={bookingData.emergencyRelation}
                      onChange={handleChange}
                    >
                      <option value="">Select relationship</option>
                      <option>Spouse/Partner</option>
                      <option>Child</option>
                      <option>Sibling</option>
                      <option>Friend</option>
                      <option>Neighbor</option>
                      <option>Caregiver</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Special Instructions (optional)</label>
                    <textarea
                      name="specialInstructions"
                      rows={3}
                      className="w-full border rounded-lg p-3"
                      value={bookingData.specialInstructions}
                      onChange={handleChange}
                      placeholder="Any medical conditions, allergies, or special requirements..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Review & Confirm
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Confirm Booking */}
            {step === 5 && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6">Step 5: Confirm Your Booking</h2>

                <div className="space-y-4 mb-6">
                  <div className="border-b pb-3">
                    <h3 className="font-bold text-lg mb-2">Service Details</h3>
                    <p>Service: {selectedService?.name}</p>
                    <p>Date: {bookingData.date}</p>
                    <p>Time: {bookingData.time}</p>
                    <p>Price: ${selectedService?.price}/hour</p>
                  </div>

                  <div className="border-b pb-3">
                    <h3 className="font-bold text-lg mb-2">Your Information</h3>
                    <p>Name: {bookingData.seniorName}</p>
                    <p>Phone: {bookingData.seniorPhone}</p>
                    <p>Email: {bookingData.seniorEmail || 'Not provided'}</p>
                    <p>Address: {bookingData.address || 'To be confirmed'}</p>
                    <p>Postcode: {bookingData.postcode}</p>
                    <p>Funding: {bookingData.fundingType.toUpperCase()}</p>
                  </div>

                  <div className="border-b pb-3">
                    <h3 className="font-bold text-lg mb-2">Emergency Contact</h3>
                    <p>Name: {bookingData.emergencyName}</p>
                    <p>Phone: {bookingData.emergencyPhone}</p>
                    <p>Relationship: {bookingData.emergencyRelation}</p>
                  </div>

                  {bookingData.specialInstructions && (
                    <div className="border-b pb-3">
                      <h3 className="font-bold text-lg mb-2">Special Instructions</h3>
                      <p className="text-gray-600">{bookingData.specialInstructions}</p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-yellow-800">
                    ⚠️ By confirming, you agree to our cancellation policy. Free cancellation up to 24 hours before service.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Confirm & Complete Booking
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          /* Confirmation Screen (after booking) */
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Your {selectedService?.name} has been booked for {bookingData.date} at {bookingData.time}.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm text-gray-600">📱 SMS sent to: {bookingData.seniorPhone}</p>
              <p className="text-sm text-gray-600">📧 Email sent to: {bookingData.seniorEmail || 'provided email'}</p>
              <p className="text-sm text-gray-600">🚨 Emergency contact notified: {bookingData.emergencyName}</p>
            </div>
            <div className="flex gap-4">
              <Link href="/" className="flex-1">
                <button className="w-full border border-gray-300 py-3 rounded-lg font-semibold">
                  Back to Home
                </button>
              </Link>
              <Link href="/bookings" className="flex-1">
                <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold">
                  View My Bookings
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingPageContent />
    </Suspense>
  );
}
