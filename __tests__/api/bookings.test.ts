import { POST } from '../../app/api/bookings/route';

describe('/api/bookings POST', () => {
  test('creates booking successfully', async () => {
    // Mock request
    const req = {
      json: async () => ({
        provider_id: 'provider-1',
        customer_id: 'customer-1',
        service_type: 'cleaning',
        start_time: '2023-10-01T10:00:00Z',
        duration_minutes: 60,
        country_code: 'AU',
      }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.booking).toHaveProperty('id');
  });

  test('fails with invalid data', async () => {
    const req = {
      json: async () => ({}),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});