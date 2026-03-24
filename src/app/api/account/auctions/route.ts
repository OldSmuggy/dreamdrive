import { createAdminClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Find the customer record linked to this auth user
  const { data: customer } = await admin
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!customer) return NextResponse.json({ vehicles: [] })

  // Get vehicles with auction status
  const { data: vehicles } = await admin
    .from('customer_vehicles')
    .select('id, customer_id, listing_id, agent_id, max_bid_jpy, auction_status, vehicle_status')
    .eq('customer_id', customer.id)
    .not('auction_status', 'is', null)

  if (!vehicles?.length) return NextResponse.json({ vehicles: [] })

  // Enrich
  const listingIds = Array.from(new Set(vehicles.map(v => v.listing_id).filter(Boolean)))
  const agentIds = Array.from(new Set(vehicles.map(v => v.agent_id).filter(Boolean)))

  const [listingsRes, agentsRes] = await Promise.all([
    listingIds.length ? admin.from('listings').select('id, model_name, model_year, grade, photos, auction_time, auction_result, sold_price_jpy, aud_estimate, mileage_km, auction_time_zone').in('id', listingIds) : { data: [] },
    agentIds.length ? admin.from('user_profiles').select('id, first_name, last_name').in('id', agentIds) : { data: [] },
  ])

  const listingMap = new Map((listingsRes.data ?? []).map(l => [l.id, l]))
  const agentMap = new Map((agentsRes.data ?? []).map(a => [a.id, a]))

  const enriched = vehicles.map(v => ({
    ...v,
    listing: listingMap.get(v.listing_id) ?? null,
    agent: agentMap.get(v.agent_id) ?? null,
  }))

  return NextResponse.json({ vehicles: enriched })
}
