import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const STAGE_ORDER = [
  'vehicle_selection',
  'bidding',
  'purchase',
  'storage',
  'van_building',
  'shipping',
  'compliance',
  'pop_top_install',
  'ready_for_delivery',
  'delivered',
]

// POST: advance to next stage, or jump to a specific stage
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { vehicleId } = await params
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const { data: stages, error: stagesErr } = await supabase
      .from('order_stages')
      .select('*')
      .eq('customer_vehicle_id', vehicleId)

    if (stagesErr) return NextResponse.json({ error: stagesErr.message }, { status: 500 })

    const now = new Date().toISOString()

    if (body.action === 'advance') {
      const current = stages?.find(s => s.status === 'current')
      if (!current) return NextResponse.json({ error: 'No current stage' }, { status: 400 })

      const currentIdx = STAGE_ORDER.indexOf(current.stage)
      const skipPoptop = body.skip_poptop === true

      // Find next applicable stage index
      let nextIdx = currentIdx + 1
      while (nextIdx < STAGE_ORDER.length) {
        if (STAGE_ORDER[nextIdx] === 'pop_top_install' && skipPoptop) {
          // Mark pop_top_install completed/skipped
          const skipStage = stages?.find(s => s.stage === 'pop_top_install')
          if (skipStage) {
            await supabase
              .from('order_stages')
              .update({ status: 'completed', entered_at: now, completed_at: now })
              .eq('id', skipStage.id)
          }
          nextIdx++
          continue
        }
        break
      }

      if (nextIdx >= STAGE_ORDER.length) {
        return NextResponse.json({ error: 'Already at final stage' }, { status: 400 })
      }

      const nextStageKey = STAGE_ORDER[nextIdx]
      const nextStage = stages?.find(s => s.stage === nextStageKey)
      if (!nextStage) return NextResponse.json({ error: 'Next stage not found in DB' }, { status: 400 })

      // Complete current
      await supabase
        .from('order_stages')
        .update({ status: 'completed', completed_at: now })
        .eq('id', current.id)

      // Activate next
      await supabase
        .from('order_stages')
        .update({ status: 'current', entered_at: now })
        .eq('id', nextStage.id)

      // Update vehicle status
      await supabase
        .from('customer_vehicles')
        .update({ vehicle_status: nextStageKey, updated_at: now })
        .eq('id', vehicleId)

    } else if (body.action === 'back') {
      const current = stages?.find(s => s.status === 'current')
      if (!current) return NextResponse.json({ error: 'No current stage' }, { status: 400 })

      const currentIdx = STAGE_ORDER.indexOf(current.stage)
      if (currentIdx === 0) return NextResponse.json({ error: 'Already at first stage' }, { status: 400 })

      const prevStageKey = STAGE_ORDER[currentIdx - 1]
      const prevStage = stages?.find(s => s.stage === prevStageKey)
      if (!prevStage) return NextResponse.json({ error: 'Prev stage not found' }, { status: 400 })

      // Reset current → upcoming
      await supabase
        .from('order_stages')
        .update({ status: 'upcoming', entered_at: null })
        .eq('id', current.id)

      // Reopen previous → current (remove completed_at)
      await supabase
        .from('order_stages')
        .update({ status: 'current', completed_at: null })
        .eq('id', prevStage.id)

      await supabase
        .from('customer_vehicles')
        .update({ vehicle_status: prevStageKey, updated_at: now })
        .eq('id', vehicleId)

    } else if (body.action === 'jump' && body.stage) {
      const targetKey = body.stage
      const targetIdx = STAGE_ORDER.indexOf(targetKey)
      if (targetIdx === -1) return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })

      for (const s of stages ?? []) {
        const idx = STAGE_ORDER.indexOf(s.stage)
        if (idx < targetIdx) {
          await supabase
            .from('order_stages')
            .update({ status: 'completed', entered_at: s.entered_at ?? now, completed_at: s.completed_at ?? now })
            .eq('id', s.id)
        } else if (idx === targetIdx) {
          await supabase
            .from('order_stages')
            .update({ status: 'current', entered_at: now, completed_at: null })
            .eq('id', s.id)
        } else {
          await supabase
            .from('order_stages')
            .update({ status: 'upcoming', entered_at: null, completed_at: null })
            .eq('id', s.id)
        }
      }

      await supabase
        .from('customer_vehicles')
        .update({ vehicle_status: targetKey, updated_at: now })
        .eq('id', vehicleId)
    }

    // Return updated stages
    const { data: updated } = await supabase
      .from('order_stages')
      .select('*')
      .eq('customer_vehicle_id', vehicleId)

    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PUT: update notes on a specific stage
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { vehicleId } = await params
  try {
    const body = await req.json()
    if (!body.stage_id) return NextResponse.json({ error: 'stage_id required' }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('order_stages')
      .update({ notes: body.notes ?? null })
      .eq('id', body.stage_id)
      .eq('customer_vehicle_id', vehicleId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
