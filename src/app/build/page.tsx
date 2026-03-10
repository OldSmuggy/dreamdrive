import { createSupabaseServer } from '@/lib/supabase-server'
import AuctionBanner from '@/components/ui/AuctionBanner'
import ConfiguratorClient from '@/components/configurator/ConfiguratorClient'
import type { Listing, Product } from '@/types'

export const metadata = { title: 'Build Your Van' }

interface Props {
  searchParams: { listing?: string; deposit?: string }
}

export default async function BuildPage({ searchParams }: Props) {
  const supabase = createSupabaseServer()

  // Load pre-selected van if provided
  let listing: Listing | null = null
  if (searchParams.listing) {
    const { data } = await supabase.from('listings').select('*').eq('id', searchParams.listing).single()
    listing = data as Listing ?? null
  }

  // Load all visible products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('visible', true)
    .order('sort_order')

  const allProducts = (products ?? []) as Product[]
  const fitouts     = allProducts.filter(p => p.category === 'fitout'     && p.slug !== 'poptop-only')
  const electricals = allProducts.filter(p => p.category === 'electrical')
  const poptop      = allProducts.find(p => p.category === 'poptop') ?? null
  const poptopOnly  = allProducts.find(p => p.slug === 'poptop-only') ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <AuctionBanner />
      <ConfiguratorClient
        initialListing={listing}
        fitouts={fitouts}
        electricals={electricals}
        poptop={poptop}
        poptopOnly={poptopOnly}
        openDeposit={searchParams.deposit === '1'}
      />
    </div>
  )
}
