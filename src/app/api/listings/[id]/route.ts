export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api-auth'
import { sendEmail, emailTemplates } from '@/lib/email'

// Columns that require a DB migration and may not exist yet.
// If the update fails because of one of these, we strip them and retry
// so all other fields still save successfully.
const OPTIONAL_COLUMNS = [
  'internal_photos', 'show_interior_gallery',
  'location_status', 'fit_out_level', 'vehicle_model', 'conversion_video_url',
  'engine', 'has_power_steering', 'has_power_windows', 'has_rear_ac',
  'auction_time', 'auction_result', 'sold_price_jpy', 'top_bid_jpy', 'auction_time_zone',
  'price_aud', 'price_type',
  'lead_time_weeks',
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  try {
    const body = await req.json()
    const supabase = createAdminClient()

    // Snapshot previous status + partner so we can detect status transitions
    const { data: prev } = await supabase
      .from('listings')
      .select('id, status, supplier_partner_id, model_name, model_year, source_url')
      .eq('id', params.id)
      .single()

    const doUpdate = async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('listings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
      return { data: data?.[0] ?? null, error }
    }

    let { data, error } = await doUpdate(body)

    // If a column doesn't exist yet (migration not run), strip it and retry
    // so the rest of the fields still save.
    if (error) {
      const missingCol = OPTIONAL_COLUMNS.find(c => error!.message.includes(c))
      if (missingCol) {
        console.warn(
          `[listings PATCH] Column "${missingCol}" missing — run SQL migration. Retrying without optional columns.`
        )
        const fallback = { ...body }
        OPTIONAL_COLUMNS.forEach(c => delete fallback[c])
        const retry = await doUpdate(fallback)
        data = retry.data
        error = retry.error
      }
    }

    if (error) {
      console.error('[listings PATCH] Save failed:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-notify partner when this listing transitions to "sold"
    if (
      data &&
      prev?.supplier_partner_id &&
      prev.status !== 'sold' &&
      data.status === 'sold'
    ) {
      try {
        const { data: partner } = await supabase
          .from('supplier_partners')
          .select('name, contact_name, contact_email, commission_aud, commission_type')
          .eq('id', prev.supplier_partner_id)
          .single()

        if (partner?.contact_email) {
          // Best-effort: grab the most recent customer name from deposit_holds
          const { data: depo } = await supabase
            .from('deposit_holds')
            .select('customer_name')
            .eq('listing_id', params.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const vanTitle = `${prev.model_year ?? ''} ${prev.model_name}`.trim()
          await sendEmail({
            to: partner.contact_email,
            ...emailTemplates.partnerSaleNotificationEmail(
              partner.contact_name ?? partner.name,
              partner.name,
              vanTitle,
              prev.source_url ?? '',
              partner.commission_aud ?? 0,
              partner.commission_type ?? 'discount',
              depo?.customer_name ?? null,
            ),
          })
          console.log(`[listings PATCH] Sale notification sent to partner ${partner.name}`)
        }
      } catch (notifyErr) {
        console.warn('[listings PATCH] Partner sale notification failed:', notifyErr)
      }
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('listings').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
