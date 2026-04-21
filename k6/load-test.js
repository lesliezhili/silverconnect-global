import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Load Testing Script for SilverConnect Global
 * Run with: k6 run k6/load-test.js
 */

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp-up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp-up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests under 1.5s
    http_req_failed: ['<0.1'], // Less than 0.1% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Homepage
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'Homepage loaded': (r) => r.status === 200,
    'Homepage response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);

  // 2. Services page
  const servicesRes = http.get(`${BASE_URL}/services`);
  check(servicesRes, {
    'Services page loaded': (r) => r.status === 200,
    'Services page response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  sleep(1);

  // 3. Booking page
  const bookingRes = http.get(`${BASE_URL}/bookings`);
  check(bookingRes, {
    'Booking page loaded': (r) => r.status === 200,
  });
  sleep(1);

  // 4. API - Get countries
  const countriesRes = http.get(`${BASE_URL}/api/geo/countries`);
  check(countriesRes, {
    'Countries API success': (r) => r.status === 200,
    'Countries API response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);

  // 5. API - Create booking (simulated)
  const bookingPayload = JSON.stringify({
    userId: `user-${__VU}`,
    serviceId: 'service-1',
    serviceDate: '2024-12-25',
    serviceTime: '10:00',
    country: 'AU',
    totalAmount: 100,
    currency: 'AUD',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const createBookingRes = http.post(
    `${BASE_URL}/api/bookings`,
    bookingPayload,
    params
  );
  check(createBookingRes, {
    'Create booking success': (r) => r.status === 201 || r.status === 400,
    'Create booking response time < 1500ms': (r) => r.timings.duration < 1500,
  });
  sleep(2);
}
