export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api-auth'

export async function PATCH(req: NextRequest) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('settings')
      .update({ value: value ?? null, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
