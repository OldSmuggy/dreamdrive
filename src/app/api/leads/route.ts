export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { requireAdmin } from '@/lib/api-auth'

// Columns that require a DB migration — strip and retry if missing
const OPTIONAL_LEAD_COLS = ['state', 'build_slug', 'lead_type']

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const { ok } = rateLimit(ip)
  if (!ok) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })

  try {
    const body = await req.json()
    console.log('[leads] POST type=%s email=%s source=%s', body.type, body.email, body.source)

    const supabase = createAdminClient()

    const fullPayload = {
      type:            body.type ?? 'consultation',
      name:            body.name ?? null,
      email:           body.email ?? null,
      phone:           body.phone ?? null,
      listing_id:      body.listing_id ?? null,
      build_id:        body.build_id ?? null,
      estimated_value: body.estimated_value ?? null,
      source:          body.source ?? null,
      notes:           body.notes ?? null,
      // May not exist yet — strip and retry if column missing
      state:           body.state ?? null,
      build_slug:      body.build_slug ?? null,
      lead_type:       body.lead_type ?? body.type ?? 'consultation',
    }

    let { error } = await supabase.from('leads').insert(fullPayload)

    if (error) {
      const missingCol = OPTIONAL_LEAD_COLS.find(c => error!.message.includes(c))
      if (missingCol) {
        console.warn(`[leads POST] Column "${missingCol}" missing — retrying without optional columns`)
        const { state: _a, build_slug: _b, lead_type: _c, ...corePayload } = fullPayload
        const retry = await supabase.from('leads').insert(corePayload)
        error = retry.error
      }
    }

    if (error) {
      console.error('[leads] insert error:', error.message, '|', error.details, '|', error.hint)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send notification email to admin (fire-and-forget)
    const leadType = body.type ?? 'consultation'
    if (leadType === 'finance_application' && body.finance_data) {
      sendEmail({
        to: 'jared@dreamdrive.life',
        ...emailTemplates.financeApplicationEmail(body.finance_data),
      }).catch(() => {})
    } else if (leadType === 'finance_enquiry') {
      sendEmail({
        to: 'jared@dreamdrive.life',
        ...emailTemplates.financeEnquiryEmail(
          body.name ?? '',
          body.email ?? '',
          body.phone ?? '',
          body.budget ?? '',
          body.finance_type ?? '',
          body.notes ?? '',
        ),
      }).catch(() => {})
    } else {
      sendEmail({
        to: 'jared@dreamdrive.life',
        ...emailTemplates.leadNotificationEmail(
          leadType,
          body.name ?? '',
          body.email ?? '',
          body.phone ?? '',
          body.notes ?? '',
        ),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[leads] unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
