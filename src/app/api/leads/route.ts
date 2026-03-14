import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[leads] POST type=%s email=%s source=%s', body.type, body.email, body.source)

    const supabase = createAdminClient()

    const { error } = await supabase.from('leads').insert({
      type: body.type ?? 'consultation',
      name: body.name ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      listing_id: body.listing_id ?? null,
      build_id: body.build_id ?? null,
      estimated_value: body.estimated_value ?? null,
      source: body.source ?? null,
      notes: body.notes ?? null,
    })

    if (error) {
      console.error('[leads] insert error:', error.message, '|', error.details, '|', error.hint)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[leads] unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
