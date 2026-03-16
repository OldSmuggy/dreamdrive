import { createSupabaseServer } from '@/lib/supabase-server'
import { getJpyRate } from '@/lib/settings'
import AuctionBanner from '@/components/ui/AuctionBanner'
import ConfiguratorV2 from '@/components/configurator/ConfiguratorV2'
import type { Listing, Product } from '@/types'

export const metadata = { title: 'Design Your Build — Dream Drive' }

type FitoutSlug = 'tama' | 'mana' | 'grid' | null

interface Props {
  searchParams: { van?: string; fitout?: string }
}

export default async function ConfiguratorPage({ searchParams }: Props) {
  const supabase = createSupabaseServer()

  // Resolve pre-selected van (van-first mode)
  let preSelectedVan: Listing | null = null
  if (searchParams.van) {
    const { data } = await supabase.from('listings').select('*').eq('id', searchParams.van).single()
    preSelectedVan = data as Listing ?? null
  }

  // Resolve pre-selected fitout (build-first mode)
  const rawFitout = searchParams.fitout
  const preSelectedFitout: FitoutSlug =
    rawFitout === 'tama' ? 'tama'
    : rawFitout === 'mana' ? 'mana'
    : rawFitout === 'grid' ? 'grid'
    : null

  const mode: 'van-first' | 'build-first' = preSelectedVan ? 'van-first' : 'build-first'

  // Load products, available listings, and exchange rate in parallel
  const [{ data: products }, { data: listings }, jpyRate] = await Promise.all([
    supabase.from('products').select('*').eq('visible', true).order('sort_order'),
    supabase
      .from('listings')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(20),
    getJpyRate(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <AuctionBanner />
      <ConfiguratorV2
        mode={mode}
        preSelectedVan={preSelectedVan}
        preSelectedFitout={preSelectedFitout}
        products={(products ?? []) as Product[]}
        listings={(listings ?? []) as Listing[]}
        jpyRate={jpyRate}
      />
    </div>
  )
}
