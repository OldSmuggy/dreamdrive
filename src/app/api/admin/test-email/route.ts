export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { sendEmail } from '@/lib/email'

export async function POST() {
  const { error: authErr } = await requireAuth()
  if (authErr) return authErr

  const result = await sendEmail({
    to: 'jared@dreamdrive.life',
    subject: 'Dream Drive \u2014 Email test',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a3a2a; padding: 2rem; text-align: center;">
          <h1 style="color: #c9b98a; margin: 0; font-size: 1.5rem;">Dream Drive</h1>
        </div>
        <div style="padding: 2rem;">
          <h2 style="color: #1a3a2a;">Email test successful</h2>
          <p style="color: #444; line-height: 1.6;">
            Resend is configured correctly.<br>
            Sent at ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `,
  })

  if (result.success) {
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ success: false, error: String(result.error) }, { status: 500 })
}
