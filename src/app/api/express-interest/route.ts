export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, message, customer_vehicle_id, sale_price } = body

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create a lead record
    const { error } = await supabase.from('leads').insert({
      type: 'interest',
      name: name || null,
      email: email || null,
      phone: phone || null,
      source: 'customer_sale',
      notes: [
        `Contract for sale interest — Vehicle ID: ${customer_vehicle_id}`,
        sale_price ? `Listed price: $${(sale_price / 100).toLocaleString()}` : null,
        message ? `Message: ${message}` : null,
      ].filter(Boolean).join('\n'),
    })

    if (error) {
      console.error('[express-interest] insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[express-interest] unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
