export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import { requireAdmin } from '@/lib/api-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  try {
    const body = await req.json()
    const { action, admin_notes, publish } = body
    // action: 'approve' | 'reject' | 'pay_fee' | 'notes'
    // publish: boolean — if true on approve, listing goes live immediately

    const supabase = createAdminClient()

    // Fetch the submission
    const { data: sub, error: fetchErr } = await supabase
      .from('van_submissions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchErr || !sub) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barecamper.com.au'

    if (action === 'approve') {
      // Create a listing from the submission
      const { data: listing, error: listingErr } = await supabase
        .from('listings')
        .insert({
          source: 'customer_upload',
          model_name: sub.model_name,
          model_year: sub.model_year,
          transmission: sub.transmission,
          mileage_km: sub.mileage_km,
          au_price_aud: sub.asking_price_aud,
          description: sub.notes,
          photos: sub.photos,
          status: publish ? 'available' : 'available',  // always available, admin controls visibility
          is_community_find: true,
          featured: false,
          contact_preference: sub.contact_preference ?? 'email',
          submission_id: sub.id,
        })
        .select('id')
        .single()

      if (listingErr || !listing) {
        console.error('[van-submissions approve] listing error:', listingErr?.message)
        return NextResponse.json({ error: listingErr?.message ?? 'Failed to create listing' }, { status: 500 })
      }

      // Update submission
      const { error: updateErr } = await supabase
        .from('van_submissions')
        .update({
          status: 'approved',
          listing_id: listing.id,
          admin_notes: admin_notes ?? sub.admin_notes,
        })
        .eq('id', params.id)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      const listingUrl = `${baseUrl}/van/${listing.id}`

      // Email customer
      sendEmail({
        to: sub.email,
        ...emailTemplates.vanSubmissionApprovedEmail(
          sub.name, sub.model_name, sub.model_year, listingUrl
        ),
      }).catch(() => {})

      return NextResponse.json({ ok: true, listing_id: listing.id, listing_url: listingUrl })
    }

    if (action === 'reject') {
      await supabase
        .from('van_submissions')
        .update({ status: 'rejected', admin_notes: admin_notes ?? sub.admin_notes })
        .eq('id', params.id)

      // Email customer — polite rejection
      sendEmail({
        to: sub.email,
        ...emailTemplates.vanSubmissionRejectedEmail(sub.name, sub.model_name),
      }).catch(() => {})

      return NextResponse.json({ ok: true })
    }

    if (action === 'pay_fee') {
      await supabase
        .from('van_submissions')
        .update({ fee_paid_at: new Date().toISOString() })
        .eq('id', params.id)

      const vanTitle = `${sub.model_year ? `${sub.model_year} ` : ''}${sub.model_name}`
      sendEmail({
        to: sub.email,
        ...emailTemplates.vanSubmissionFeeEarnedEmail(sub.name, vanTitle, sub.finders_fee_aud),
      }).catch(() => {})

      return NextResponse.json({ ok: true })
    }

    if (action === 'notes') {
      await supabase
        .from('van_submissions')
        .update({ admin_notes })
        .eq('id', params.id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[van-submissions PATCH] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
