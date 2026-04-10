export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

// PATCH — publish a draft listing (make it live)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { action } = await req.json()
  const admin = createAdminClient()

  // Verify this listing belongs to the user
  const { data: listing } = await admin
    .from('listings')
    .select('id, model_name, model_year, submitted_by, status')
    .eq('id', params.id)
    .eq('submitted_by', user.id)
    .single()

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  if (action === 'publish') {
    // Check if trusted submitter → go live immediately, otherwise email Jared to approve
    const { data: trusted } = await admin
      .from('trusted_submitters')
      .select('id')
      .eq('email', user.email!.toLowerCase().trim())
      .maybeSingle()

    const isTrusted = !!trusted
    const newStatus = isTrusted ? 'available' : 'pending_review'

    await admin
      .from('listings')
      .update({ status: newStatus })
      .eq('id', params.id)

    if (!isTrusted) {
      // Email Jared to review
      const vanTitle = `${listing.model_year ? `${listing.model_year} ` : ''}${listing.model_name}`
      sendEmail({
        to: 'jared@dreamdrive.life',
        subject: `Listing publish request — ${vanTitle}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
            <h2 style="color: #2C2C2A;">Publish Request</h2>
            <p><strong>${user.email}</strong> has requested to publish their listing:</p>
            <p style="font-weight: 600; color: #2C2C2A;">${vanTitle}</p>
            <a href="https://barecamper.com.au/admin/listings" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; margin-top: 1rem;">
              Review in Admin →
            </a>
          </div>
        `,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, status: newStatus, auto_published: isTrusted })
  }

  if (action === 'unpublish') {
    await admin
      .from('listings')
      .update({ status: 'draft' })
      .eq('id', params.id)
    return NextResponse.json({ ok: true, status: 'draft' })
  }

  if (action === 'delete') {
    // Only allow deleting drafts
    if (listing.status !== 'draft') {
      return NextResponse.json({ error: 'Can only delete draft listings' }, { status: 400 })
    }
    await admin.from('listings').delete().eq('id', params.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
