import { type ClassValue, clsx } from 'clsx'
import { addDays, addHours, nextDay, set, differenceInSeconds } from 'date-fns'
import type { CountdownParts, InspectionScore, Product } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ---- Money ----
export function centsToAud(cents: number | null | undefined): string {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(cents / 100)
}

export function jpyToDisplay(jpy: number | null | undefined): string {
  if (jpy == null) return '—'
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(jpy)
}

// ---- Products / Pricing ----
export function activeSpecial(product: Product): boolean {
  if (!product.special_price_aud || !product.special_start || !product.special_end) return false
  const now = Date.now()
  return now >= new Date(product.special_start).getTime() && now <= new Date(product.special_end).getTime()
}

export function effectivePrice(product: Product): number {
  return activeSpecial(product) && product.special_price_aud
    ? product.special_price_aud
    : product.rrp_aud
}

// ---- Inspection score ----
const SCORE_ORDER: InspectionScore[] = ['S','6','5.5','5','4.5','4','3.5','3','R','RA','X']

export function scoreColor(score: InspectionScore | null | undefined): 'green' | 'amber' | 'red' | 'gray' {
  if (!score) return 'gray'
  const idx = SCORE_ORDER.indexOf(score)
  if (idx <= 1)  return 'green'   // S, 6
  if (idx <= 4)  return 'amber'   // 5.5, 5, 4.5
  return 'red'
}

export function scoreLabel(score: InspectionScore | null | undefined): string {
  const map: Record<string, string> = {
    S: 'Near New', '6': 'Excellent', '5.5': 'Very Good', '5': 'Good',
    '4.5': 'Good Used', '4': 'Good Used', '3.5': 'Fair', '3': 'Fair',
    R: 'Repaired', RA: 'Repaired', X: 'Parts Only',
  }
  return score ? (map[score] ?? score) : '—'
}

// ---- Auction countdown ----
export function nextThursdayAuction(): Date {
  // Returns next Thursday at 10:00 JST (01:00 UTC)
  const now = new Date()
  let d = nextDay(now, 4) // 4 = Thursday
  d = set(d, { hours: 1, minutes: 0, seconds: 0, milliseconds: 0 })
  if (d <= now) d = addDays(d, 7)
  return d
}

export function getCountdown(target: Date): CountdownParts {
  const total = Math.max(0, differenceInSeconds(target, new Date()))
  const days    = Math.floor(total / 86400)
  const hours   = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return { days, hours, minutes, seconds, total }
}

export function auctionUrgency(auctionDate: string | null): 'normal' | 'closing_soon' | 'last_chance' | 'ended' {
  if (!auctionDate) return 'normal'
  const diff = new Date(auctionDate).getTime() - Date.now()
  if (diff < 0) return 'ended'
  if (diff < 24 * 3600 * 1000)  return 'last_chance'
  if (diff < 48 * 3600 * 1000)  return 'closing_soon'
  return 'normal'
}

// ---- Misc ----
export function shortSlug(len = 8): string {
  return Math.random().toString(36).substring(2, 2 + len)
}

export function sourceLabel(source: string): string {
  return { auction: 'AUCTION', dealer_carsensor: 'DEALER', dealer_goonet: 'DEALER', au_stock: 'IN STOCK AU' }[source] ?? source.toUpperCase()
}

export function sourceBadgeColor(source: string): string {
  return { auction: 'bg-amber-500', dealer_carsensor: 'bg-blue-500', dealer_goonet: 'bg-blue-500', au_stock: 'bg-forest-600' }[source] ?? 'bg-gray-500'
}

// ---- Location-based status badges ----
export function locationBadgeInfo(listing: { location_status?: string | null; source: string }): {
  label: string; bg: string; sub: string
} {
  const ls = listing.location_status
  if (ls === 'sold')        return { label: 'SOLD',         bg: 'bg-gray-500',   sub: '' }
  if (ls === 'on_ship')     return { label: 'ON SHIP',      bg: 'bg-orange-600', sub: 'Arriving soon · Fees paid' }
  if (ls === 'in_brisbane' || listing.source === 'au_stock')
                            return { label: 'IN BRISBANE',  bg: 'bg-green-600',  sub: 'Ready for test drive · All fees paid' }
  // default: in_japan (auction / dealer)
  return                           { label: 'IN JAPAN',     bg: 'bg-red-600',    sub: 'Import fees apply · 16–20 week wait' }
}

// ---- Fit-out level badges ----
export function fitOutLevelInfo(level: string | null | undefined): {
  label: string; desc: string; cls: string
} | null {
  if (!level) return null
  const map: Record<string, { label: string; desc: string; cls: string }> = {
    empty:   { label: 'Empty Van',      desc: 'Standard cargo or passenger configuration',                                         cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    partial: { label: 'Head Start',     desc: 'Existing mods — bed platform, lining, or basic cabinetry. Ready for Dream Drive fit-out.', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    full:    { label: 'Full Campervan', desc: 'Fully converted camper — ready to travel',                                         cls: 'bg-forest-50 text-forest-700 border-forest-200' },
  }
  return map[level] ?? null
}
