import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'
import { shortSlug } from '@/lib/utils'

// Columns that require a DB migration and may not exist yet.
const OPTIONAL_BUILD_COLS = ['build_location', 'mana_location', 'entry_mode', 'is_byo']

export async function POST(req: NextRequest) {
  const body = await req.json()
  const admin = createAdminClient()

  const serverClient = createSupabaseServer()
  const { data: { user } } = await serverClient.auth.getUser()

  const slug = body.share_slug ?? shortSlug()

  const fullPayload = {
    share_slug:        slug,
    user_id:           user?.id ?? null,
    listing_id:        body.listing_id ?? null,
    fitout_product_id: body.fitout_product_id ?? null,
    elec_product_id:   body.elec_product_id ?? null,
    poptop_product_id: body.poptop_product_id ?? null,
    poptop_japan:      body.poptop_japan ?? false,
    total_aud_min:     body.total_aud_min ?? null,
    total_aud_max:     body.total_aud_max ?? null,
    build_location:    body.build_location ?? null,
    mana_location:     body.mana_location ?? null,
    entry_mode:        body.entry_mode ?? null,
    is_byo:            body.is_byo ?? false,
  }

  let { data, error } = await admin
    .from('builds')
    .insert(fullPayload)
    .select('id, share_slug')
    .single()

  // If a new column doesn't exist yet, retry without optional columns
  if (error) {
    const missingCol = OPTIONAL_BUILD_COLS.find(c => error!.message.includes(c))
    if (missingCol) {
      console.warn(`[builds POST] Column "${missingCol}" missing — retrying without optional columns`)
      const { build_location: _a, mana_location: _b, entry_mode: _c, is_byo: _d, ...corePayload } = fullPayload
      const retry = await admin.from('builds').insert(corePayload).select('id, share_slug').single()
      data = retry.data
      error = retry.error
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
