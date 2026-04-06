export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const { ok } = rateLimit(ip)
  if (!ok) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })

  try {
    const body = await req.json()
    const { name, email, phone, vehicle_url, notes } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('vehicle_tips')
      .insert({ name, email, phone: phone || null, vehicle_url: vehicle_url || null, notes: notes || null })
      .select('id')
      .single()

    if (error) {
      console.error('[vehicle-tips] insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Customer confirmation (fire-and-forget)
    sendEmail({
      to: email,
      ...emailTemplates.vehicleTipConfirmationEmail(name, vehicle_url ?? ''),
    }).catch(() => {})

    // Admin notification (fire-and-forget)
    sendEmail({
      to: 'jared@dreamdrive.life',
      ...emailTemplates.vehicleTipAdminEmail(name, email, phone ?? '', vehicle_url ?? '', notes ?? ''),
    }).catch(() => {})

    return NextResponse.json({ ok: true, id: data.id })
  } catch (err) {
    console.error('[vehicle-tips] unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from('vehicle_tips')
    .select('*, listing:matched_listing_id(id, model_name, model_year)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
