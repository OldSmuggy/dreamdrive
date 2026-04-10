export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'
import {
  sendEmail,
  dealCreatedCustomerEmail,
  dealCreatedBuyerEmail,
} from '@/lib/email'
import type { DealStatus } from '@/types'

// ── 11 order stages (same as customer vehicles route) ──
const STAGE_ORDER = [
  'vehicle_selection',
  'bidding',
  'purchase',
  'storage',
  'design_approval',
  'van_building',
  'shipping',
  'compliance',
  'pop_top_install',
  'ready_for_delivery',
  'delivered',
]

// ── Admin auth helper ──
async function requireAdmin() {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return { user: null, error: authErr }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()
  const isAdmin = profile?.is_admin || user!.email?.endsWith('@dreamdrive.life')
  if (!isAdmin) return { user: null, error: NextResponse.json({ error: 'Admin only' }, { status: 403 }) }

  return { user: user!, error: null }
}

// ── GET: List deals ──
export async function GET(request: NextRequest) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')

  let query = admin
    .from('deals')
    .select(`
      *,
      listing:listings(*),
      customer:user_profiles!deals_customer_id_fkey(id, first_name, last_name, phone),
      buyer:buyers(*)
    `)
    .order('created_at', { ascending: false })

  if (statusFilter === 'active') {
    query = query.in('status', [
      'draft',
      'deposit_pending',
      'deposit_received',
      'bidding',
      'won',
      'shipping',
    ] as DealStatus[])
  } else if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: deals, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch emails from auth.users for each customer (user_profiles doesn't have email)
  const customerIds = Array.from(new Set((deals || []).map((d: Record<string, unknown>) => d.customer_id as string)))
  const emailMap: Record<string, string> = {}
  for (const cid of customerIds) {
    const { data: authUser } = await admin.auth.admin.getUserById(cid)
    if (authUser?.user?.email) emailMap[cid] = authUser.user.email
  }

  const enriched = (deals || []).map((deal: Record<string, unknown>) => ({
    ...deal,
    customer: {
      ...(deal.customer as Record<string, unknown> || {}),
      email: emailMap[deal.customer_id as string] || null,
    },
  }))

  return NextResponse.json(enriched)
}

