import type { Listing } from '@/types'

// ── Van pricing constants ──────────────────────────────────────────────────────
const FALLBACK_RATE     = 0.0095     // 1 JPY = 0.0095 AUD

// ── Itemised import cost constants (AUD cents) ────────────────────────────────
export const SOURCING_FEE_EX_GST_CENTS = 250_000   // $2,500 ex GST
export const SOURCING_FEE_GST_CENTS    =  25_000   // $250 GST on sourcing fee
export const SOURCING_FEE_CENTS        = 275_000   // $2,750 inc GST
export const SHIPPING_CENTS            = 250_000   // ~$2,500 ocean freight
export const CUSTOMS_ENTRY_CENTS       =  11_000   // $110 customs entry
export const BMSB_CENTS                =  25_000   // $250 BMSB heat treatment
export const COMPLIANCE_CENTS          = 180_000   // ~$1,800 RAWS compliance
const GST_RATE = 0.10

// ── Conversion fee constants ───────────────────────────────────────────────────
// Separation from van price: customer sees conversion fee + van estimate separately
export const TAMA_CONVERSION_JPY    = 4_800_000   // ¥4,800,000 (Japan build)
export const MANA_JP_CONVERSION_JPY = 4_500_000   // ¥4,500,000 (Japan build)
export const MANA_AU_CONVERSION_AUD = 45_000       // $45,000 AUD (Australia build)

// ── Price range assumptions for product page display ──────────────────────────
// Cheapest realistic Japan Hiace: ~$15k vehicle + ~$8k import costs = $23k
// Most expensive realistic Japan Hiace: ~$40k vehicle + ~$12k import costs = $52k
const VAN_RANGE_LOW_AUD  = 23_000
const VAN_RANGE_HIGH_AUD = 52_000

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

  // Japan-sourced — convert JPY to AUD and add real itemised import costs
  const rate = jpyRate && jpyRate > 0 ? jpyRate : FALLBACK_RATE
  const jpyPrice = listing.start_price_jpy || listing.buy_price_jpy || null

  if (jpyPrice && jpyPrice > 0) {
    const vehicleCents = Math.round(jpyPrice * rate * 100)
    const landedCents = vehicleCents + SHIPPING_CENTS
    const gstCents = Math.round(landedCents * GST_RATE)
    const totalCents = vehicleCents + SOURCING_FEE_CENTS + SHIPPING_CENTS + gstCents + CUSTOMS_ENTRY_CENTS + BMSB_CENTS + COMPLIANCE_CENTS
    const priceCents = Math.round(totalCents / 10_000) * 10_000  // round to nearest $100
    return { priceCents, isEstimate: true }
  }

  // Fallback: use pre-stored aud_estimate (stale but better than POA)
  if (listing.aud_estimate && listing.aud_estimate > 0) {
    return { priceCents: listing.aud_estimate, isEstimate: true }
  }

  return { priceCents: null, isEstimate: false }
}

// ── Import breakdown ──────────────────────────────────────────────────────────

export interface ImportBreakdownLine {
  label: string
  cents: number
  note?: string
}

export interface ImportBreakdown {
  vehicleCents: number
  lines: ImportBreakdownLine[]
  totalCents: number
  jpyPrice: number
  jpyRate: number
}

/** Return an itemised import cost breakdown for a Japan-sourced listing. */
export function importBreakdown(
  listing: Pick<Listing, 'start_price_jpy' | 'buy_price_jpy'>,
  jpyRate?: number | null,
): ImportBreakdown | null {
  const rate = jpyRate && jpyRate > 0 ? jpyRate : FALLBACK_RATE
  const jpyPrice = listing.start_price_jpy || listing.buy_price_jpy || null

  if (!jpyPrice || jpyPrice <= 0) return null

  const vehicleCents = Math.round(jpyPrice * rate * 100)
  const landedCents = vehicleCents + SHIPPING_CENTS
  const gstCents = Math.round(landedCents * GST_RATE)
  const totalCents = vehicleCents + SOURCING_FEE_CENTS + SHIPPING_CENTS + gstCents + CUSTOMS_ENTRY_CENTS + BMSB_CENTS + COMPLIANCE_CENTS

  const lines: ImportBreakdownLine[] = [
    { label: 'Vehicle purchase price', cents: vehicleCents, note: `¥${jpyPrice.toLocaleString()} × ${rate.toFixed(4)}` },
    { label: 'Bare Camper sourcing fee', cents: SOURCING_FEE_CENTS, note: '$2,500 + GST' },
    { label: 'Shipping (Japan → Australia)', cents: SHIPPING_CENTS },
    { label: 'GST (10% on vehicle + shipping)', cents: gstCents },
    { label: 'Customs entry + BMSB', cents: CUSTOMS_ENTRY_CENTS + BMSB_CENTS },
    { label: 'Compliance (RAWS + safety cert)', cents: COMPLIANCE_CENTS },
  ]

  return {
    vehicleCents,
    lines,
    totalCents: Math.round(totalCents / 10_000) * 10_000,
    jpyPrice,
    jpyRate: rate,
  }
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
  const vanLow  = VAN_RANGE_LOW_AUD   // already includes import costs
  const vanHigh = VAN_RANGE_HIGH_AUD  // already includes import costs
  return {
    low:  Math.round((vanLow  + conversionAud + includePopTopAud) / 1000) * 1000,
    high: Math.round((vanHigh + conversionAud + includePopTopAud) / 1000) * 1000,
  }
}

/** Format an AUD amount as "$XX,XXX" */
export function formatAud(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-AU')}`
}
