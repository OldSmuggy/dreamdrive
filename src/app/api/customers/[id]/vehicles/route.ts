import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customer_id } = await params
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('customer_vehicles')
      .insert({
        customer_id,
        listing_id:    body.listing_id   || null,
        make:          body.make         || null,
        model:         body.model        || null,
        year:          body.year         ? Number(body.year) : null,
        notes:         body.notes        || null,
        current_stage: body.current_stage ?? 'vehicle_selection',
        stage_dates:   {},
        admin_notes:   null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
