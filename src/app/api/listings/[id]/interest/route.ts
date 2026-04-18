export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const { ok } = rateLimit(ip)
  if (!ok) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })

  try {
    const { id: listingId } = await params
    const body = await req.json()
    const { name, email, phone, message } = body

    if (!name?.trim() || !email?.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'Name and a valid email are required.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barecamper.com.au'

    // Verify listing exists and is a community find
    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .select('id, model_name, model_year, is_community_find, submission_id, status')
      .eq('id', listingId)
      .single()

    if (listingErr || !listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    }
    if (!listing.is_community_find) {
      return NextResponse.json({ error: 'Interest can only be expressed for community listings.' }, { status: 400 })
    }
    if (listing.status === 'sold') {
      return NextResponse.json({ error: 'This van has already been sold.' }, { status: 400 })
    }

    // Look up seller email from van_submissions
    let sellerName = 'there'
    let sellerEmail = ''
    if (listing.submission_id) {
      const { data: sub } = await supabase
        .from('van_submissions')
        .select('name, email')
        .eq('id', listing.submission_id)
        .single()
      if (sub) {
        sellerName = sub.name?.split(' ')[0] ?? 'there'
        sellerEmail = sub.email
      }
    }

    // Save interest to database
    const { error: insertErr } = await supabase
      .from('listing_interests')
      .insert({
        listing_id: listingId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        message: message?.trim() || null,
      })

    if (insertErr) {
      console.error('[listing-interest] insert error:', insertErr.message)
      return NextResponse.json({ error: 'Failed to save interest.' }, { status: 500 })
    }

    const vanTitle = `${listing.model_year ?? ''} ${listing.model_name}`.trim()
    const listingUrl = `${baseUrl}/van/${listingId}`

    // Email the seller (if we have their email)
    if (sellerEmail) {
      sendEmail({
        to: sellerEmail,
        ...emailTemplates.listingInterestSellerEmail(
          sellerName, vanTitle,
          name.trim(), email.trim(), phone?.trim() ?? '', message?.trim() ?? '',
          listingUrl,
        ),
      }).catch(() => {})
    }

    // Email admin (always)
    sendEmail({
      to: 'jared@dreamdrive.life',
      ...emailTemplates.listingInterestAdminEmail(
        vanTitle, sellerEmail || 'unknown',
        name.trim(), email.trim(), phone?.trim() ?? '', message?.trim() ?? '',
        listingUrl,
      ),
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[listing-interest] unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
