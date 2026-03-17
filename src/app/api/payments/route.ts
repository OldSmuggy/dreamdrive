export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const admin = createAdminClient()
    const { data, error } = await admin.from('payments').insert({
      import_order_id: body.import_order_id ?? null,
      user_id: body.user_id ?? null,
      amount_aud: body.amount_aud,
      description: body.description ?? null,
      payment_method: body.payment_method ?? null,
      payment_date: body.payment_date ?? null,
      status: body.status ?? 'confirmed',
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
