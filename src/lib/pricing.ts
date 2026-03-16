import type { Listing } from '@/types'

// ── Van pricing constants ──────────────────────────────────────────────────────
const IMPORT_FEE_CENTS  = 1_000_000  // $10,000 AUD flat fee covering import/shipping/compliance/GST
const FALLBACK_RATE     = 0.0095     // 1 JPY = 0.0095 AUD

// ── Conversion fee constants ───────────────────────────────────────────────────
// Separation from van price: customer sees conversion fee + van estimate separately
export const TAMA_CONVERSION_JPY    = 4_800_000   // ¥4,800,000 (Japan build)
export const MANA_JP_CONVERSION_JPY = 4_500_000   // ¥4,500,000 (Japan build)
export const MANA_AU_CONVERSION_AUD = 45_000       // $45,000 AUD (Australia build)

// ── Price range assumptions for product page display ──────────────────────────
// Cheapest realistic Japan Hiace after conversion: ~$15k AUD + $10k import = $25k
// Most expensive realistic Japan Hiace after conversion: ~$40k AUD + $10k import = $50k
const VAN_RANGE_LOW_AUD  = 15_000
const VAN_RANGE_HIGH_AUD = 40_000

/** Calculate the customer-facing display price for a van listing.
 *
 * - AU stock: returns au_price_aud as-is (already all-in AUD, set by admin)
 * - Japan (auction/dealer): (JPY × rate) + $10,000 flat import fee, rounded to nearest $100
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
    const rawCents = jpyPrice * rate * 100 + IMPORT_FEE_CENTS
    const priceCents = Math.round(rawCents / 10_000) * 10_000  // round to nearest $100
    return { priceCents, isEstimate: true }
  }

  // Fallback: use pre-stored aud_estimate (stale but better than POA)
  if (listing.aud_estimate && listing.aud_estimate > 0) {
    return { priceCents: listing.aud_estimate, isEstimate: true }
  }

  return { priceCents: null, isEstimate: false }
}

/** Get the TAMA conversion fee in AUD (calculated from JPY). */
export function tamaConversionAud(jpyRate?: number | null): number {
  const rate = jpyRate && jpyRate > 0 ? jpyRate : FALLBACK_RATE
  return Math.round((TAMA_CONVERSION_JPY * rate) / 100) * 100
}

/** Get the MANA Japan conversion fee in AUD (calculated from JPY). */
export function manaJpConversionAud(jpyRate?: number | null): number {
  const rate = jpyRate && jpyRate > 0 ? jpyRate : FALLBACK_RATE
  return Math.round((MANA_JP_CONVERSION_JPY * rate) / 100) * 100
}

/** Get the MANA Australia conversion fee in AUD (fixed). */
export function manaAuConversionAud(): number {
  return MANA_AU_CONVERSION_AUD
}

/** Get the total price range (low/high) for a product page display.
 *  Adds the conversion fee to the realistic van price range.
 */
export function conversionPriceRange(
  conversionAud: number,
  includePopTopAud: number = 0,
): { low: number; high: number } {
  const vanLow  = VAN_RANGE_LOW_AUD  + 10_000  // $15k van + $10k import = $25k
  const vanHigh = VAN_RANGE_HIGH_AUD + 10_000  // $40k van + $10k import = $50k
  return {
    low:  Math.round((vanLow  + conversionAud + includePopTopAud) / 1000) * 1000,
    high: Math.round((vanHigh + conversionAud + includePopTopAud) / 1000) * 1000,
  }
}

/** Format an AUD amount as "$XX,XXX" */
export function formatAud(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-AU')}`
}
