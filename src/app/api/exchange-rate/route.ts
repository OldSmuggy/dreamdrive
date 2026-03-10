import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const revalidate = 3600 // cache 1hr

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'jpy_aud_override').single()
  const override = data?.value ? parseFloat(data.value) : null

  if (override) return NextResponse.json({ rate: override, source: 'override' })

  try {
    const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID
    if (!appId) throw new Error('no app id')
    const r = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${appId}&symbols=JPY,AUD`)
    const json = await r.json()
    const usdToJpy = json.rates.JPY as number
    const usdToAud = json.rates.AUD as number
    const jpyToAud = usdToAud / usdToJpy
    return NextResponse.json({ rate: jpyToAud, source: 'live' })
  } catch {
    // Fallback rate
    return NextResponse.json({ rate: 0.0095, source: 'fallback' })
  }
}
