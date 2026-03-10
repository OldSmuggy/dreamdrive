import { createSupabaseServer } from '@/lib/supabase-server'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AuctionBanner />
      <BrowseClient initialListings={listings} searchParams={searchParams} />
    </div>
  )
}
