export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

/** GET — list all funds entries (optionally filter by user) */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const userId = req.nextUrl.searchParams.get('user_id')
  const supabase = createAdminClient()
  let q = supabase.from('funds_ledger').select('*, profiles:profiles!funds_ledger_user_id_fkey(first_name, last_name, dealer_company_name)').order('created_at', { ascending: false }).limit(500)
  if (userId) q = q.eq('user_id', userId)

  const { data, error: dbErr } = await q
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST — admin creates a new funds entry for a user */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const body = await req.json()
    const {
      user_id, amount_cents, entry_type, status,
      reference_type, reference_id, description,
      payment_method, payment_ref, notes,
    } = body

    if (!user_id || !amount_cents || !entry_type || !description) {
      return NextResponse.json({ error: 'user_id, amount_cents, entry_type, description required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error: dbErr } = await supabase
      .from('funds_ledger')
      .insert({
        user_id,
        amount_cents,
        entry_type,
        status: status ?? 'held',
        reference_type: reference_type ?? null,
        reference_id: reference_id ?? null,
        description,
        payment_method: payment_method ?? null,
        payment_ref: payment_ref ?? null,
        notes: notes ?? null,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
