export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
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

    // Send email via Resend if API key is configured
    if (process.env.RESEND_API_KEY) {
      const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email
      const vanName = listing ? `${listing.model_year ?? ''} ${listing.model_name}` : listing_id
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Dream Drive <noreply@dreamdrive.life>',
          to: 'jared@dreamdrive.life',
          subject: `New Deposit Hold Request — ${vanName}`,
          html: `
            <h2>New Deposit Hold Request</h2>
            <p><strong>Customer:</strong> ${name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone:</strong> ${profile?.phone ?? 'Not provided'}</p>
            <p><strong>Van:</strong> ${vanName} (ID: ${listing_id})</p>
            <p><strong>Hold ID:</strong> ${hold.id}</p>
            <p><strong>Amount:</strong> $500 AUD</p>
          `,
        }),
      }).catch(err => console.warn('Email send failed:', err))
    }

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
