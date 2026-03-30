export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

const BUYER_EMAIL = 'takahashi@global-standard.jp'
const BUYER_NAME = 'Naoyuki Takahashi'

export async function POST(request: NextRequest) {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr

  // Check admin
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()
  const isAdmin = profile?.is_admin || user!.email?.endsWith('@dreamdrive.life')
  if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await request.json()
  const { listing_id, customer_name, notes } = body as {
    listing_id: string
    customer_name?: string
    notes?: string
  }

  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id is required' }, { status: 400 })
  }

  // Fetch listing
  const { data: listing, error: listingErr } = await admin
    .from('listings')
    .select('*')
    .eq('id', listing_id)
    .single()

  if (listingErr || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Build van details
  const vanTitle = [listing.model_name, listing.grade].filter(Boolean).join(' — ')
  const year = listing.model_year ?? 'Unknown year'
  const mileage = listing.mileage_km
    ? `${Number(listing.mileage_km).toLocaleString()} km`
    : 'Unknown'
  const engine = listing.engine ?? listing.displacement_cc
    ? `${listing.displacement_cc}cc`
    : 'Unknown'
  const transmission = listing.transmission ?? 'Unknown'
  const colour = listing.body_colour ?? 'Unknown'
  const inspectionScore = listing.inspection_score ?? '—'
  const chassisCode = listing.chassis_code ?? '—'

  // Auction info
  const auctionDate = listing.auction_date ?? '—'
  const kaijo = (listing as Record<string, unknown>).kaijo_code ?? '—'
  const bidNo = (listing as Record<string, unknown>).bid_no ?? '—'
  const startPrice = listing.start_price_jpy
    ? `${Number(listing.start_price_jpy).toLocaleString()}`
    : '—'

  // Photos — first 4
  const photos: string[] = (listing.photos ?? []).slice(0, 4)
  const photosHtml = photos.length > 0
    ? photos
        .map(
          (url: string) =>
            `<img src="${url}" alt="Van photo" style="width: 280px; height: auto; border-radius: 8px; display: inline-block; margin: 4px;" />`
        )
        .join('\n')
    : '<p style="color: #888;">No photos available</p>'

  // Listing URL
  const listingUrl = `https://barecamper.com.au/vans/${listing.id}`

  const subject = `Purchase Request \u2014 ${vanTitle} ${year}`

  const html = `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: #2C2C2A; padding: 1.5rem 2rem; text-align: center;">
        <h1 style="color: #E8CFA0; margin: 0; font-size: 1.25rem;">Bare Camper</h1>
        <p style="color: #999; margin: 0.25rem 0 0; font-size: 0.8rem;">Purchase Request</p>
      </div>

      <div style="padding: 2rem;">
        <p style="color: #444; line-height: 1.6; margin-bottom: 1.5rem;">
          Hi ${BUYER_NAME},<br><br>
          We'd like to proceed with the purchase of the following vehicle on behalf of Bare Camper.
          ${customer_name ? `<br><br><strong>Customer:</strong> ${customer_name}` : ''}
          ${notes ? `<br><strong>Notes:</strong> ${notes}` : ''}
        </p>

        <div style="background: #F5F3ED; padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 0.75rem; font-size: 1.1rem;">${vanTitle}</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr>
              <td style="padding: 0.35rem 0; color: #888; width: 140px;">Year</td>
              <td style="padding: 0.35rem 0; color: #222;">${year}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Mileage</td>
              <td style="padding: 0.35rem 0; color: #222;">${mileage}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Engine</td>
              <td style="padding: 0.35rem 0; color: #222;">${engine}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Transmission</td>
              <td style="padding: 0.35rem 0; color: #222;">${transmission}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Colour</td>
              <td style="padding: 0.35rem 0; color: #222;">${colour}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Chassis Code</td>
              <td style="padding: 0.35rem 0; color: #222;">${chassisCode}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Inspection Score</td>
              <td style="padding: 0.35rem 0; color: #222;">${inspectionScore}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Auction Date</td>
              <td style="padding: 0.35rem 0; color: #222;">${auctionDate}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Kaijo / Venue</td>
              <td style="padding: 0.35rem 0; color: #222;">${kaijo}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Bid No.</td>
              <td style="padding: 0.35rem 0; color: #222;">${bidNo}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Start Price</td>
              <td style="padding: 0.35rem 0; color: #222;">&yen;${startPrice}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <p style="color: #888; font-size: 0.8rem; margin-bottom: 0.5rem;">Photos:</p>
          ${photosHtml}
        </div>

        <p style="color: #444; line-height: 1.6; margin-bottom: 1rem;">
          Please proceed with the purchase on behalf of Bare Camper. Let us know if you need any additional information.
        </p>

        <a href="${listingUrl}" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem;">
          View Listing
        </a>

        <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;">
        <p style="color: #888; font-size: 0.8rem;">
          Bare Camper &mdash; Dream Drive Pty Ltd<br>
          hello@barecamper.com.au
        </p>
      </div>
    </div>
  `

  const result = await sendEmail({
    to: BUYER_EMAIL,
    subject,
    html,
  })

  if (result.success) {
    return NextResponse.json({ success: true, vanTitle, year })
  }

  return NextResponse.json(
    { success: false, error: String(result.error) },
    { status: 500 }
  )
}
