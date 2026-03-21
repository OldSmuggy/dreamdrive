export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const { ok } = rateLimit(ip)
  if (!ok) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })

  try {
    const body = await req.json()
    const { name, email, phone, message, customer_vehicle_id, sale_price } = body

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const notes = [
      `Contract for sale interest \u2014 Vehicle ID: ${customer_vehicle_id}`,
      sale_price ? `Listed price: $${(sale_price / 100).toLocaleString()}` : null,
      message ? `Message: ${message}` : null,
    ].filter(Boolean).join('\n')

    // Create a lead record
    const { error } = await supabase.from('leads').insert({
      type: 'interest',
      name: name || null,
      email: email || null,
      phone: phone || null,
      source: 'customer_sale',
      notes,
    })

    if (error) {
      console.error('[express-interest] insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notify admin
    sendEmail({
      to: 'jared@dreamdrive.life',
      ...emailTemplates.leadNotificationEmail(
        'Contract for Sale Interest',
        name || '',
        email || '',
        phone || '',
        notes,
      ),
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[express-interest] unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
