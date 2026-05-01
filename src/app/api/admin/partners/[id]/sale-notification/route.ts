export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'

/** POST — send a "we just sold one of yours" email to the partner. Body: { listing_id, customer_name? } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const { id } = await params
    const { listing_id, customer_name } = await req.json()
    if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 })

    const supabase = createAdminClient()
    const [{ data: partner }, { data: listing }] = await Promise.all([
      supabase.from('supplier_partners').select('*').eq('id', id).single(),
      supabase.from('listings').select('id, model_name, model_year, source_url, au_price_aud').eq('id', listing_id).single(),
    ])

    if (!partner?.contact_email) return NextResponse.json({ error: 'No contact email on partner' }, { status: 400 })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const vanTitle = `${listing.model_year ?? ''} ${listing.model_name}`.trim()
    await sendEmail({
      to: partner.contact_email,
      ...emailTemplates.partnerSaleNotificationEmail(
        partner.contact_name ?? partner.name,
        partner.name,
        vanTitle,
        listing.source_url ?? '',
        partner.commission_aud ?? 0,
        partner.commission_type ?? 'discount',
        customer_name ?? null,
      ),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
