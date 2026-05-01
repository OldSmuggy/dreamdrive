export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'

/** GET — list all dealers */
export async function GET() {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const supabase = createAdminClient()
  const { data, error: dbErr } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone, dealer_company_name, dealer_abn, dealer_territory, dealer_signed_at, dealer_invited_at, dealer_active, created_at')
    .eq('role', 'dealer')
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST — invite a new dealer (creates auth user + profile + sends email) */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const body = await req.json()
    const { email, first_name, last_name, dealer_company_name, dealer_territory, dealer_abn, phone } = body

    if (!email || !dealer_company_name) {
      return NextResponse.json({ error: 'email and dealer_company_name are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if user already exists with this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    let userId = existingUsers?.users?.find(u => u.email === email)?.id

    if (!userId) {
      // Create auth user with magic-link invite
      const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://barecamper.com.au'}/dealer`,
      })
      if (inviteErr || !invited?.user) {
        return NextResponse.json({ error: inviteErr?.message ?? 'Failed to invite user' }, { status: 500 })
      }
      userId = invited.user.id
    }

    // Upsert profile with dealer role + details
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      first_name: first_name ?? null,
      last_name: last_name ?? null,
      phone: phone ?? null,
      role: 'dealer',
      dealer_company_name,
      dealer_territory: dealer_territory ?? null,
      dealer_abn: dealer_abn ?? null,
      dealer_active: true,
      dealer_invited_at: new Date().toISOString(),
      dealer_invited_by: user.id,
    })

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

    // Send custom welcome email (Supabase already sent the invite link)
    sendEmail({
      to: email,
      ...emailTemplates.dealerInviteEmail(first_name ?? dealer_company_name, dealer_company_name, dealer_territory ?? ''),
    }).catch(() => {})

    return NextResponse.json({ ok: true, user_id: userId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
