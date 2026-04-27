// filepath: app/api/provider/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/provider/stats - Get provider stats
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month'; // month, quarter, year
  
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get provider ID
  const { data: provider } = await (await import('@/lib/supabase')).supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  // Calculate date range
  const now = new Date();
  let periodStart: Date, periodEnd: Date;
  
  if (period === 'month') {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3);
    periodStart = new Date(now.getFullYear(), quarter * 3, 1);
    periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
  } else {
    periodStart = new Date(now.getFullYear(), 0, 1);
    periodEnd = new Date(now.getFullYear(), 11, 31);
  }

  // Get booking stats
  const { data: bookings } = await (await import('@/lib/supabase')).supabase
    .from('bookings')
    .select('status')
    .eq('provider_id', provider.id)
    .gte('booking_date', periodStart.toISOString().split('T')[0])
    .lte('booking_date', periodEnd.toISOString().split('T')[0]);

  const totalBookings = bookings?.length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'COMPLETED').length || 0;
  const cancelledBookings = bookings?.filter(b => b.status === 'CANCELLED').length || 0;

  // Get rating stats
  const { data: ratings } = await (await import('@/lib/supabase')).supabase
    .from('ratings')
    .select('rating')
    .eq('provider_id', provider.id)
    .eq('is_public', true);

  const totalRatings = ratings?.length || 0;
  const avgRating = ratings?.length 
    ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length 
    : 0;
  
  const starCounts = {
    five: ratings?.filter(r => r.rating === 5).length || 0,
    four: ratings?.filter(r => r.rating === 4).length || 0,
    three: ratings?.filter(r => r.rating === 3).length || 0,
    two: ratings?.filter(r => r.rating === 2).length || 0,
    one: ratings?.filter(r => r.rating === 1).length || 0,
  };

  // Calculate response rate (bookings with provider response)
  const { data: responses } = await (await import('@/lib/supabase')).supabase
    .from('rating_responses')
    .select('id', { count: 'exact' })
    .eq('provider_id', provider.id);

  const responseRate = totalRatings > 0 
    ? ((responses?.length || 0) / totalRatings) * 100 
    : 0;

  const stats = {
    period: { start: periodStart.toISOString().split('T')[0], end: periodEnd.toISOString().split('T')[0] },
    totalBookings,
    completedBookings,
    cancelledBookings,
    averageRating: Math.round(avgRating * 100) / 100,
    totalRatings,
    starCounts,
    responseRate: Math.round(responseRate * 100) / 100,
  };

  return NextResponse.json({ stats });
}