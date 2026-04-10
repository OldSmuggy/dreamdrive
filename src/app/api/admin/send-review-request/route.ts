export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email'

// POST — send a Google review request email to a customer
// Body: { customer_id: string, customer_vehicle_id?: string }
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email?.endsWith('@dreamdrive.life')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { customer_id, customer_vehicle_id } = await req.json()
  if (!customer_id) return NextResponse.json({ error: 'customer_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch customer
  const { data: customer } = await admin
    .from('customers')
    .select('id, first_name, last_name, email')
    .eq('id', customer_id)
    .single()

  if (!customer?.email) return NextResponse.json({ error: 'Customer not found or no email' }, { status: 404 })

  // Optionally fetch the vehicle for personalisation
  let vanTitle = 'your van'
  if (customer_vehicle_id) {
    const { data: cv } = await admin
      .from('customer_vehicles')
      .select('vehicle_description, listing:listings(model_name, model_year)')
      .eq('id', customer_vehicle_id)
      .single()

    if (cv) {
      const listing = cv.listing as any
      vanTitle = listing
        ? `${listing.model_year ? `${listing.model_year} ` : ''}${listing.model_name}`
        : cv.vehicle_description || 'your van'
    }
  }

  const firstName = customer.first_name || 'there'
  const googleReviewUrl = 'https://g.page/r/barecamper/review' // Update with actual Google Business review link

  await sendEmail({
    to: customer.email,
    subject: `How's ${vanTitle} going? — Bare Camper`,
    html: `
      <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #2C2C2A;">Hey ${firstName}!</h2>
        <p style="color: #555; line-height: 1.7;">
          Hope you're loving ${vanTitle}. We just wanted to check in and see how everything's going.
        </p>
        <p style="color: #555; line-height: 1.7;">
          If you've got a spare minute, we'd really appreciate a quick Google review. It helps other people find us and gives future customers the confidence to go ahead with their build.
        </p>
        <p style="color: #555; line-height: 1.7;">
          Even a couple of sentences makes a huge difference.
        </p>
        <a href="${googleReviewUrl}" style="display: inline-block; background: #3D6B73; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 1rem 0;">
          ⭐ Leave a Quick Review
        </a>
        <p style="color: #555; font-size: 13px; margin-top: 1.5rem;">
          Got a photo of ${vanTitle} in the wild? Send it back — we'd love to feature it on our site (with your permission of course).
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 1.5rem 0;" />
        <p style="color: #aaa; font-size: 12px;">
          Cheers,<br/>Jared — Bare Camper<br/>
          <a href="mailto:hello@barecamper.com.au" style="color: #3D6B73;">hello@barecamper.com.au</a>
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true, sent_to: customer.email })
}
