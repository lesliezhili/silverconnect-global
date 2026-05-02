import { getAvailableSlots } from './availability';
import { supabase } from './supabase';

// Mock supabase
jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

describe('getAvailableSlots', () => {
  test('returns available slots excluding conflicts', async () => {
    // Mock data
    const slots = await getAvailableSlots('provider-1', '2023-10-01', 60, 'AU');
    expect(slots).toBeInstanceOf(Array);
    // Add specific assertions based on mock data
  });

  test('handles no availability', async () => {
    const slots = await getAvailableSlots('provider-2', '2023-10-01', 60, 'AU');
    expect(slots).toEqual([]);
  });
});