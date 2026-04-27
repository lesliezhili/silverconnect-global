// filepath: app/api/provider/compliance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/provider/compliance - Get provider compliance documents
export async function GET() {
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get provider ID
  const { data: provider } = await (await import('@/lib/supabase')).supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const { data: documents, error } = await (await import('@/lib/supabase')).supabase
    .from('compliance_documents')
    .select('*')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get alerts
  const { data: alerts } = await (await import('@/lib/supabase')).supabase
    .from('compliance_alerts')
    .select('*')
    .eq('provider_id', provider.id)
    .eq('is_resolved', false)
    .order('created_at', { ascending: false });

  return NextResponse.json({ documents: documents || [], alerts: alerts || [] });
}

// POST /api/provider/compliance - Upload compliance document
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get provider ID
    const { data: provider } = await (await import('@/lib/supabase')).supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const body = await req.json();
    const { documentType, documentNumber, fileUrl, expiryDate } = body;

    if (!documentType || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('compliance_documents')
      .insert({
        provider_id: provider.id,
        document_type: documentType,
        document_number: documentNumber,
        file_url: fileUrl,
        expiry_date: expiryDate,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, document: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/provider/compliance - Update compliance document
export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "Document ID required" }, { status: 400 });

    // Verify ownership
    const { data: provider } = await (await import('@/lib/supabase')).supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const { data: existing } = await (await import('@/lib/supabase')).supabase
      .from('compliance_documents')
      .select('provider_id')
      .eq('id', id)
      .single();

    if (!existing || existing.provider_id !== provider.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('compliance_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, document: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/provider/compliance - Delete compliance document
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Document ID required" }, { status: 400 });

    // Verify ownership
    const { data: provider } = await (await import('@/lib/supabase')).supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const { data: existing } = await (await import('@/lib/supabase')).supabase
      .from('compliance_documents')
      .select('provider_id')
      .eq('id', id)
      .single();

    if (!existing || existing.provider_id !== provider.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('compliance_documents')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}