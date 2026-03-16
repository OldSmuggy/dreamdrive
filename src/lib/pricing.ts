import type { Listing } from '@/types'

const FLAT_FEE_CENTS = 1_000_000  // $10,000 AUD — import, shipping, compliance, GST
const FALLBACK_RATE  = 0.0095     // 1 JPY = 0.0095 AUD

/** Calculate the customer-facing display price for a listing.
 *
 * - AU stock: returns au_price_aud as-is (already all-in AUD, set by admin)
 * - Japan (auction/dealer): (JPY × rate) + $10,000 flat fee, rounded to nearest $100
 * - Falls back to stored aud_estimate only if no JPY price available
 * - Returns priceCents=null for true "no data" → show POA
 */
export function listingDisplayPrice(
  listing: Pick<Listing, 'source' | 'start_price_jpy' | 'buy_price_jpy' | 'aud_estimate' | 'au_price_aud'>,
  jpyRate?: number | null,
): { priceCents: number | null; isEstimate: boolean } {

  // AU stock — price is set manually by admin in AUD, already includes everything
  if (listing.source === 'au_stock') {
    return {
      priceCents: listing.au_price_aud && listing.au_price_aud > 0 ? listing.au_price_aud : null,
      isEstimate: false,
    }
  }

  // Japan-sourced — convert JPY to AUD and add $10k flat fee
  const rate = jpyRate && jpyRate > 0 ? jpyRate : FALLBACK_RATE
  const jpyPrice = listing.start_price_jpy || listing.buy_price_jpy || null

  if (jpyPrice && jpyPrice > 0) {
    const rawCents = jpyPrice * rate * 100 + FLAT_FEE_CENTS
    const priceCents = Math.round(rawCents / 10_000) * 10_000  // round to nearest $100
    return { priceCents, isEstimate: true }
  }

  // Fallback: use pre-stored aud_estimate (stale but better than POA)
  if (listing.aud_estimate && listing.aud_estimate > 0) {
    return { priceCents: listing.aud_estimate, isEstimate: true }
  }

  return { priceCents: null, isEstimate: false }
}
