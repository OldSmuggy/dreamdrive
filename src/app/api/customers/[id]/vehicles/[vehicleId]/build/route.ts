export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { id: customer_id, vehicleId } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('customer_builds')
    .select('*')
    .eq('customer_id', customer_id)
    .eq('customer_vehicle_id', vehicleId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? null)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { id: customer_id, vehicleId } = await params
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    // Check if a build already exists for this vehicle
    const { data: existing } = await supabase
      .from('customer_builds')
      .select('id')
      .eq('customer_id', customer_id)
      .eq('customer_vehicle_id', vehicleId)
      .maybeSingle()

    const buildData = {
      customer_id,
      customer_vehicle_id:  vehicleId,
      build_type:           body.build_type,
      build_location:       body.build_location       || null,
      conversion_fee_aud:   body.conversion_fee_aud   || null,
      pop_top:              body.pop_top              ?? false,
      pop_top_fee_aud:      body.pop_top_fee_aud      || null,
      addon_slugs:          body.addon_slugs          ?? [],
      addons_total_aud:     body.addons_total_aud     ?? 0,
      custom_description:   body.custom_description   || null,
      custom_quote_aud:     body.custom_quote_aud     || null,
      total_quoted_aud:     body.total_quoted_aud     || null,
      build_status:         body.build_status         || 'quoted',
      notes:                body.notes                || null,
      updated_at:           new Date().toISOString(),
    }

    let result
    if (existing) {
      result = await supabase
        .from('customer_builds')
        .update(buildData)
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('customer_builds')
        .insert(buildData)
        .select()
        .single()
    }

    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
    return NextResponse.json(result.data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
