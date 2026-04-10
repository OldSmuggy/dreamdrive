export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    const { email, name, notes } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const admin = createAdminClient()
    await admin.from('stock_alerts').insert({ email: email.toLowerCase().trim(), name: name?.trim() || null, notes: notes?.trim() || null })

    // Notify Jared
    sendEmail({
      to: 'jared@dreamdrive.life',
      subject: `New stock alert sign-up — ${name || email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem;">
          <h2 style="color: #2C2C2A;">New Stock Alert</h2>
          <p><strong>Name:</strong> ${name || '—'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Looking for:</strong> ${notes || '—'}</p>
        </div>
      `,
    }).catch(() => {})

    // Confirmation to user
    sendEmail({
      to: email,
      subject: `We'll keep an eye out — Bare Camper`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem;">
          <h2 style="color: #2C2C2A;">You're on the list${name ? `, ${name.split(' ')[0]}` : ''}!</h2>
          <p style="color: #555;">We'll send you a heads-up as soon as a van comes in that matches what you're after.</p>
          ${notes ? `<p style="color: #555;"><strong>What you're looking for:</strong> ${notes}</p>` : ''}
          <p style="color: #555; margin-top: 1.5rem;">In the meantime, <a href="https://barecamper.com.au/browse" style="color: #3D6B73;">browse what we have available</a>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 1.5rem 0;" />
          <p style="color: #aaa; font-size: 12px;">Bare Camper · hello@barecamper.com.au</p>
        </div>
      `,
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const admin = createAdminClient()
  const { data, error: dbError } = await admin
    .from('stock_alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
