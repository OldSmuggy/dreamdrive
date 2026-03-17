export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
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
  try {
    const { id, ...body } = await req.json()
    const admin = createAdminClient()
    const { data, error } = await admin.from('invoices').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
