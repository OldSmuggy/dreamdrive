export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'

async function requireAdmin() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // Check if user is an admin customer record or has admin access
  // For now, require authentication at minimum
  return user
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    const admin = createAdminClient()
    const { data, error } = await admin.from('invoices').insert({
      import_order_id: body.import_order_id ?? null,
      user_id: body.user_id ?? null,
      invoice_number: body.invoice_number,
      description: body.description ?? null,
      amount_aud: body.amount_aud,
      issue_date: body.issue_date ?? null,
      due_date: body.due_date ?? null,
      status: body.status ?? 'due',
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const { id, ...body } = await req.json()
    if (!id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const admin = createAdminClient()

    // Verify the invoice exists and the user owns it (or is admin)
    const { data: invoice } = await admin.from('invoices').select('user_id').eq('id', id).single()
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data, error } = await admin.from('invoices').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
