export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { centsToAud } from '@/lib/utils'
import { listingDisplayPrice } from '@/lib/pricing'
import { getJpyRate } from '@/lib/settings'
import { generateMeta } from '@/lib/seo'
import Link from 'next/link'
import type { Listing } from '@/types'

export const metadata = generateMeta({
  title: 'Compare Vans Side by Side | Bare Camper',
  description: 'Compare Toyota Hiace vans side by side — specs, photos, and pricing at a glance.',
  url: '/compare',
})

export default async function ComparePage({ searchParams }: { searchParams: { vans?: string } }) {
  const ids = searchParams.vans?.split(',').filter(Boolean).slice(0, 4) ?? []

  if (!ids.length) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">⚖️</div>
          <h1 className="text-3xl font-bold text-charcoal mb-3">Compare Vans</h1>
          <p className="text-gray-500 mb-6">
            Add vans to compare by browsing our listings and copying the van IDs into the URL.
          </p>
          <Link href="/browse" className="btn-primary text-sm px-6 py-3">Browse Vans →</Link>
          <p className="text-xs text-gray-400 mt-6">
            Usage: <code className="bg-gray-100 px-2 py-0.5 rounded">/compare?vans=id1,id2,id3</code>
          </p>
        </div>
      </div>
    )
  }

  const supabase = createSupabaseServer()
  const jpyRate = await getJpyRate()

  const { data } = await supabase
    .from('listings')
    .select('*')
    .in('id', ids)
    .eq('status', 'available')

  const listings = (data ?? []) as Listing[]

  if (!listings.length) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-charcoal mb-3">No vans found</h1>
          <p className="text-gray-500 mb-6">The van IDs provided don&apos;t match any available listings.</p>
          <Link href="/browse" className="btn-primary text-sm px-6 py-3">Browse Vans →</Link>
        </div>
      </div>
    )
  }

  const specs: { label: string; getter: (l: Listing) => string }[] = [
    { label: 'Model', getter: l => l.model_name },
    { label: 'Year', getter: l => l.model_year?.toString() ?? '—' },
    { label: 'Grade', getter: l => l.inspection_score ?? '—' },
    { label: 'Mileage', getter: l => l.mileage_km ? `${l.mileage_km.toLocaleString()} km` : '—' },
    { label: 'Engine', getter: l => l.displacement_cc ? `${(l.displacement_cc / 1000).toFixed(1)}L ${l.displacement_cc > 2500 ? 'Diesel' : 'Petrol'}` : '—' },
    { label: 'Transmission', getter: l => l.transmission === 'IA' ? 'Auto (CVT)' : l.transmission ?? '—' },
    { label: 'Drive', getter: l => l.drive ?? '—' },
    { label: 'Size', getter: l => l.size ?? '—' },
    { label: 'Colour', getter: l => l.body_colour ?? '—' },
    { label: 'Fit-Out', getter: l => l.has_fitout ? `Yes${l.fitout_grade ? ` (${l.fitout_grade})` : ''}` : 'No' },
    { label: 'Power System', getter: l => l.power_system && l.power_system !== 'None' ? l.power_system : '—' },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/browse" className="text-ocean text-sm font-medium hover:underline">← Back to Browse</Link>
            <h1 className="text-2xl font-bold text-charcoal mt-2">Compare Vans</h1>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Photos */}
            <thead>
              <tr>
                <th className="w-32 shrink-0" />
                {listings.map(l => (
                  <th key={l.id} className="p-2 min-w-[200px]">
                    <Link href={`/van/${l.id}`} className="block group">
                      <div className="relative h-36 rounded-xl overflow-hidden bg-gray-100">
                        {l.photos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.photos[0]} alt={l.model_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🚐</div>
                        )}
                      </div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Title */}
              <tr className="border-b border-gray-200">
                <td className="py-3 px-2 text-xs font-semibold text-gray-400 uppercase">Van</td>
                {listings.map(l => {
                  const { priceCents, isEstimate } = listingDisplayPrice(l, jpyRate)
                  const price = priceCents ? centsToAud(priceCents) : 'POA'
                  return (
                    <td key={l.id} className="py-3 px-2">
                      <Link href={`/van/${l.id}`} className="hover:text-ocean">
                        <p className="font-bold text-charcoal text-sm">{l.model_year ?? ''} {l.model_name}</p>
                      </Link>
                      <p className="text-ocean font-bold text-lg mt-1">
                        {price}
                        {isEstimate && priceCents && <span className="text-xs text-gray-400 font-normal ml-1">est.</span>}
                      </p>
                    </td>
                  )
                })}
              </tr>
              {/* Specs */}
              {specs.map(spec => (
                <tr key={spec.label} className="border-b border-gray-100">
                  <td className="py-2.5 px-2 text-xs font-semibold text-gray-400">{spec.label}</td>
                  {listings.map(l => (
                    <td key={l.id} className="py-2.5 px-2 text-sm text-charcoal">{spec.getter(l)}</td>
                  ))}
                </tr>
              ))}
              {/* CTA */}
              <tr>
                <td />
                {listings.map(l => (
                  <td key={l.id} className="py-4 px-2">
                    <Link href={`/van/${l.id}`} className="btn-primary text-sm px-5 py-2.5 inline-block">
                      View &amp; Build →
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
