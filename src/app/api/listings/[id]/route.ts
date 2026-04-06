export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api-auth'

// Columns that require a DB migration and may not exist yet.
// If the update fails because of one of these, we strip them and retry
// so all other fields still save successfully.
const OPTIONAL_COLUMNS = [
  'internal_photos', 'show_interior_gallery',
  'location_status', 'fit_out_level', 'vehicle_model', 'conversion_video_url',
  'engine', 'has_power_steering', 'has_power_windows', 'has_rear_ac',
  'auction_time', 'auction_result', 'sold_price_jpy', 'top_bid_jpy', 'auction_time_zone',
  'price_aud', 'price_type',
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const doUpdate = async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('listings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
      return { data: data?.[0] ?? null, error }
    }

    let { data, error } = await doUpdate(body)

    // If a column doesn't exist yet (migration not run), strip it and retry
    // so the rest of the fields still save.
    if (error) {
      const missingCol = OPTIONAL_COLUMNS.find(c => error!.message.includes(c))
      if (missingCol) {
        console.warn(
          `[listings PATCH] Column "${missingCol}" missing — run SQL migration. Retrying without optional columns.`
        )
        const fallback = { ...body }
        OPTIONAL_COLUMNS.forEach(c => delete fallback[c])
        const retry = await doUpdate(fallback)
        data = retry.data
        error = retry.error
      }
    }

    if (error) {
      console.error('[listings PATCH] Save failed:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('listings').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
