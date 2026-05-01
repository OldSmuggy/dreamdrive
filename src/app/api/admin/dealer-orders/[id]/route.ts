export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

/** GET — full order detail */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const { id } = await params
  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from('dealer_orders')
    .select('*, profiles:profiles!dealer_orders_dealer_user_id_fkey(first_name, last_name, dealer_company_name, dealer_territory, phone)')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: stages }, { data: funds }] = await Promise.all([
    supabase.from('dealer_order_stages').select('*').eq('order_id', id).order('stage_index'),
    supabase.from('funds_ledger').select('*').eq('reference_type', 'dealer_order').eq('reference_id', id).order('created_at', { ascending: false }),
  ])

  return NextResponse.json({ order, stages: stages ?? [], funds: funds ?? [] })
}

/** PATCH — admin updates the order (status, notes, source listing, dates) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const { id } = await params
    const body = await req.json()
    const allowed = ['status', 'admin_notes', 'source_listing_id', 'estimated_delivery', 'signed_at', 'delivered_at']
    const updates: Record<string, unknown> = {}
    for (const f of allowed) if (body[f] !== undefined) updates[f] = body[f]

    const supabase = createAdminClient()
    const { data, error: dbErr } = await supabase.from('dealer_orders').update(updates).eq('id', id).select('*').single()
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
