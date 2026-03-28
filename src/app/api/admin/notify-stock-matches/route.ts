export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email'
import { centsToAud } from '@/lib/utils'

// POST — when a listing goes live, notify matching stock alert subscribers + users who saved similar vans
// Body: { listing_id: string }
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  // Admin only
  if (!user?.email?.endsWith('@dreamdrive.life')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { listing_id } = await req.json()
  if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch the listing
  const { data: listing } = await admin
    .from('listings')
    .select('id, model_name, model_year, body_colour, mileage_km, drive, transmission, au_price_aud, aud_estimate, photos, source, size, displacement_cc')
    .eq('id', listing_id)
    .single()

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  const vanTitle = `${listing.model_year ? `${listing.model_year} ` : ''}${listing.model_name}`
  const photo = listing.photos?.[0] ?? ''
  const price = listing.au_price_aud
    ? centsToAud(listing.au_price_aud)
    : listing.aud_estimate
    ? `~${centsToAud(listing.aud_estimate)}`
    : 'POA'

  const vanUrl = `https://barecamper.com.au/van/${listing.id}`

  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
      <h2 style="color: #2C2C2A;">New van just listed — ${vanTitle}</h2>
      ${photo ? `<img src="${photo}" alt="${vanTitle}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 1rem;" />` : ''}
      <p style="color: #555;">
        <strong>${vanTitle}</strong><br/>
        ${listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km · ` : ''}${listing.drive ?? ''} ${listing.transmission ?? ''}<br/>
        <span style="color: #3D6B73; font-weight: 600; font-size: 18px;">${price}</span>
      </p>
      <a href="${vanUrl}" style="display: inline-block; background: #3D6B73; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 0.5rem;">
        View this van →
      </a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 1.5rem 0;" />
      <p style="color: #aaa; font-size: 12px;">You're getting this because you signed up for stock alerts on Bare Camper.</p>
    </div>
  `

  // 1. Notify stock alert subscribers
  const { data: alerts } = await admin
    .from('stock_alerts')
    .select('email, name, notes')

  const notifiedEmails = new Set<string>()
  let alertsSent = 0

  for (const alert of (alerts ?? [])) {
    if (notifiedEmails.has(alert.email)) continue
    notifiedEmails.add(alert.email)

    sendEmail({
      to: alert.email,
      subject: `New stock alert: ${vanTitle} — Bare Camper`,
      html: emailHtml,
    }).catch(() => {})
    alertsSent++
  }

  // 2. Notify users who saved vans with similar specs (same model or source)
  const { data: savedUsers } = await admin
    .from('saved_vans')
    .select('user_id, listing:listings!inner(model_name, source)')

  const userIdsToNotify = new Set<string>()
  for (const sv of (savedUsers ?? [])) {
    const saved = sv.listing as any
    if (!saved) continue
    // Match if same model name or same source type
    if (saved.model_name === listing.model_name || saved.source === listing.source) {
      userIdsToNotify.add(sv.user_id)
    }
  }

  let savedUsersSent = 0
  for (const userId of Array.from(userIdsToNotify)) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(userId)
      if (authUser?.user?.email && !notifiedEmails.has(authUser.user.email)) {
        notifiedEmails.add(authUser.user.email)
        sendEmail({
          to: authUser.user.email,
          subject: `A van you might like: ${vanTitle} — Bare Camper`,
          html: emailHtml.replace(
            "You're getting this because you signed up for stock alerts",
            "You're getting this because you saved a similar van"
          ),
        }).catch(() => {})
        savedUsersSent++
      }
    } catch { /* skip */ }
  }

  return NextResponse.json({
    ok: true,
    alerts_sent: alertsSent,
    saved_users_sent: savedUsersSent,
    total: alertsSent + savedUsersSent,
  })
}
