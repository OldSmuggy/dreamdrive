import { createAdminClient } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
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

  // Check role
  const { data: profile } = await admin.from('user_profiles').select('role, is_admin').eq('id', user.id).single()
  const isAgent = profile?.role === 'buyer_agent'
  const isAdmin = profile?.is_admin || user.email?.endsWith('@dreamdrive.life')

  if (!isAgent && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized as agent' }, { status: 403 })
  }

  // Get assigned vehicles (agents see their own, admins see all)
  let query = admin
    .from('customer_vehicles')
    .select('id, customer_id, listing_id, agent_id, max_bid_jpy, auction_status, vehicle_status')
    .not('auction_status', 'is', null)

  if (isAgent && !isAdmin) {
    query = query.eq('agent_id', user.id)
  }

  const { data: vehicles } = await query

  if (!vehicles?.length) return NextResponse.json({ vehicles: [] })

  // Enrich with listings and customers
  const listingIds = Array.from(new Set(vehicles.map(v => v.listing_id).filter(Boolean)))
  const customerIds = Array.from(new Set(vehicles.map(v => v.customer_id).filter(Boolean)))
  const agentIds = Array.from(new Set(vehicles.map(v => v.agent_id).filter(Boolean)))
  const cvIds = vehicles.map(v => v.id)

  const [listingsRes, customersRes, agentsRes, messagesRes] = await Promise.all([
    listingIds.length ? admin.from('listings').select('id, model_name, model_year, grade, photos, auction_time, auction_result, sold_price_jpy, aud_estimate, mileage_km, status, auction_time_zone').in('id', listingIds) : { data: [] },
    customerIds.length ? admin.from('customers').select('id, first_name, last_name, email, phone').in('id', customerIds) : { data: [] },
    agentIds.length ? admin.from('user_profiles').select('id, first_name, last_name').in('id', agentIds) : { data: [] },
    cvIds.length ? admin.from('order_messages').select('customer_vehicle_id').in('customer_vehicle_id', cvIds) : { data: [] },
  ])

  const listingMap = new Map((listingsRes.data ?? []).map(l => [l.id, l]))
  const customerMap = new Map((customersRes.data ?? []).map(c => [c.id, c]))
  const agentMap = new Map((agentsRes.data ?? []).map(a => [a.id, a]))

  // Count messages per vehicle
  const msgCounts = new Map<string, number>()
  for (const m of messagesRes.data ?? []) {
    msgCounts.set(m.customer_vehicle_id, (msgCounts.get(m.customer_vehicle_id) ?? 0) + 1)
  }

  const enriched = vehicles.map(v => ({
    ...v,
    listing: listingMap.get(v.listing_id) ?? null,
    customer: customerMap.get(v.customer_id) ?? null,
    agent: agentMap.get(v.agent_id) ?? null,
    message_count: msgCounts.get(v.id) ?? 0,
  }))

  return NextResponse.json({ vehicles: enriched })
}
