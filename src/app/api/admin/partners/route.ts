export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'

/** GET — list all supplier partners */
export async function GET() {
  const { user, error } = await requireAdmin()
  if (error || !user) return error
  const supabase = createAdminClient()
  const { data } = await supabase.from('supplier_partners').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

/** POST — create a new partner. Optionally fire the agreement email immediately. */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const body = await req.json()
    const { send_agreement, ...fields } = body

    if (!fields.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error: dbErr } = await supabase
      .from('supplier_partners')
      .insert({
        name: fields.name,
        contact_name: fields.contact_name ?? null,
        contact_email: fields.contact_email ?? null,
        contact_phone: fields.contact_phone ?? null,
        abn: fields.abn ?? null,
        address: fields.address ?? null,
        website: fields.website ?? null,
        commission_aud: fields.commission_aud ?? 0,
        commission_type: fields.commission_type ?? 'discount',
        terms_notes: fields.terms_notes ?? null,
        status: fields.status ?? 'active',
        notes: fields.notes ?? null,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

    if (send_agreement && data?.contact_email) {
      sendEmail({
        to: data.contact_email,
        ...emailTemplates.partnerAgreementEmail(
          data.contact_name ?? data.name,
          data.name,
          data.commission_aud ?? 0,
          data.commission_type ?? 'discount',
          data.terms_notes ?? '',
        ),
      }).catch(() => {})
      await supabase.from('supplier_partners').update({ agreement_sent_at: new Date().toISOString() }).eq('id', data.id)
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
