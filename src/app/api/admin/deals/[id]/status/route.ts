export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'
import {
  sendEmail,
  dealStatusCustomerEmail,
  dealStatusBuyerEmail,
} from '@/lib/email'
import type { DealStatus } from '@/types'

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

// ── Status → vehicle_status + order_stage mapping ──
const STATUS_MAP: Record<string, { vehicleStatus: string; stage: string }> = {
  draft:             { vehicleStatus: 'searching',  stage: 'vehicle_selection' },
  deposit_pending:   { vehicleStatus: 'targeted',   stage: 'vehicle_selection' },
  deposit_received:  { vehicleStatus: 'targeted',   stage: 'bidding' },
  bidding:           { vehicleStatus: 'bidding',     stage: 'bidding' },
  won:               { vehicleStatus: 'purchased',   stage: 'purchase' },
  shipping:          { vehicleStatus: 'shipping',    stage: 'shipping' },
  delivered:         { vehicleStatus: 'delivered',   stage: 'delivered' },
}

// ── Customer-facing status messages (casual Aussie tone) ──
const CUSTOMER_MESSAGES: Record<string, string> = {
  draft:             "We're getting everything lined up for your van. Sit tight!",
  deposit_pending:   "We've locked eyes on your van! Just need your deposit to secure it and get bidding.",
  deposit_received:  "Deposit received \u2014 legend! Our team in Japan is prepping to bid on your van.",
  bidding:           "It's go time! Our buyer in Japan is bidding on your van right now. Fingers crossed!",
  won:               "WE GOT IT! \u{1F389} Your van has been purchased at auction. Next step: shipping it to Aus!",
  lost:              "Unfortunately we didn't win this one at auction. Don't stress \u2014 we'll find you another cracker.",
  shipping:          "Your van is on its way to Australia! We'll keep you posted on the shipping progress.",
  delivered:         "Your van has arrived in Australia! We'll be in touch about pickup/delivery details.",
  completed:         "All done! Enjoy your new van \u2014 happy travels! \u{1F30F}",
  cancelled:         "This deal has been cancelled. If you'd like to look at other vans, we're here to help.",
}

// ── Buyer-facing instructions (professional) ──
const BUYER_INSTRUCTIONS: Record<string, string> = {
  draft:             'Deal created. Awaiting deposit confirmation from customer before proceeding.',
  deposit_pending:   'Customer has been notified about deposit. Please stand by for bidding authorisation.',
  deposit_received:  'Deposit confirmed. Please proceed with auction registration and bidding preparation.',
  bidding:           'Bidding is now authorised. Please bid on this vehicle as discussed.',
  won:               'Auction won. Please arrange vehicle storage and prepare export documentation.',
  lost:              'Auction lost. No further action required unless instructed otherwise.',
  shipping:          'Please arrange shipping to Australia. Provide tracking/vessel details when available.',
  delivered:         'Vehicle has been delivered. Thank you for your assistance on this deal.',
  completed:         'Deal complete. All obligations fulfilled. Thank you.',
  cancelled:         'This deal has been cancelled. No further action required.',
}

