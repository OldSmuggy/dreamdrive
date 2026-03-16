import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; vehicleId: string }> }) {
  const { vehicleId } = await params
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.current_stage !== undefined) updatePayload.current_stage = body.current_stage
    if (body.stage_dates   !== undefined) updatePayload.stage_dates   = body.stage_dates
    if (body.admin_notes   !== undefined) updatePayload.admin_notes   = body.admin_notes
    if (body.notes         !== undefined) updatePayload.notes         = body.notes
    if (body.make          !== undefined) updatePayload.make          = body.make
    if (body.model         !== undefined) updatePayload.model         = body.model
    if (body.year          !== undefined) updatePayload.year          = body.year ? Number(body.year) : null
    if (body.listing_id    !== undefined) updatePayload.listing_id    = body.listing_id || null
    if (body.build_id      !== undefined) updatePayload.build_id      = body.build_id || null

    const { data, error } = await supabase
      .from('customer_vehicles')
      .update(updatePayload)
      .eq('id', vehicleId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; vehicleId: string }> }) {
  const { vehicleId } = await params
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('customer_vehicles')
    .delete()
    .eq('id', vehicleId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
