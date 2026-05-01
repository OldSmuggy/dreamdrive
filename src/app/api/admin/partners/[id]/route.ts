export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'

/** GET — partner detail + their listings */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const { id } = await params
  const supabase = createAdminClient()
  const [{ data: partner }, { data: listings }] = await Promise.all([
    supabase.from('supplier_partners').select('*').eq('id', id).single(),
    supabase.from('listings').select('id, model_name, model_year, mileage_km, photos, status, au_price_aud, source, created_at').eq('supplier_partner_id', id).order('created_at', { ascending: false }),
  ])

  if (!partner) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ partner, listings: listings ?? [] })
}

/** PATCH — update partner details, or send agreement email */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const { id } = await params
    const body = await req.json()
    const { action, ...fields } = body
    const supabase = createAdminClient()

    if (action === 'send_agreement') {
      const { data: partner } = await supabase.from('supplier_partners').select('*').eq('id', id).single()
      if (!partner?.contact_email) return NextResponse.json({ error: 'No contact email on partner' }, { status: 400 })
      await sendEmail({
        to: partner.contact_email,
        ...emailTemplates.partnerAgreementEmail(
          partner.contact_name ?? partner.name,
          partner.name,
          partner.commission_aud ?? 0,
          partner.commission_type ?? 'discount',
          partner.terms_notes ?? '',
        ),
      })
      const { data } = await supabase.from('supplier_partners').update({ agreement_sent_at: new Date().toISOString() }).eq('id', id).select('*').single()
      return NextResponse.json(data)
    }

    const allowed = ['name', 'contact_name', 'contact_email', 'contact_phone', 'abn', 'address', 'website', 'commission_aud', 'commission_type', 'terms_notes', 'status', 'notes', 'agreement_signed_at']
    const updates: Record<string, unknown> = {}
    for (const f of allowed) if (fields[f] !== undefined) updates[f] = fields[f]

    const { data, error: dbErr } = await supabase.from('supplier_partners').update(updates).eq('id', id).select('*').single()
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
