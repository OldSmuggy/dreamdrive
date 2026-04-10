import { centsToAud } from '@/lib/utils'

interface Props {
  listingPriceCents: number | null
  auMarketPriceLow: number | null
  auMarketPriceHigh: number | null
  auMarketSource: string | null
  auMarketNote: string | null
}

export default function MarketContext({
  listingPriceCents,
  auMarketPriceLow,
  auMarketPriceHigh,
  auMarketSource,
  auMarketNote,
}: Props) {
  if (!auMarketPriceLow || !auMarketPriceHigh) return null

  const ourPrice = listingPriceCents ? centsToAud(listingPriceCents) : null
  const marketLow = `$${auMarketPriceLow.toLocaleString('en-AU')}`
  const marketHigh = `$${auMarketPriceHigh.toLocaleString('en-AU')}`

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Market Comparison</p>
      </div>
      <div className="px-4 py-4 space-y-2.5">
        {ourPrice && (
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-600">This van via Bare Camper</span>
            <span className="text-sm font-bold text-ocean">{ourPrice} est.</span>
          </div>
        )}
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-gray-600">Similar on AU market</span>
          <span className="text-sm font-bold text-gray-800">{marketLow} – {marketHigh}</span>
        </div>
        {(auMarketNote || auMarketSource) && (
          <div className="pt-2 border-t border-gray-100">
            {auMarketNote && (
              <p className="text-xs text-gray-400 leading-relaxed">{auMarketNote}</p>
            )}
            {auMarketSource && (
              <p className="text-xs text-gray-400 mt-0.5">Source: {auMarketSource}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
