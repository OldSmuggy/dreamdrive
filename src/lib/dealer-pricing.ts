// =============================================================================
// Dealer Programme — pricing matrix from the Founding Dealer Pack 2026
// =============================================================================

export type DealerTier = 'shell' | 'nest' | 'mana'
export type DealerGrade = 'entry' | 'mid' | 'premium'

export const DEALER_TIERS: Record<DealerTier, { label: string; tagline: string; description: string }> = {
  shell: {
    label: 'Shell',
    tagline: 'Entry tier — sleep-ready',
    description: 'Base vehicle, brand-new FRP pop-top and the sleep-ready essentials. The cleanest entry point into the range.',
  },
  nest: {
    label: 'Nest',
    tagline: 'Volume tier — working camper',
    description: 'Everything in Shell, plus the kitchen, power and storage that turn a shell into a working camper.',
  },
  mana: {
    label: 'MANA',
    tagline: 'Flagship tier — premium spec',
    description: 'Everything in Nest, plus the flagship spec: built-in upright fridge, premium finishes, extended QA and detail.',
  },
}

export const DEALER_GRADES: Record<DealerGrade, { label: string; description: string }> = {
  entry:   { label: 'Entry · 150,000km+',  description: 'Vehicle base. Strong margin on a working van.' },
  mid:     { label: 'Mid · ~100,000km',    description: 'The showroom sweet spot. Strongest retail story.' },
  premium: { label: 'Premium · <50,000km', description: 'Near-new base. Top of matrix. Highest margin.' },
}

// All values in dollars (not cents) for clarity
export const DEALER_WHOLESALE: Record<DealerTier, Record<DealerGrade, number>> = {
  shell: { entry: 55_000, mid: 65_500, premium: 70_000 },
  nest:  { entry: 65_000, mid: 75_500, premium: 80_000 },
  mana:  { entry: 75_000, mid: 85_500, premium: 90_000 },
}

export const DEALER_RETAIL: Record<DealerTier, Record<DealerGrade, number>> = {
  shell: { entry: 65_000, mid: 77_000,  premium: 82_500 },
  nest:  { entry: 76_500, mid: 89_000,  premium: 94_000 },
  mana:  { entry: 88_500, mid: 100_500, premium: 106_000 },
}

export const DEALER_MARGIN: Record<DealerTier, Record<DealerGrade, number>> = {
  shell: { entry: 10_000, mid: 11_500, premium: 12_500 },
  nest:  { entry: 11_500, mid: 13_500, premium: 14_000 },
  mana:  { entry: 13_500, mid: 15_000, premium: 16_000 },
}

// 3-stage payment split
export const PAYMENT_STAGES = {
  deposit:  0.20,   // 20% on signing
  progress: 0.35,   // 35% when vehicle arrives at port
  final:    0.45,   // 45% before delivery
}

// 5-stage delivery timeline (matches deck)
export const DEALER_TIMELINE_STAGES = [
  { key: 'sign_deposit',     index: 1, label: 'Sign & Deposit',        timing: 'Week 1',     desc: 'One-page heads of terms. Territory exclusivity locked. Deposit paid on agreed tier + vehicle grade.' },
  { key: 'vehicle_sourced',  index: 2, label: 'Vehicle Sourced',       timing: 'Weeks 2-3',  desc: 'We source your specific vehicle from Japanese auction. Photo confirmation within 2 weeks of deposit.' },
  { key: 'ship_build',       index: 3, label: 'Ship & Build',          timing: 'Weeks 6-10', desc: 'Vehicle ships to Brisbane. Pop-top fitted at Capalaba. Build tier conversion completed. Progress payment invoiced when it lands.' },
  { key: 'delivery_launch',  index: 4, label: 'Delivery & Launch',     timing: 'Weeks 12-14', desc: 'Final payment clears. Unit delivered with photo pack, video and 2-hour sales team training.' },
  { key: 'sell_reorder',     index: 5, label: 'Sell & Reorder',        timing: 'Week 14+',   desc: 'Launch unit ready for sale. Reorder is unrestricted — commission a replacement within 30 days of delivery.' },
] as const

export type DealerStageKey = typeof DEALER_TIMELINE_STAGES[number]['key']

/** Calculate dealer payment amounts (cents) from wholesale price (cents). */
export function calculatePaymentSplit(wholesaleCents: number) {
  return {
    deposit:  Math.round(wholesaleCents * PAYMENT_STAGES.deposit),
    progress: Math.round(wholesaleCents * PAYMENT_STAGES.progress),
    final:    Math.round(wholesaleCents * PAYMENT_STAGES.final),
  }
}

export function tierLabel(tier: DealerTier): string {
  return DEALER_TIERS[tier]?.label ?? tier
}
export function gradeLabel(grade: DealerGrade): string {
  return DEALER_GRADES[grade]?.label ?? grade
}
