export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireDealer } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

/** GET — single order detail (own orders only) */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireDealer()
  if (error || !user) return error

  const { id } = await params
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('dealer_orders')
    .select('*')
    .eq('id', id)
    .eq('dealer_user_id', user.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: stages }, { data: funds }, { data: listing }] = await Promise.all([
    supabase.from('dealer_order_stages').select('*').eq('order_id', id).order('stage_index'),
    supabase.from('funds_ledger').select('*').eq('user_id', user.id).eq('reference_type', 'dealer_order').eq('reference_id', id).order('created_at', { ascending: false }),
    order.source_listing_id
      ? supabase.from('listings').select('id, model_name, model_year, mileage_km, photos').eq('id', order.source_listing_id).single()
      : Promise.resolve({ data: null }),
  ])

  return NextResponse.json({ order, stages: stages ?? [], funds: funds ?? [], listing: listing ?? null })
}