// ── Stage ordering for marking stages complete/current ──
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const { id } = await params
  const admin = createAdminClient()
  const body = await request.json()

  const { status, notes, admin_notes, purchase_price_jpy, purchase_price_aud } = body as {
    status: DealStatus
    notes?: string
    admin_notes?: string
    purchase_price_jpy?: number
    purchase_price_aud?: number
  }

  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  // Fetch existing deal with joins
  const { data: deal, error: dealErr } = await admin
    .from('deals')
    .select(`
      *,
      listing:listings(id, model_name, grade, model_year),
      customer:user_profiles!deals_customer_id_fkey(id, first_name, last_name, phone),
      buyer:buyers(id, name, email, phone, whatsapp_number)
    `)
    .eq('id', id)
    .single()

  if (dealErr || !deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  // 1. Update deal status + optional fields
  const dealUpdates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (notes !== undefined) dealUpdates.notes = notes
  if (admin_notes !== undefined) dealUpdates.admin_notes = admin_notes
  if (purchase_price_jpy !== undefined) dealUpdates.purchase_price_jpy = purchase_price_jpy
  if (purchase_price_aud !== undefined) dealUpdates.purchase_price_aud = purchase_price_aud

  const { error: updateErr } = await admin
    .from('deals')
    .update(dealUpdates)
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // 2. Update customer_vehicles.vehicle_status + order_stages
  const mapping = STATUS_MAP[status]
  if (mapping && deal.customer_vehicle_id) {
    // Update vehicle status
    await admin
      .from('customer_vehicles')
      .update({ vehicle_status: mapping.vehicleStatus })
      .eq('id', deal.customer_vehicle_id)

    // Update order stages: mark target stage as 'current', all before as 'completed', all after as 'upcoming'
    const targetIndex = STAGE_ORDER.indexOf(mapping.stage)
    if (targetIndex >= 0) {
      const now = new Date().toISOString()

      // Mark all stages before as completed
      for (let i = 0; i < targetIndex; i++) {
        await admin
          .from('order_stages')
          .update({ status: 'completed' })
          .eq('customer_vehicle_id', deal.customer_vehicle_id)
          .eq('stage', STAGE_ORDER[i])
      }

      // Mark current stage
      await admin
        .from('order_stages')
        .update({ status: 'current', entered_at: now })
        .eq('customer_vehicle_id', deal.customer_vehicle_id)
        .eq('stage', STAGE_ORDER[targetIndex])

      // Mark all stages after as upcoming
      for (let i = targetIndex + 1; i < STAGE_ORDER.length; i++) {
        await admin
          .from('order_stages')
          .update({ status: 'upcoming', entered_at: null })
          .eq('customer_vehicle_id', deal.customer_vehicle_id)
          .eq('stage', STAGE_ORDER[i])
      }
    }
  }

  // 3. Build notification details
  const listing = deal.listing as Record<string, unknown> | null
  const customer = deal.customer as Record<string, unknown> | null
  const buyer = deal.buyer as Record<string, unknown> | null

  const vanTitle = listing
    ? `${listing.model_year ?? ''} ${[listing.model_name, listing.grade].filter(Boolean).join(' \u2014 ')}`.trim()
    : 'Your van'

  const customerFirstName = (customer?.first_name as string) || 'Customer'
  const customerLastInitial = customer?.last_name
    ? `${(customer.last_name as string).charAt(0)}.`
    : ''
  const customerFirstNameInitial = `${customerFirstName} ${customerLastInitial}`.trim()

  // 4. Email customer
  const { data: authUser } = await admin.auth.admin.getUserById(deal.customer_id)
  const customerEmail = authUser?.user?.email
  let customerEmailResult = { success: false }

  if (customerEmail) {
    const statusMessage = CUSTOMER_MESSAGES[status] || `Your deal status has been updated to: ${status}`
    const emailData = dealStatusCustomerEmail(customerFirstName, vanTitle, status, statusMessage)
    customerEmailResult = await sendEmail({
      to: customerEmail,
      subject: emailData.subject,
      html: emailData.html,
    })
  }

  // 5. Email buyer
  let buyerEmailResult = { success: false }
  if (buyer?.email) {
    const instruction = BUYER_INSTRUCTIONS[status] || `Deal status updated to: ${status}`
    const emailData = dealStatusBuyerEmail(customerFirstNameInitial, vanTitle, status, instruction)
    buyerEmailResult = await sendEmail({
      to: buyer.email as string,
      subject: emailData.subject,
      html: emailData.html,
    })
  }

  return NextResponse.json({
    success: true,
    deal: { ...deal, status },
    emailStatus: {
      customer: customerEmailResult.success,
      buyer: buyerEmailResult.success,
    },
  })
}
