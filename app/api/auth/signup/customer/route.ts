// app/api/auth/signup/customer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { email, password, firstName, lastName, phone, postcode, ndisNumber } = await req.json();

    // 1. Create user in authentication table
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) {
      return NextResponse.json({ error: `Auth Engine Failed: ${authError?.message}` }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Attempt role mapping write
    const { error: roleError } = await supabase.from('user_roles').insert({ user_id: userId, role: 'Customer' });
    
    // 3. Attempt customer profile write (CRITICAL: Variable mapping must be precise)
    const { error: profileError } = await supabase.from('customer_profiles').insert({
      user_id: userId,
      first_name: firstName,      // Maps to first_name
      last_name: lastName,        // Maps to last_name
      phone_number: phone,        // Maps to phone_number
      primary_postcode: postcode, // Maps to primary_postcode
      ndis_number: ndisNumber || null
    });

    // --- DEBUG GATEWAY: NO ROLLBACK, RETURN RAW STRINGS ---
    if (roleError || profileError) {
      return NextResponse.json({ 
        error: "Postgres Pipeline Failure Detected",
        raw_database_profile_error: profileError,
        raw_database_role_error: roleError,
        diagnostic_hint: "Check if column data types match or if a database trigger is double-inserting."
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Customer registration ledger linked." }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: `Server Crash Exception: ${err.message}` }, { status: 500 });
  }
}