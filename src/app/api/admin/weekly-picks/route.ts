export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email'
import { centsToAud } from '@/lib/utils'

// POST — generate and send the weekly auction picks email to all stock alert subscribers
// Can also be called with { preview: true } to return HTML without sending
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email?.endsWith('@dreamdrive.life')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const preview = body?.preview === true

  const admin = createAdminClient()

  // Get top auction vans coming up (next 7 days, highest grade first)
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { data: picks } = await admin
    .from('listings')
    .select('id, model_name, model_year, mileage_km, drive, transmission, inspection_score, body_colour, aud_estimate, photos, auction_date, auction_time, size, displacement_cc')
    .eq('status', 'available')
    .eq('source', 'auction')
    .gte('auction_date', now.toISOString().slice(0, 10))
    .lte('auction_date', nextWeek.toISOString().slice(0, 10))
    .order('inspection_score', { ascending: false })
    .limit(5)

  if (!picks?.length) {
    return NextResponse.json({ ok: false, message: 'No auction vans this week' })
  }

  const vanListHtml = picks.map(van => {
    const title = `${van.model_year ?? ''} ${van.model_name}`.trim()
    const photo = van.photos?.[0]
    const price = van.aud_estimate ? `~${centsToAud(van.aud_estimate)}` : 'POA'
    const specs = [
      van.mileage_km ? `${van.mileage_km.toLocaleString()} km` : null,
      van.drive,
      van.inspection_score ? `Grade ${van.inspection_score}` : null,
      van.size,
    ].filter(Boolean).join(' · ')

    const auctionDate = van.auction_date
      ? new Date(van.auction_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
      : ''

    return `
      <div style="margin-bottom: 24px; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        ${photo ? `<img src="${photo}" alt="${title}" style="width: 100%; height: 180px; object-fit: cover;" />` : ''}
        <div style="padding: 16px;">
          <p style="font-weight: 700; color: #2C2C2A; font-size: 16px; margin: 0 0 4px;">${title}</p>
          <p style="color: #888; font-size: 13px; margin: 0 0 8px;">${specs}</p>
          <p style="color: #3D6B73; font-weight: 700; font-size: 18px; margin: 0 0 4px;">${price}</p>
          <p style="color: #b45309; font-size: 12px; font-weight: 600; margin: 0 0 12px;">Auction: ${auctionDate}</p>
          <a href="https://barecamper.com.au/van/${van.id}" style="display: inline-block; background: #3D6B73; color: white; padding: 8px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
            View & Hold →
          </a>
        </div>
      </div>
    `
  }).join('')

  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
      <p style="color: #8B7355; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Bare Camper</p>
      <h1 style="color: #2C2C2A; font-size: 24px; margin: 8px 0 8px;">This Week's Top Auction Picks</h1>
      <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
        Here are the ${picks.length} best vans going through Japanese auction this week — hand-picked based on grade, mileage, and value. Want one? Hit "View & Hold" to place a $2,750 refundable deposit before it sells.
      </p>
      ${vanListHtml}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #555; font-size: 13px; line-height: 1.6;">
        <strong>How it works:</strong> Place a $2,750 refundable deposit and we'll bid on your behalf. If we win, the deposit comes off the final price. If we don't, you get it back in full.
      </p>
      <p style="color: #555; font-size: 13px; margin-top: 12px;">
        Got questions? Reply to this email or <a href="https://wa.me/61432182892" style="color: #3D6B73;">chat on WhatsApp</a>.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 11px;">
        You're receiving this because you signed up for stock alerts on <a href="https://barecamper.com.au" style="color: #3D6B73;">barecamper.com.au</a>.
      </p>
    </div>
  `

  if (preview) {
    return NextResponse.json({ ok: true, html: emailHtml, pick_count: picks.length })
  }

  // Send to all stock alert subscribers
  const { data: alerts } = await admin
    .from('stock_alerts')
    .select('email')

  const sentEmails = new Set<string>()
  let sent = 0

  for (const alert of (alerts ?? [])) {
    if (sentEmails.has(alert.email)) continue
    sentEmails.add(alert.email)
    sendEmail({
      to: alert.email,
      subject: `This week's top auction picks — Bare Camper`,
      html: emailHtml,
    }).catch(() => {})
    sent++
  }

  // Also send to Jared
  sendEmail({
    to: 'jared@dreamdrive.life',
    subject: `[Weekly Picks Sent] ${picks.length} vans → ${sent} subscribers`,
    html: emailHtml,
  }).catch(() => {})

  return NextResponse.json({ ok: true, picks: picks.length, sent })
}
