import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('customers')
    .select(`
      id, first_name, last_name, email, phone, state, notes, hubspot_id, created_at, updated_at,
      customer_vehicles(
        id, current_stage, stage_dates, admin_notes, notes, make, model, year, listing_id, build_id, created_at,
        listing:listings(id, model_name, model_year, chassis_code, photos, bid_no)
      ),
      customer_documents(id, filename, storage_path, file_type, description, uploaded_at, customer_vehicle_id)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('customers')
      .update({
        first_name: body.first_name,
        last_name:  body.last_name  || null,
        email:      body.email      || null,
        phone:      body.phone      || null,
        state:      body.state      || null,
        notes:      body.notes      || null,
        hubspot_id: body.hubspot_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('customers')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
