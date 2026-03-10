import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createSupabaseServer } from '@/lib/supabase'
import { shortSlug } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase.from('builds').insert({
    share_slug: shortSlug(),
    listing_id: body.listing_id ?? null,
    fitout_product_id: body.fitout_product_id ?? null,
    elec_product_id: body.elec_product_id ?? null,
    poptop_product_id: body.poptop_product_id ?? null,
    poptop_japan: body.poptop_japan ?? false,
    total_aud_min: body.total_aud_min ?? null,
    total_aud_max: body.total_aud_max ?? null,
  }).select('share_slug').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
