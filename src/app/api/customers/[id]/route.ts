export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('customers')
    .select(`
      id, first_name, last_name, email, phone, state, notes, hubspot_contact_id, status, created_at, updated_at,
      customer_vehicles(
        id, vehicle_status, vehicle_description, target_preferences, listing_id,
        purchase_price_jpy, purchase_price_aud, notes, sort_order, created_at,
        listing:listings(id, model_name, model_year, grade, chassis_code, photos, bid_no, mileage_km, start_price_jpy, buy_price_jpy),
        order_stages(id, stage, status, notes, entered_at, completed_at),
        customer_builds(id, build_type, build_location, conversion_fee_aud, pop_top, pop_top_fee_aud, addon_slugs, addons_total_aud, custom_description, custom_quote_aud, total_quoted_aud, build_status, notes)
      ),
      customer_documents(id, name, file_url, file_type, file_size_bytes, document_type, notes, created_at, customer_vehicle_id)
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
        first_name:         body.first_name,
        last_name:          body.last_name          || null,
        email:              body.email              || null,
        phone:              body.phone              || null,
        state:              body.state              || null,
        notes:              body.notes              || null,
        hubspot_contact_id: body.hubspot_contact_id || null,
        ...(body.status ? { status: body.status } : {}),
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hard = req.nextUrl.searchParams.get('hard') === 'true'
  const supabase = createAdminClient()

  const { error } = hard
    ? await supabase.from('customers').delete().eq('id', id)
    : await supabase.from('customers').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
