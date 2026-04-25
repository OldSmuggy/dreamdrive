export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { getUserFundsSummary } from '@/lib/funds'

/** GET — current user's own funds ledger */
export async function GET() {
  const { user, error } = await requireAuth()
  if (error || !user) return error

  const summary = await getUserFundsSummary(user.id)
  return NextResponse.json(summary)
}
