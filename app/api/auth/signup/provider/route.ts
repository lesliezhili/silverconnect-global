// app/api/auth/signup/provider/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { 
      email, password, legalName, abn, targetTier, 
      policeCheckUrl, identityUrl, cert4Url, ahpraNumber 
    } = body;

    if (!email || !password || !legalName || !abn || !policeCheckUrl || !identityUrl) {
      return NextResponse.json({ error: "Core profile fields validation breakdown." }, { status: 400 });
    }

    // --- HE RUN ECOSYSTEM COMPLIANCE PROTECTION GATE POLICIES ---
    if ((targetTier === 'Level_2_Certified_Care' || targetTier === 'Level_3_Clinical_Professional') && !cert4Url) {
      return NextResponse.json({ error: "Compliance Rule Breach: Level 2 and above care settings require a valid Certificate IV cloud URL path target." }, { status: 422 });
    }

    if (targetTier === 'Level_3_Clinical_Professional' && !ahpraNumber) {
      return NextResponse.json({ error: "Compliance Rule Breach: Level 3 Clinical allied health profiles must specify an active AHPRA registry tracking identifier." }, { status: 422 });
    }

    // 1. Initialize authentication layer entry
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) return NextResponse.json({ error: authError?.message }, { status: 400 });

    const userId = authData.user.id;

    // 2. Provision permissions assignment mapping
    await supabase.from('user_roles').insert({ user_id: userId, role: 'Provider' });

    // 3. Log the provider metadata tracking profile row
    const { error: profileError } = await supabase.from('provider_profiles').insert({
      user_id: userId,
      legal_name: legalName,
      abn: abn.replace(/\s/g, ''),
      target_tier: targetTier,
      police_check_doc_url: policeCheckUrl,
      identity_doc_url: identityUrl,
      cert4_doc_url: cert4Url || null,
      ahpra_registration_num: ahpraNumber || null,
      verification_status: 'Pending_Review' // Locked out profile status by default
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId); // Rollback protection integrity loop
      return NextResponse.json({ error: "Profile table transaction abort." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Vetting file structures created successfully." }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Fatal server runtime exception processing file logs." }, { status: 500 });
  }
}