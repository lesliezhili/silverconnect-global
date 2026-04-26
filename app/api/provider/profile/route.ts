import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

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
      password: crypto.randomUUID(),
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          role: 'provider',
        },
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Auth failed' },
        { status: 400 }
      );
    }

    const user = data.user;

    // Check supabaseAdmin is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin access not configured' },
        { status: 500 }
      );
    }

    // 2. Insert user record first (required for foreign key)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email,
        full_name: `${firstName} ${lastName}`,
        phone,
        user_type: 'provider',
        country_code: 'AU',
        is_active: true,
      });

    if (userError) {
      console.error('User insert error:', userError);
      // Clean up auth user if user record fails
      await supabase.auth.admin.deleteUser(user.id);
      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      );
    }

    // 3. Insert provider profile (schema‑correct)
    const { error: insertError } = await supabaseAdmin
      .from('service_providers')
      .insert({
        user_id: user.id,
        email,
        full_name: `${firstName} ${lastName}`,
        phone,
        country_code: 'AU',
        city: suburb,
        address: suburb,
        postal_code: postcode,
        specialties: services || [],
        certifications: certifications || [],
        bio: bio || '',
        years_experience: experience || null,
        is_verified: false,
        rating: 5.0,
        total_ratings: 0,
      });
    
    console.log("INSERT ERROR:", insertError);


    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    // 4. Sign in to establish session for subsequent API calls (availability, etc.)
    const tempPassword = crypto.randomUUID();
    
    // Sign up with temp password (in case it's not already set)
    await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          role: 'provider',
        },
      },
    });

    // Sign in to get a session
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: tempPassword,
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      return NextResponse.json({ 
        success: true, 
        warning: 'Profile created but could not establish session' 
      });
    }

    // Return success with session access token
    return NextResponse.json({ 
      success: true, 
      accessToken: sessionData.session?.access_token 
    });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