// ── POST: Create a new deal ──
export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const admin = createAdminClient()
  const body = await request.json()
  const { listing_id, customer_id, buyer_id, notes } = body as {
    listing_id: string
    customer_id: string
    buyer_id: string
    notes?: string
  }

  if (!listing_id || !customer_id || !buyer_id) {
    return NextResponse.json(
      { error: 'listing_id, customer_id, and buyer_id are required' },
      { status: 400 }
    )
  }

  // 1. Fetch listing
  const { data: listing, error: listingErr } = await admin
    .from('listings')
    .select('*')
    .eq('id', listing_id)
    .single()
  if (listingErr || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // 2. Fetch customer from customers table
  const { data: customer, error: customerErr } = await admin
    .from('customers')
    .select('id, first_name, last_name, email, phone')
    .eq('id', customer_id)
    .single()
  if (customerErr || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }
  const customerEmail = customer.email || null

  // 3. Fetch buyer
  const { data: buyer, error: buyerErr } = await admin
    .from('buyers')
    .select('*')
    .eq('id', buyer_id)
    .single()
  if (buyerErr || !buyer) {
    return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
  }

  // 4. Create deal record (status: draft)
  const { data: deal, error: dealErr } = await admin
    .from('deals')
    .insert({
      listing_id,
      customer_id,
      buyer_id,
      status: 'draft' as DealStatus,
      notes: notes || null,
    })
    .select()
    .single()
  if (dealErr || !deal) {
    return NextResponse.json({ error: dealErr?.message || 'Failed to create deal' }, { status: 500 })
  }

  // 5. Create customer_vehicle + 11 order stages (same pattern as /api/customers/[id]/vehicles)
  const { data: vehicle, error: vehicleErr } = await admin
    .from('customer_vehicles')
    .insert({
      customer_id,
      listing_id,
      vehicle_status: 'searching',
      vehicle_description: `${listing.model_year ?? ''} ${listing.model_name}${listing.grade ? ' — ' + listing.grade : ''}`.trim(),
      deal_id: deal.id,
      notes: notes || null,
      sort_order: 0,
    })
    .select()
    .single()

  if (vehicleErr || !vehicle) {
    // Clean up the deal if vehicle creation fails
    await admin.from('deals').delete().eq('id', deal.id)
    return NextResponse.json({ error: vehicleErr?.message || 'Failed to create customer vehicle' }, { status: 500 })
  }

  // Auto-create all 11 order stages
  const now = new Date().toISOString()
  const stages = STAGE_ORDER.map((stage, i) => ({
    customer_vehicle_id: vehicle.id,
    stage,
    status: i === 0 ? 'current' : 'upcoming',
    entered_at: i === 0 ? now : null,
  }))
  await admin.from('order_stages').insert(stages)

  // Update deal with customer_vehicle_id
  await admin
    .from('deals')
    .update({ customer_vehicle_id: vehicle.id })
    .eq('id', deal.id)

  // 6. Build van details
  const vanTitle = [listing.model_name, listing.grade].filter(Boolean).join(' — ')
  const year = listing.model_year ?? 'Unknown year'
  const mileage = listing.mileage_km
    ? Number(listing.mileage_km).toLocaleString()
    : 'Unknown'
  const score = listing.inspection_score ?? '—'
  const chassisCode = listing.chassis_code ?? '—'
  const auctionDate = listing.auction_date ?? '—'
  const kaijo = listing.kaijo_code ?? '—'
  const bidNo = listing.bid_no ?? '—'
  const startPrice = listing.start_price_jpy
    ? Number(listing.start_price_jpy).toLocaleString()
    : '—'
  const listingUrl = `https://barecamper.com.au/vans/${listing.id}`

  const vanDetails = {
    year: String(year),
    mileage: `${mileage} km`,
    chassis: chassisCode,
    score: String(score),
    auctionDate,
    venue: String(kaijo),
    lot: String(bidNo),
    startPrice: `\u00A5${startPrice}`,
    photos: (listing.photos ?? []).slice(0, 4) as string[],
  }

  // Customer name: first name + last initial (e.g. "Morgan W.")
  const customerFirstName = customer.first_name || 'Customer'
  const customerLastInitial = customer.last_name ? `${customer.last_name.charAt(0)}.` : ''
  const customerFirstNameInitial = `${customerFirstName} ${customerLastInitial}`.trim()
  const customerFullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Customer'

  // 7. Email buyer
  const buyerEmailData = dealCreatedBuyerEmail(
    customerFirstNameInitial,
    `${year} ${vanTitle}`,
    vanDetails,
    { auctionDate, venue: String(kaijo), lot: String(bidNo), startPrice: `\u00A5${startPrice}` },
    listingUrl
  )
  const buyerEmailResult = await sendEmail({
    to: buyer.email,
    subject: buyerEmailData.subject,
    html: buyerEmailData.html,
  })

  // 8. Email customer
  let customerEmailResult = { success: false }
  if (customerEmail) {
    const customerEmailData = dealCreatedCustomerEmail(
      customerFirstName,
      `${year} ${vanTitle}`,
      vanDetails,
      listingUrl
    )
    customerEmailResult = await sendEmail({
      to: customerEmail,
      subject: customerEmailData.subject,
      html: customerEmailData.html,
    })
  }

  // 9. Generate WhatsApp links
  const customerPhone = customer.phone?.replace(/[\s\-()]/g, '').replace(/^\+/, '') || ''
  const buyerPhone = (buyer.whatsapp_number || buyer.phone || '').replace(/[\s\-()]/g, '').replace(/^\+/, '')

  const customerWhatsAppMessage = `G'day ${customerFirstName}! \u{1F690} Great news \u2014 we've found your van at auction in Japan!\n\n${year} ${vanTitle} \u2014 ${mileage}km\nAuction Score: ${score}\n${listingUrl}\n\nReady to lock this one in? We just need a deposit to get our buyer in Japan bidding for you. Let me know if you have any questions!`

  const buyerWhatsAppMessage = `Hi ${buyer.name.split(' ')[0]},\n\nNew purchase request from Bare Camper:\n\nVehicle: ${year} ${vanTitle}\nMileage: ${mileage}km\nChassis: ${chassisCode}\nAuction: ${auctionDate} at ${kaijo}\nLot: ${bidNo}\nStart Price: \u00A5${startPrice}\n\nCustomer: ${customerFirstNameInitial}\nLink: ${listingUrl}\n${notes ? `\nNotes: ${notes}\n` : ''}\nPlease confirm availability and proceed with bidding.\n\nCheers,\nBare Camper Team`

  const customerWhatsAppUrl = customerPhone
    ? `https://wa.me/${customerPhone}?text=${encodeURIComponent(customerWhatsAppMessage)}`
    : null
  const buyerWhatsAppUrl = buyerPhone
    ? `https://wa.me/${buyerPhone}?text=${encodeURIComponent(buyerWhatsAppMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(buyerWhatsAppMessage)}`

  return NextResponse.json({
    deal: { ...deal, customer_vehicle_id: vehicle.id },
    customerWhatsAppUrl,
    buyerWhatsAppUrl,
    emailStatus: {
      buyer: buyerEmailResult.success,
      customer: customerEmailResult.success,
    },
  })
}
