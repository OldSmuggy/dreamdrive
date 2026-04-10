export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import { requireAdmin } from '@/lib/api-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  try {
    const body = await req.json()
    const { status, admin_notes, matched_listing_id } = body
    const supabase = createAdminClient()

    const updates: Record<string, unknown> = {}
    if (status)               updates.status = status
    if (admin_notes !== undefined) updates.admin_notes = admin_notes
    if (matched_listing_id !== undefined) updates.matched_listing_id = matched_listing_id || null
    if (status === 'paid')    updates.paid_at = new Date().toISOString()

    const { data: tip, error } = await supabase
      .from('vehicle_tips')
      .update(updates)
      .eq('id', params.id)
      .select('*, listing:matched_listing_id(id, model_name, model_year)')
      .single()

    if (error) {
      console.error('[vehicle-tips PATCH] error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send "you earned your fee" email when status moves to paid
    if (status === 'paid' && tip?.name && tip?.email) {
      const vanTitle = tip.listing
        ? `${tip.listing.model_year ?? ''} ${tip.listing.model_name}`.trim()
        : 'your van tip'
      sendEmail({
        to: tip.email,
        ...emailTemplates.vehicleTipFeeEarnedEmail(tip.name, vanTitle, tip.finders_fee_aud),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, tip })
  } catch (err) {
    console.error('[vehicle-tips PATCH] unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
