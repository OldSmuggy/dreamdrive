export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { sendEmail } from '@/lib/email'

export async function POST() {
  console.log('[test-email] Route hit')
  console.log('[test-email] RESEND_API_KEY present:', !!process.env.RESEND_API_KEY)

  const { user, error: authErr } = await requireAuth()
  if (authErr) {
    console.log('[test-email] Auth failed — no user session')
    return authErr
  }
  console.log('[test-email] Authenticated as:', user?.email)

  const result = await sendEmail({
    to: 'jared@dreamdrive.life',
    subject: 'Dream Drive \u2014 Email test',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2C2C2A; padding: 2rem; text-align: center;">
          <h1 style="color: #E8CFA0; margin: 0; font-size: 1.5rem;">Bare Camper</h1>
        </div>
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A;">Email test successful</h2>
          <p style="color: #444; line-height: 1.6;">
            Resend is configured correctly.<br>
            Sent at ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `,
  })

  console.log('[test-email] Result:', JSON.stringify(result))

  if (result.success) {
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ success: false, error: String(result.error) }, { status: 500 })
}
