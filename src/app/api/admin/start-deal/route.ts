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
  const { listing_id, customer_name, customer_phone, customer_email, notes } = body as {
    listing_id: string
    customer_name: string
    customer_phone: string
    customer_email?: string
    notes?: string
  }

  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id is required' }, { status: 400 })
  }
  if (!customer_name) {
    return NextResponse.json({ error: 'customer_name is required' }, { status: 400 })
  }
  if (!customer_phone) {
    return NextResponse.json({ error: 'customer_phone is required' }, { status: 400 })
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
    ? Number(listing.mileage_km).toLocaleString()
    : 'Unknown'
  const score = listing.inspection_score ?? '—'
  const chassisCode = listing.chassis_code ?? '—'
  const auctionDate = listing.auction_date ?? '—'
  const kaijo = (listing as Record<string, unknown>).kaijo_code ?? '—'
  const bidNo = (listing as Record<string, unknown>).bid_no ?? '—'
  const startPrice = listing.start_price_jpy
    ? Number(listing.start_price_jpy).toLocaleString()
    : '—'

  const listingUrl = `https://barecamper.com.au/vans/${listing.id}`

  // Clean phone number for wa.me link (strip spaces, dashes, etc.)
  const cleanPhone = customer_phone.replace(/[\s\-()]/g, '').replace(/^\+/, '')

  // ── WhatsApp message to customer ──
  const customerMessage = `G'day ${customer_name}! \u{1F690} Great news — we've found your van at auction in Japan!\n\n${year} ${vanTitle} — ${mileage}km\nAuction Score: ${score}\n${listingUrl}\n\nReady to lock this one in? We just need a deposit to get our buyer in Japan bidding for you. Let me know if you have any questions!`

  const customerWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customerMessage)}`

  // ── WhatsApp message to Nao (using email since phone unknown) ──
  const naoMessage = `Hi Nao,\n\nNew purchase request from Bare Camper:\n\nVehicle: ${year} ${vanTitle}\nMileage: ${mileage}km\nChassis: ${chassisCode}\nAuction: ${auctionDate} at ${kaijo}\nLot: ${bidNo}\nStart Price: \u00A5${startPrice}\n\nCustomer: ${customer_name}\nLink: ${listingUrl}\n${notes ? `\nNotes: ${notes}\n` : ''}\nPlease confirm availability and proceed with bidding.\n\nCheers,\nBare Camper Team`

  // We don't have Nao's phone, so we'll generate a wa.me link placeholder
  // and also send an email
  const naoWhatsAppUrl = `https://wa.me/?text=${encodeURIComponent(naoMessage)}`

  // ── Send email to Nao via Resend ──
  const photos: string[] = (listing.photos ?? []).slice(0, 4)
  const photosHtml = photos.length > 0
    ? photos
        .map(
          (url: string) =>
            `<img src="${url}" alt="Van photo" style="width: 280px; height: auto; border-radius: 8px; display: inline-block; margin: 4px;" />`
        )
        .join('\n')
    : '<p style="color: #888;">No photos available</p>'

  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: #2C2C2A; padding: 1.5rem 2rem; text-align: center;">
        <h1 style="color: #E8CFA0; margin: 0; font-size: 1.25rem;">Bare Camper</h1>
        <p style="color: #999; margin: 0.25rem 0 0; font-size: 0.8rem;">New Deal Started</p>
      </div>

      <div style="padding: 2rem;">
        <p style="color: #444; line-height: 1.6; margin-bottom: 1.5rem;">
          Hi ${BUYER_NAME},<br><br>
          We have a customer ready to proceed with this vehicle. Please confirm availability and begin bidding.
        </p>

        <div style="background: #F5F3ED; padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 0.75rem; font-size: 1.1rem;">${year} ${vanTitle}</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr>
              <td style="padding: 0.35rem 0; color: #888; width: 140px;">Mileage</td>
              <td style="padding: 0.35rem 0; color: #222;">${mileage} km</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Chassis</td>
              <td style="padding: 0.35rem 0; color: #222;">${chassisCode}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Auction Score</td>
              <td style="padding: 0.35rem 0; color: #222;">${score}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Auction Date</td>
              <td style="padding: 0.35rem 0; color: #222;">${auctionDate}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Venue</td>
              <td style="padding: 0.35rem 0; color: #222;">${kaijo}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Lot</td>
              <td style="padding: 0.35rem 0; color: #222;">${bidNo}</td>
            </tr>
            <tr>
              <td style="padding: 0.35rem 0; color: #888;">Start Price</td>
              <td style="padding: 0.35rem 0; color: #222;">&yen;${startPrice}</td>
            </tr>
          </table>
        </div>

        <div style="background: #EEF7ED; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <p style="font-size: 0.9rem; color: #2C2C2A; margin: 0;">
            <strong>Customer:</strong> ${customer_name}<br>
            ${customer_phone ? `<strong>Phone:</strong> ${customer_phone}<br>` : ''}
            ${customer_email ? `<strong>Email:</strong> ${customer_email}<br>` : ''}
            ${notes ? `<strong>Notes:</strong> ${notes}` : ''}
          </p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <p style="color: #888; font-size: 0.8rem; margin-bottom: 0.5rem;">Photos:</p>
          ${photosHtml}
        </div>

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

  const emailResult = await sendEmail({
    to: BUYER_EMAIL,
    subject: `New Deal Started — ${year} ${vanTitle} — ${customer_name}`,
    html: emailHtml,
  })

  // ── Record deal request in database ──
  // Try to insert into deal_requests table; if it doesn't exist, log and continue
  try {
    await admin.from('deal_requests').insert({
      listing_id,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      notes: notes || null,
      status: 'pending',
    })
  } catch (err) {
    console.warn('[start-deal] Could not record deal_request:', err)
  }

  return NextResponse.json({
    success: true,
    vanTitle: `${year} ${vanTitle}`,
    customerWhatsAppUrl,
    naoWhatsAppUrl,
    emailSent: emailResult.success,
  })
}
