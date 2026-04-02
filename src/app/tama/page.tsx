import { createAdminClient } from '@/lib/supabase'
import { getJpyRate } from '@/lib/settings'
import { tamaConversionAud, conversionPriceRange } from '@/lib/pricing'
import TamaProductClient from './TamaProductClient'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'TAMA — 6-Seat Family Campervan | Bare Camper',
  description: 'The TAMA converts your Toyota Hiace into a 6-seat people mover with ISOFIX, galley kitchen, walnut countertops, and full electrical. From $106,000.',
}

export default async function TamaPage({ searchParams }: { searchParams: Promise<{ van?: string }> }) {
  const supabase = createAdminClient()
  const params = await searchParams
  const vanId = params.van ?? null

  const [jpyRate, contentRes, vanRes] = await Promise.all([
    getJpyRate(),
    supabase.from('page_content').select('content_key, value').eq('page_slug', 'tama-product'),
    vanId ? supabase.from('listings').select('id, model_name, model_year, price_aud').eq('id', vanId).single() : Promise.resolve({ data: null }),
  ])

  const conversionAud = tamaConversionAud(jpyRate)
  const { low, high } = conversionPriceRange(conversionAud)
  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  const van = vanRes.data
  const vanDisplayName = van ? `${van.model_year ?? ''} ${van.model_name}`.trim() : null
  return (
    <TamaProductClient
      conversionAud={conversionAud}
      low={low}
      high={high}
      jpyRate={jpyRate}
      content={content}
      vanId={van?.id ?? null}
      vanName={vanDisplayName}
      vanPriceCents={van?.price_aud ?? null}
    />
  )
}
