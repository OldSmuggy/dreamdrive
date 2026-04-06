export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api-auth'

export async function PATCH(req: NextRequest) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
    const admin = createAdminClient()
    const { error } = await admin
      .from('site_settings')
      .upsert({ key, value: value ?? null, updated_at: new Date().toISOString() })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ key, value })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
