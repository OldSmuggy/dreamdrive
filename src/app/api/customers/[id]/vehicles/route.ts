import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const STAGE_ORDER = [
  'vehicle_selection',
  'bidding',
  'purchase',
  'storage',
  'design_approval',
  'van_building',
  'shipping',
  'compliance',
  'pop_top_install',
  'ready_for_delivery',
  'delivered',
]

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customer_id } = await params
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const { data: vehicle, error } = await supabase
      .from('customer_vehicles')
      .insert({
        customer_id,
        listing_id:          body.listing_id          || null,
        target_preferences:  body.target_preferences  || {},
        vehicle_status:      'searching',
        vehicle_description: body.vehicle_description || null,
        build_date:          body.build_date          || null,
        notes:               body.notes               || null,
        sort_order:          body.sort_order          ?? 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-create all order stages; first is 'current', rest are 'upcoming'
    const now = new Date().toISOString()
    const stages = STAGE_ORDER.map((stage, i) => ({
      customer_vehicle_id: vehicle.id,
      stage,
      status:     i === 0 ? 'current'  : 'upcoming',
      entered_at: i === 0 ? now        : null,
    }))

    await supabase.from('order_stages').insert(stages)

    return NextResponse.json(vehicle)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
