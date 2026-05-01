export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireDealer } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

/** POST — dealer registers interest in a coming-soon resource */
export async function POST(req: NextRequest) {
  const { user, error } = await requireDealer()
  if (error || !user) return error

  try {
    const { resource } = await req.json()
    if (!['marketing', 'training'].includes(resource)) {
      return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
    const supabase = createAdminClient()
    await supabase.from('dealer_resource_interest').insert({ user_id: user.id, resource })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
