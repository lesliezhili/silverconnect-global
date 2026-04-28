// filepath: app/api/provider/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

// GET /api/provider - Get provider profile or list available providers
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const available = searchParams.get('available');
  const providerId = searchParams.get('provider_id');

  // If provider_id is provided, return that specific provider's availability
  if (providerId) {
    const { data: provider, error } = await supabase
      .from('service_providers')
      .select('*')
      .eq('id', providerId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    // Get availability for this specific provider
    const { data: availability } = await supabase
      .from('provider_availability')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_available', true)
      .order('day_of_week');

    return NextResponse.json({ provider, availability: availability || [] });
  }

  // If available=true, return list of verified providers with availability
  if (available === 'true') {
    const { data: providers, error } = await supabase
      .from('service_providers')
      .select('*')
      .eq('verified', true)
      .eq('status', 'active')
      .order('full_name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get availability for each provider
    const providerIds = providers?.map(p => p.id) || [];
    let availabilityMap: Record<string, any[]> = {};
    
    if (providerIds.length > 0) {
      const { data: allAvailability } = await supabase
        .from('provider_availability')
        .select('*')
        .in('provider_id', providerIds)
        .eq('is_available', true);
      
      if (allAvailability) {
        for (const av of allAvailability) {
          if (!availabilityMap[av.provider_id]) {
            availabilityMap[av.provider_id] = [];
          }
          availabilityMap[av.provider_id].push(av);
        }
      }
    }

    const providersWithAvailability = providers?.map(p => ({
      ...p,
      availability: availabilityMap[p.id] || []
    })) || [];

    return NextResponse.json({ providers: providersWithAvailability });
  }

  // Default: Get current user's provider profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: provider, error } = await supabase
    .from('service_providers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get availability
  const { data: availability } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', provider?.id)
    .order('day_of_week');

  return NextResponse.json({ provider, availability: availability || [] });
}

// POST /api/provider - Create provider profile
export async function POST(req: NextRequest) {
  console.log("=== PROVIDER PROFILE API HIT ===");

  try {
    const body = await req.json();
    console.log("BODY RECEIVED:", body);

    console.log("ADMIN CLIENT EXISTS:", !!supabaseAdmin);
    console.log("SERVICE ROLE KEY PRESENT:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const {
      firstName,
      lastName,
      email,
      phone,
      postcode,
      suburb,
      services,
      experience,
      certifications,
      bio,
    } = body;

    console.log("INSERTING PROFILE:", {
      user_id: "will be set after auth",
      email,
      full_name: `${firstName} ${lastName}`,
      phone,
      country_code: 'AU',
      city: suburb,
      address: suburb,
      postal_code: postcode,
      specialties: services,
      certifications,
      bio,
      years_experience: experience,
    });

    if (!email || !firstName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Create Supabase auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password: body.password || 'TempPassword123!',
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          phone,
        },
      },
    });

    if (error || !data.user) {
      console.error("Auth signup error:", error);
      return NextResponse.json(
        { error: error?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    const userId = data.user.id;
    console.log("USER CREATED:", userId);

    // 2. Create user record
    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      full_name: `${firstName} ${lastName}`,
      phone,
      country_code: 'AU',
      city: suburb,
      address: suburb,
      postal_code: postcode,
      user_type: 'provider',
    });

    if (userError) {
      console.error("User insert error:", userError);
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    // 3. Create service provider record
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('service_providers')
      .insert({
        user_id: userId,
        full_name: `${firstName} ${lastName}`,
        phone,
        email,
        city: suburb,
        address: suburb,
        postal_code: postcode,
        specialties: services || [],
        certifications: certifications || [],
        bio: bio || '',
        years_experience: experience || 0,
        status: 'pending',
        verified: false,
      })
      .select()
      .single();

    if (providerError) {
      console.error("Provider insert error:", providerError);
      return NextResponse.json(
        { error: providerError.message },
        { status: 500 }
      );
    }

    console.log("PROVIDER CREATED:", provider);

    return NextResponse.json({
      success: true,
      provider,
      userId,
    });
  } catch (error) {
    console.error("Provider API error:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/provider - Update provider profile
export async function PUT(req: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    full_name,
    phone,
    city,
    address,
    postal_code,
    specialties,
    certifications,
    bio,
    years_experience,
    hourly_rate,
    status,
  } = body;

  const { data, error } = await supabase
    .from('service_providers')
    .update({
      full_name,
      phone,
      city,
      address,
      postal_code,
      specialties,
      certifications,
      bio,
      years_experience,
      hourly_rate,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ provider: data });
}

// POST /api/provider/availability - Set provider availability (also handles PUT)
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let user = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
      }
    }
    
    if (!user) {
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { availability } = body;

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider profile missing' },
        { status: 400 }
      );
    }

    // Delete existing availability
    await supabase
      .from('provider_availability')
      .delete()
      .eq('provider_id', provider.id);

    // Insert new availability
    if (availability && availability.length > 0) {
      const availabilityRecords = availability.map((slot: any) => ({
        provider_id: provider.id,
        day_of_week: DAY_MAP[slot.day] !== undefined ? DAY_MAP[slot.day] : parseInt(slot.day),
        start_time: slot.start,
        end_time: slot.end,
        is_available: slot.available !== false,
      }));

      const { error: insertError } = await supabase
        .from('provider_availability')
        .insert(availabilityRecords);

      if (insertError) {
        console.error("Availability insert error:", insertError);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    // Fetch updated availability
    const { data: updatedAvailability } = await supabase
      .from('provider_availability')
      .select('*')
      .eq('provider_id', provider.id)
      .order('day_of_week');

    return NextResponse.json({
      success: true,
      availability: updatedAvailability,
    });
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}