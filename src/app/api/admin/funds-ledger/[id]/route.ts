export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

/** PATCH — update an entry (release / refund / edit) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const { id } = await params
    const body = await req.json()
    const { action, notes } = body

    const supabase = createAdminClient()
    const updates: Record<string, unknown> = {}

    if (action === 'release') {
      updates.status = 'released'
      updates.released_at = new Date().toISOString()
    } else if (action === 'refund') {
      updates.status = 'refunded'
      updates.refunded_at = new Date().toISOString()
    } else if (action === 'reset') {
      updates.status = 'held'
      updates.released_at = null
      updates.refunded_at = null
    }

    if (notes !== undefined) updates.notes = notes

    const { data, error: dbErr } = await supabase
      .from('funds_ledger')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** DELETE — remove an entry (admin correction) */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const { id } = await params
  const supabase = createAdminClient()
  const { error: dbErr } = await supabase.from('funds_ledger').delete().eq('id', id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
