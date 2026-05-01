export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

/** POST — quick-create an au_stock listing tied to this partner */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  try {
    const { id: partnerId } = await params
    const body = await req.json()
    const {
      model_name, model_year, body_type, mileage_km, transmission, drive,
      colour, price_aud, photos, description, source_url,
    } = body

    if (!model_name) return NextResponse.json({ error: 'model_name required' }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error: dbErr } = await supabase
      .from('listings')
      .insert({
        source: 'au_stock',
        supplier_partner_id: partnerId,
        model_name,
        model_year: model_year ?? null,
        size: body_type ?? null,                    // form sends body_type, DB column is size
        mileage_km: mileage_km ?? null,
        transmission: transmission ?? null,
        drive: drive ?? null,
        body_colour: colour ?? null,
        fuel_type: 'petrol',
        au_price_aud: price_aud ? Math.round(price_aud * 100) : null,
        price_aud: price_aud ? Math.round(price_aud * 100) : null,
        price_type: 'fixed',
        photos: photos ?? [],
        description: description ?? null,
        source_url: source_url ?? null,
        status: 'available',
      })
      .select('id')
      .single()

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
