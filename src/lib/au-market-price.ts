/**
 * Australian market price lookup for Toyota Hiace H200.
 *
 * Based on 68 real listings observed across Carsales, CarsGuide,
 * and Autotrader. Updated monthly — see PRICING_SOURCE.
 */

export interface AuMarketPrice {
  au_market_price_low: number
  au_market_price_high: number
  au_market_source: string
  au_market_note: string
}

// [low AUD, high AUD]
const PRICING_TABLE: Record<string, Record<string, Record<string, [number, number]>>> = {
  '2010-2013': {
    '2wd': {
      poor:      [16000, 21000],
      average:   [19000, 25000],
      good:      [24000, 30000],
      excellent: [27000, 33000],
    },
    '4wd': {
      poor:      [24000, 30000],
      average:   [28000, 35000],
      good:      [33000, 40000],
      excellent: [37000, 44000],
    },
  },
  '2014-2016': {
    '2wd': {
      poor:      [18000, 24000],
      average:   [23000, 30000],
      good:      [28000, 35000],
      excellent: [32000, 38000],
    },
    '4wd': {
      poor:      [30000, 37000],
      average:   [35000, 42000],
      good:      [40000, 50000],
      excellent: [45000, 55000],
    },
  },
  '2017-2019': {
    '2wd': {
      poor:      [22000, 28000],
      average:   [27000, 35000],
      good:      [33000, 43000],
      excellent: [40000, 52000],
    },
    '4wd': {
      poor:      [35000, 42000],
      average:   [42000, 50000],
      good:      [48000, 58000],
      excellent: [55000, 68000],
    },
  },
  '2020+': {
    '2wd': {
      poor:      [30000, 38000],
      average:   [35000, 45000],
      good:      [42000, 52000],
      excellent: [50000, 62000],
    },
    '4wd': {
      poor:      [42000, 50000],
      average:   [48000, 58000],
      good:      [55000, 65000],
      excellent: [60000, 75000],
    },
  },
}

const PRICING_SOURCE = 'Carsales, CarsGuide, Autotrader — March 2026'

function getConditionTier(km: number): string {
  if (km < 80000) return 'excellent'
  if (km < 150000) return 'good'
  if (km < 250000) return 'average'
  return 'poor'
}

function getYearBracket(year: number): string {
  if (year <= 2013) return '2010-2013'
  if (year <= 2016) return '2014-2016'
  if (year <= 2019) return '2017-2019'
  return '2020+'
}

export function getAuMarketPrice(year: number, drive: string | null, km: number): AuMarketPrice | null {
  const condition = getConditionTier(km)
  const yearBracket = getYearBracket(year)
  const driveKey = drive?.toUpperCase() === '4WD' ? '4wd' : '2wd'

  const bracket = PRICING_TABLE[yearBracket]?.[driveKey]?.[condition]
  if (!bracket) return null

  const kmLabel = km < 1000 ? '<1K' : Math.round(km / 1000) + 'K'

  return {
    au_market_price_low: bracket[0],
    au_market_price_high: bracket[1],
    au_market_source: PRICING_SOURCE,
    au_market_note: `Based on ${yearBracket} H200 ${drive?.toUpperCase() || '2WD'} in ${condition} condition (${kmLabel} km)`,
  }
}
