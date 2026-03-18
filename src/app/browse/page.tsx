import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { getJpyRate } from '@/lib/settings'
import AuctionBanner from '@/components/ui/AuctionBanner'
import BrowseClient from '@/components/listings/BrowseClient'
import type { Listing } from '@/types'

export const metadata = { title: 'Browse Vans' }

interface Props {
  searchParams: {
    source?: string
    grade?: string
    yearMin?: string
    yearMax?: string
    mileageMax?: string
    drive?: string
    transmission?: string
  }
}

export interface ForSaleVehicle {
  id: string
  vehicle_status: string
  vehicle_description: string | null
  sale_price_aud: number | null
  sale_notes: string | null
  sale_label: string | null
  listing: { id: string; model_name: string; model_year: number | null; grade: string | null; photos: string[] } | null
  build: { build_type: string } | null
  current_stage: string | null
}

export default async function BrowsePage({ searchParams }: Props) {
  const supabase = createSupabaseServer()

  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'available')
    .order('featured', { ascending: false })
    .order('auction_date', { ascending: true })
    .limit(200)

  if (searchParams.source) {
    const sources = searchParams.source.split(',')
    query = query.in('source', sources)
  }

  if (searchParams.drive) {
    const drives = searchParams.drive.split(',')
    query = query.in('drive', drives)
  }

  if (searchParams.yearMin) query = query.gte('model_year', parseInt(searchParams.yearMin))
  if (searchParams.yearMax) query = query.lte('model_year', parseInt(searchParams.yearMax))
  if (searchParams.mileageMax) query = query.lte('mileage_km', parseInt(searchParams.mileageMax))

  const { data } = await query
  const listings = (data ?? []) as Listing[]

  // Fetch for-sale customer vehicles
  const admin = createAdminClient()
  const { data: forSaleRaw } = await admin
    .from('customer_vehicles')
    .select(`
      id, vehicle_status, vehicle_description, sale_price_aud, sale_notes, sale_label,
      listing:listings(id, model_name, model_year, grade, photos),
      customer_builds(build_type),
      order_stages(stage, status)
    `)
    .eq('for_sale', true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forSaleVehicles: ForSaleVehicle[] = (forSaleRaw ?? []).map((v: any) => {
    const listing = Array.isArray(v.listing) ? v.listing[0] : v.listing
    const build = Array.isArray(v.customer_builds) ? v.customer_builds[0] ?? null : v.customer_builds
    const currentStage = (v.order_stages ?? []).find((s: { status: string }) => s.status === 'current')
    return {
      id: v.id,
      vehicle_status: v.vehicle_status,
      vehicle_description: v.vehicle_description,
      sale_price_aud: v.sale_price_aud,
      sale_notes: v.sale_notes,
      sale_label: v.sale_label ?? 'CONTRACT FOR SALE',
      listing: listing ?? null,
      build: build ?? null,
      current_stage: currentStage?.stage ?? null,
    }
  })

  const [jpyRate, { data: { user } }] = await Promise.all([
    getJpyRate(),
    supabase.auth.getUser(),
  ])
  let savedIds: string[] = []
  if (user) {
    const { data: saved } = await supabase
      .from('saved_vans')
      .select('listing_id')
      .eq('user_id', user.id)
    savedIds = (saved ?? []).map((s: { listing_id: string }) => s.listing_id)
  }

  // Compute distinct colour counts from available listings
  const colourCounts: Record<string, number> = {}
  for (const l of listings) {
    const c = l.body_colour
    if (c) colourCounts[c] = (colourCounts[c] ?? 0) + 1
  }

  // Find next upcoming auction from real data
  const pendingAuctions = listings.filter(l =>
    l.source === 'auction' && l.auction_time && (!l.auction_result || l.auction_result === 'pending') && new Date(l.auction_time).getTime() > Date.now()
  )
  const nextAuctionTime = pendingAuctions.length > 0
    ? pendingAuctions.reduce((min, l) => l.auction_time! < min ? l.auction_time! : min, pendingAuctions[0].auction_time!)
    : null
  // Count auctions on the same day as the next one
  const auctionCount = nextAuctionTime
    ? pendingAuctions.filter(l => l.auction_time!.slice(0, 10) === nextAuctionTime.slice(0, 10)).length
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <AuctionBanner nextAuctionTime={nextAuctionTime} auctionCount={auctionCount} />
      <BrowseClient
        initialListings={listings}
        searchParams={searchParams}
        userId={user?.id ?? null}
        initialSavedIds={savedIds}
        jpyRate={jpyRate}
        forSaleVehicles={forSaleVehicles}
        colourCounts={colourCounts}
      />
    </div>
  )
}
