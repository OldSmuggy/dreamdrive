import { createAdminClient } from '@/lib/supabase'
import { getJpyRate } from '@/lib/settings'
import { kumaQConversionAud, conversionPriceRange } from '@/lib/pricing'
import KumaQProductClient from './KumaQProductClient'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'KUMA-Q — Super Long Wheelbase Campervan | Bare Camper',
  description: 'The KUMA-Q converts your Toyota Hiace Super Long into a full-length campervan with queen bed, galley kitchen, and 4-seat dining. From $120,000.',
}

export default async function KumaQPage({ searchParams }: { searchParams: Promise<{ van?: string }> }) {
  const supabase = createAdminClient()
  const params = await searchParams
  const vanId = params.van ?? null

  const [jpyRate, contentRes, vanRes] = await Promise.all([
    getJpyRate(),
    supabase.from('page_content').select('content_key, value').eq('page_slug', 'kuma-q-product'),
    vanId ? supabase.from('listings').select('id, model_name, model_year, price_aud').eq('id', vanId).single() : Promise.resolve({ data: null }),
  ])

  const conversionAud = kumaQConversionAud(jpyRate)
  const { low, high } = conversionPriceRange(conversionAud)
  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  const van = vanRes.data
  const vanDisplayName = van ? `${van.model_year ?? ''} ${van.model_name}`.trim() : null
  return (
    <KumaQProductClient
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
