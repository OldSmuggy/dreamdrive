export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

/** PATCH — update a stage (status, notes, photos) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const { id, stageId } = await params
    const body = await req.json()
    const allowed = ['status', 'notes', 'photos', 'planned_date', 'completed_at', 'entered_at']
    const updates: Record<string, unknown> = {}
    for (const f of allowed) if (body[f] !== undefined) updates[f] = body[f]

    // Auto-set entered_at when moving to current
    if (updates.status === 'current' && !updates.entered_at) updates.entered_at = new Date().toISOString()
    if (updates.status === 'completed' && !updates.completed_at) updates.completed_at = new Date().toISOString()

    const supabase = createAdminClient()
    const { data, error: dbErr } = await supabase
      .from('dealer_order_stages')
      .update(updates)
      .eq('id', stageId)
      .eq('order_id', id)
      .select('*')
      .single()

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
