import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({
    status: 'ok',
    ts: new Date().toISOString(),
    resend_configured: !!process.env.RESEND_API_KEY,
  })
}
