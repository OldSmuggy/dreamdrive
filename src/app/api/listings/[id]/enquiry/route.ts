export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

// POST — send an enquiry about a specific listing
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch listing for context
  const { data: listing } = await admin
    .from('listings')
    .select('model_name, model_year')
    .eq('id', params.id)
    .single()

  const vanTitle = listing
    ? `${listing.model_year ? `${listing.model_year} ` : ''}${listing.model_name}`
    : `Listing ${params.id}`

  // Email Jared
  sendEmail({
    to: 'jared@dreamdrive.life',
    subject: `Enquiry about ${vanTitle} — Bare Camper`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #2C2C2A;">Van Enquiry</h2>
        <p><strong>Van:</strong> ${vanTitle}</p>
        <p><strong>From:</strong> ${user.email}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left: 3px solid #3D6B73; padding-left: 1rem; color: #555; margin: 0.5rem 0 1rem;">${message.trim()}</blockquote>
        <a href="https://barecamper.com.au/van/${params.id}" style="color: #3D6B73;">View listing →</a>
      </div>
    `,
  }).catch(() => {})

  // Confirmation to user
  sendEmail({
    to: user.email!,
    subject: `Message received — ${vanTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #2C2C2A;">Got it!</h2>
        <p style="color: #555;">We've received your message about the <strong>${vanTitle}</strong> and will get back to you shortly.</p>
        <p style="color: #888; font-size: 13px; margin-top: 1rem;">Your message: &ldquo;${message.trim()}&rdquo;</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 1.5rem 0;" />
        <p style="color: #aaa; font-size: 12px;">Bare Camper · hello@barecamper.com.au</p>
      </div>
    `,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
