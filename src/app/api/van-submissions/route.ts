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
    const {
      name, email, phone,
      model_name, model_year, body_type, mileage_km,
      transmission, asking_price_aud, location, notes,
      photos,
    } = body

    if (!name || !email || !model_name) {
      return NextResponse.json({ error: 'Name, email, and van model are required.' }, { status: 400 })
    }
    if (!photos || photos.length < 6) {
      return NextResponse.json({ error: 'Please upload at least 6 photos.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if this is a trusted submitter
    const { data: trusted } = await supabase
      .from('trusted_submitters')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    const isTrusted = !!trusted
    let listingId: string | null = null

    // If trusted, create listing immediately
    if (isTrusted) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barecamper.com.au'
      const { data: listing, error: listingErr } = await supabase
        .from('listings')
        .insert({
          source: 'customer_upload',
          model_name,
          model_year: model_year ?? null,
          transmission: transmission ?? null,
          mileage_km: mileage_km ?? null,
          au_price_aud: asking_price_aud ?? null,
          description: notes ?? null,
          photos,
          status: 'available',
          is_community_find: true,
          featured: false,
        })
        .select('id')
        .single()

      if (!listingErr && listing) {
        listingId = listing.id
        // Email customer — listing is live
        sendEmail({
          to: email,
          ...emailTemplates.vanSubmissionAutoPublishedEmail(
            name, model_name, model_year ?? null,
            `${baseUrl}/van/${listing.id}`
          ),
        }).catch(() => {})
      }
    } else {
      // Send "we'll review it" email
      sendEmail({
        to: email,
        ...emailTemplates.vanSubmissionReceivedEmail(name, model_name, model_year ?? null),
      }).catch(() => {})
    }

    // Create the submission record
    const { data: submission, error } = await supabase
      .from('van_submissions')
      .insert({
        name, email: email.toLowerCase().trim(),
        phone: phone || null,
        model_name, model_year: model_year ?? null,
        body_type: body_type ?? null,
        mileage_km: mileage_km ?? null,
        transmission: transmission ?? null,
        asking_price_aud: asking_price_aud ?? null,
        location: location ?? null,
        notes: notes ?? null,
        photos,
        status: isTrusted ? 'approved' : 'pending_review',
        listing_id: listingId,
        auto_published: isTrusted,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[van-submissions] insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update listing with submission_id back-reference
    if (listingId && submission) {
      await supabase
        .from('listings')
        .update({ submission_id: submission.id })
        .eq('id', listingId)
    }

    // Admin notification (fire-and-forget)
    sendEmail({
      to: 'jared@dreamdrive.life',
      ...emailTemplates.vanSubmissionAdminEmail(
        name, email, phone ?? '',
        model_name, model_year ?? null,
        location ?? '', asking_price_aud ?? null,
        photos, isTrusted,
      ),
    }).catch(() => {})

    return NextResponse.json({ ok: true, id: submission.id, auto_published: isTrusted, listing_id: listingId })
  } catch (err) {
    console.error('[van-submissions] unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('van_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
