import { createSupabaseServer } from './supabase-server'

/** Returns JPY/AUD rate (e.g. 0.0095 means 1 JPY = 0.0095 AUD, 1 AUD ≈ 105 JPY) */
export async function getJpyRate(): Promise<number> {
  try {
    const supabase = createSupabaseServer()
    const { data } = await supabase.from('settings').select('jpy_aud_override').limit(1).maybeSingle()
    const rate = parseFloat(data?.jpy_aud_override ?? '')
    return Number.isFinite(rate) && rate > 0 ? rate : 0.0095
  } catch {
    return 0.0095
  }
}

/** Format AUD cents as AUD + approximate JPY */
export function audWithJpy(cents: number, jpyRate: number): string {
  const aud = cents / 100
  const jpy = Math.round(aud / jpyRate / 1000) * 1000
  return `$${aud.toLocaleString('en-AU')} AUD (approx. ¥${jpy.toLocaleString('en-AU')} JPY)`
}
