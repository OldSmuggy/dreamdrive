export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-auth'

// POST: bulk update stage dates/notes for all stages at once
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { error: authErr } = await requireAuth()
  if (authErr) return authErr

  const { vehicleId } = await params
  try {
    const body = await req.json()
    if (!Array.isArray(body.stages)) {
      return NextResponse.json({ error: 'stages array required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    for (const s of body.stages) {
      if (!s.stage_id) continue
      const update: Record<string, unknown> = {}
      if (s.entered_at !== undefined) update.entered_at = s.entered_at || null
      if (s.completed_at !== undefined) update.completed_at = s.completed_at || null
      if (s.forecast_date !== undefined) update.forecast_date = s.forecast_date || null
      if (s.planned_date !== undefined) update.planned_date = s.planned_date || null
      if (s.notes !== undefined) update.notes = s.notes ?? null

      if (Object.keys(update).length > 0) {
        await supabase
          .from('order_stages')
          .update(update)
          .eq('id', s.stage_id)
          .eq('customer_vehicle_id', vehicleId)
      }
    }

    const { data: updated } = await supabase
      .from('order_stages')
      .select('*')
      .eq('customer_vehicle_id', vehicleId)

    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
