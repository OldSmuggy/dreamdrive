import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { vehicleId } = await params
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.vehicle_status      !== undefined) payload.vehicle_status      = body.vehicle_status
    if (body.vehicle_description !== undefined) payload.vehicle_description = body.vehicle_description || null
    if (body.target_preferences  !== undefined) payload.target_preferences  = body.target_preferences
    if (body.listing_id          !== undefined) payload.listing_id          = body.listing_id || null
    if (body.purchase_price_jpy  !== undefined) payload.purchase_price_jpy  = body.purchase_price_jpy || null
    if (body.purchase_price_aud  !== undefined) payload.purchase_price_aud  = body.purchase_price_aud || null
    if (body.notes               !== undefined) payload.notes               = body.notes || null
    if (body.sort_order          !== undefined) payload.sort_order          = body.sort_order

    const { data, error } = await supabase
      .from('customer_vehicles')
      .update(payload)
      .eq('id', vehicleId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { vehicleId } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from('customer_vehicles').delete().eq('id', vehicleId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
