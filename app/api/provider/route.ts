import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerUserFromRequest } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const user = await getServerUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: provider, error } = await supabaseAdmin!
    .from('service_providers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ provider });
}

export async function POST(request: NextRequest) {
  const user = await getServerUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { 
    firstName, lastName, phone, postcode, suburb, 
    services, experience, certifications, bio,
    is_christian, faith_background,
    country_code = 'AU'
  } = body;

  console.log('=== Provider Registration ===');
  console.log('User ID:', user.id);
  console.log('User Email:', user.email);
  console.log('Name:', firstName, lastName);

  // Step 1: Ensure user exists in users table - use upsert with onConflict
  const { error: userError } = await supabaseAdmin!
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: `${firstName} ${lastName}`,
      phone: phone || '',
      user_type: 'provider',
      city: suburb || '',
      postal_code: postcode || '',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (userError) {
    console.error('User upsert error:', userError);
    // Don't return error, continue anyway
  }

  // Step 2: Calculate years experience
  let yearsExpValue = 0;
  if (experience === '10+') yearsExpValue = 10;
  else if (experience === '5-10') yearsExpValue = 7;
  else if (experience === '3-5') yearsExpValue = 4;
  else if (experience === '1-3') yearsExpValue = 2;
  else if (experience === '0-1') yearsExpValue = 0;
  else if (typeof experience === 'number') yearsExpValue = experience;

  // Step 3: Check if provider already exists
  const { data: existing, error: checkError } = await supabaseAdmin!
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (checkError) {
    console.error('Check error:', checkError);
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  // Step 4: Prepare provider payload
  const providerPayload = {
    user_id: user.id,
    email: user.email,
    full_name: `${firstName} ${lastName}`,
    phone: phone || '',
    city: suburb || '',
    address: suburb || '',
    postal_code: postcode || '',
    specialties: services || [],
    bio: bio || '',
    years_experience: yearsExpValue,
    certifications: certifications || [],
    is_christian: is_christian || false,
    faith_background: faith_background || null,
    country_code: country_code,
    base_rate: 50,
    weekend_loading: 0.2,
    holiday_loading: 0.5,
    time_of_day_multipliers: { morning: 1.0, afternoon: 1.0, evening: 1.2, night: 1.5 },
    buffer_minutes: 15,
    is_verified: false,
    rating: 5.0,
    total_ratings: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let result;

  if (existing) {
    // Update existing provider
    console.log('Updating existing provider...');
    const { data, error } = await supabaseAdmin!
      .from('service_providers')
      .update({
        full_name: `${firstName} ${lastName}`,
        phone: phone || '',
        city: suburb || '',
        address: suburb || '',
        postal_code: postcode || '',
        specialties: services || [],
        bio: bio || '',
        years_experience: yearsExpValue,
        certifications: certifications || [],
        is_christian: is_christian || false,
        faith_background: faith_background || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  } else {
    // Create new provider
    console.log('Creating new provider...');
    const { data, error } = await supabaseAdmin!
      .from('service_providers')
      .insert(providerPayload)
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  }

  console.log('Provider registered successfully:', result?.id);

  return NextResponse.json({ 
    success: true, 
    provider: result 
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getServerUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const updates: Partial<any> = {};
  if (body.country_code) updates.country_code = body.country_code;
  if (body.base_rate !== undefined) updates.base_rate = body.base_rate;
  if (body.weekend_loading !== undefined) updates.weekend_loading = body.weekend_loading;
  if (body.holiday_loading !== undefined) updates.holiday_loading = body.holiday_loading;
  if (body.time_of_day_multipliers) updates.time_of_day_multipliers = body.time_of_day_multipliers;
  if (body.buffer_minutes !== undefined) updates.buffer_minutes = body.buffer_minutes;
  if (body.full_name) updates.full_name = body.full_name;
  if (body.phone) updates.phone = body.phone;
  if (body.bio) updates.bio = body.bio;
  if (body.specialties) updates.specialties = body.specialties;
  if (body.certifications) updates.certifications = body.certifications;
  
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin!
    .from('service_providers')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ provider: data });
}