export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

/** GET — dealer detail (profile + orders + funds summary) */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: profile }, { data: orders }, { data: funds }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('dealer_orders').select('*').eq('dealer_user_id', id).order('created_at', { ascending: false }),
    supabase.from('funds_ledger').select('*').eq('user_id', id).order('created_at', { ascending: false }),
  ])

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ profile, orders: orders ?? [], funds: funds ?? [] })
}

/** PATCH — update dealer profile fields or active status */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const { id } = await params
    const body = await req.json()
    const allowedFields = ['first_name', 'last_name', 'phone', 'dealer_company_name', 'dealer_abn', 'dealer_territory', 'dealer_active']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    const supabase = createAdminClient()
    const { data, error: dbErr } = await supabase.from('profiles').update(updates).eq('id', id).select('*').single()
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
