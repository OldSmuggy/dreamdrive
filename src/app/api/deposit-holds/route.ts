export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const { ok } = rateLimit(ip)
  if (!ok) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })

  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { listing_id } = await req.json()
    if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 })

    const admin = createAdminClient()

    // Get listing details
    const { data: listing } = await admin
      .from('listings')
      .select('model_name, model_year, source')
      .eq('id', listing_id)
      .single()

    // Get user profile
    const { data: profile } = await admin
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', user.id)
      .single()

    // Create deposit hold record
    const { data: hold, error } = await admin
      .from('deposit_holds')
      .insert({
        user_id: user.id,
        listing_id,
        amount_aud: 500,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send emails
    const customerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email || 'Customer'
    const vanName = listing ? `${listing.model_year ?? ''} ${listing.model_name}`.trim() : listing_id

    // Confirmation to customer
    if (user.email) {
      sendEmail({
        to: user.email,
        ...emailTemplates.depositHoldEmail(customerName, vanName, 500),
      }).catch(() => {})
    }

    // Notification to admin
    sendEmail({
      to: 'jared@dreamdrive.life',
      ...emailTemplates.depositHoldAdminEmail(
        customerName,
        user.email || '',
        profile?.phone ?? '',
        vanName,
        hold.id,
      ),
    }).catch(() => {})

    return NextResponse.json({ success: true, id: hold.id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('deposit_holds')
      .select('*, listing:listings(id, model_name, model_year, photos)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
