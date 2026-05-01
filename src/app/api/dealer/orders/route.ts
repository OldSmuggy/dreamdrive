export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireDealer } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import {
  DEALER_WHOLESALE, DEALER_RETAIL, DEALER_MARGIN,
  DEALER_TIMELINE_STAGES, tierLabel, gradeLabel,
  type DealerTier, type DealerGrade,
} from '@/lib/dealer-pricing'

/** GET — list this dealer's orders */
export async function GET() {
  const { user, error } = await requireDealer()
  if (error || !user) return error

  const supabase = createAdminClient()
  const { data, error: dbErr } = await supabase
    .from('dealer_orders')
    .select('*')
    .eq('dealer_user_id', user.id)
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST — dealer places a new order */
export async function POST(req: NextRequest) {
  const { user, profile, error } = await requireDealer()
  if (error || !user || !profile) return error

  try {
    const body = await req.json()
    const { tier, vehicle_grade, notes } = body as { tier: DealerTier; vehicle_grade: DealerGrade; notes?: string }

    if (!tier || !vehicle_grade || !DEALER_WHOLESALE[tier]?.[vehicle_grade]) {
      return NextResponse.json({ error: 'Invalid tier or grade' }, { status: 400 })
    }

    const wholesale = DEALER_WHOLESALE[tier][vehicle_grade] * 100   // → cents
    const retail = DEALER_RETAIL[tier][vehicle_grade] * 100
    const margin = DEALER_MARGIN[tier][vehicle_grade] * 100

    const supabase = createAdminClient()

    // Generate order number BC-YYYY-NNNN
    const { data: seqData } = await supabase.rpc('nextval', { sequence_name: 'dealer_orders_seq' }).single().then(
      r => r,
      () => ({ data: null }),
    ) as { data: number | null }
    const seqNum = seqData ?? Math.floor(Date.now() / 1000) % 10000
    const year = new Date().getFullYear()
    const orderNumber = `BC-${year}-${String(seqNum).padStart(4, '0')}`

    const { data: order, error: orderErr } = await supabase
      .from('dealer_orders')
      .insert({
        dealer_user_id: user.id,
        order_number: orderNumber,
        tier,
        vehicle_grade,
        wholesale_price_cents: wholesale,
        retail_price_cents: retail,
        dealer_margin_cents: margin,
        status: 'pending_deposit',
        notes: notes ?? null,
      })
      .select('*')
      .single()

    if (orderErr || !order) return NextResponse.json({ error: orderErr?.message ?? 'Failed' }, { status: 500 })

    // Seed the 5 stages — first stage is current, rest upcoming
    const stages = DEALER_TIMELINE_STAGES.map((s) => ({
      order_id: order.id,
      stage_key: s.key,
      stage_index: s.index,
      status: s.index === 1 ? 'current' : 'upcoming',
      entered_at: s.index === 1 ? new Date().toISOString() : null,
    }))
    await supabase.from('dealer_order_stages').insert(stages)

    // Notify admin
    sendEmail({
      to: 'jared@dreamdrive.life',
      ...emailTemplates.dealerOrderConfirmedEmail(
        profile.dealer_company_name ?? 'Dealer',
        orderNumber, tierLabel(tier), gradeLabel(vehicle_grade), wholesale,
      ),
    }).catch(() => {})

    return NextResponse.json({ ok: true, order })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
