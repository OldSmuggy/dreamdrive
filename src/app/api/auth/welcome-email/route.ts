export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const firstName = body.firstName ?? ''

    await sendEmail({
      to: user.email,
      ...emailTemplates.welcomeEmail(firstName),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
