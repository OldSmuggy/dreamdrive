export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-auth'

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

// Optional stages that can be skipped
const OPTIONAL_STAGES = new Set(['pop_top_install', 'design_approval'])

// POST: advance to next stage, go back, or jump to a specific stage
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { error: authErr } = await requireAuth()
  if (authErr) return authErr

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

    // Build set of stages to skip
    const skipStages = new Set<string>()
    if (body.skip_poptop)          skipStages.add('pop_top_install')
    if (body.skip_design_approval) skipStages.add('design_approval')

    if (body.action === 'advance') {
      const current = stages?.find(s => s.status === 'current')
      if (!current) return NextResponse.json({ error: 'No current stage' }, { status: 400 })

      const currentIdx = STAGE_ORDER.indexOf(current.stage)

      // Find next applicable stage index (skipping optional stages if flagged)
      let nextIdx = currentIdx + 1
      while (nextIdx < STAGE_ORDER.length) {
        const nextKey = STAGE_ORDER[nextIdx]
        if (skipStages.has(nextKey)) {
          const skipStage = stages?.find(s => s.stage === nextKey)
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

      await supabase
        .from('order_stages')
        .update({ status: 'completed', completed_at: now })
        .eq('id', current.id)

      await supabase
        .from('order_stages')
        .update({ status: 'current', entered_at: now })
        .eq('id', nextStage.id)

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

      await supabase
        .from('order_stages')
        .update({ status: 'upcoming', entered_at: null })
        .eq('id', current.id)

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

    const { data: updated } = await supabase
      .from('order_stages')
      .select('*')
      .eq('customer_vehicle_id', vehicleId)

    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PUT: update notes, planned_date, or actual dates on a specific stage
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { error: authErr } = await requireAuth()
  if (authErr) return authErr

  const { vehicleId } = await params
  try {
    const body = await req.json()
    if (!body.stage_id) return NextResponse.json({ error: 'stage_id required' }, { status: 400 })

    const supabase = createAdminClient()
    const updatePayload: Record<string, unknown> = {}

    if (body.notes         !== undefined) updatePayload.notes         = body.notes ?? null
    if (body.planned_date  !== undefined) updatePayload.planned_date  = body.planned_date || null
    if (body.entered_at    !== undefined) updatePayload.entered_at    = body.entered_at || null
    if (body.completed_at  !== undefined) updatePayload.completed_at  = body.completed_at || null
    if (body.forecast_date !== undefined) updatePayload.forecast_date = body.forecast_date || null

    const { data, error } = await supabase
      .from('order_stages')
      .update(updatePayload)
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
