import { createAdminClient } from '@/lib/supabase'
import { getJpyRate } from '@/lib/settings'
import { kumaQConversionAud, conversionPriceRange } from '@/lib/pricing'
import KumaQProductClient from './KumaQProductClient'
import { generateMeta } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const metadata = generateMeta({
  title: 'KUMA-Q — Super Long Wheelbase Campervan Conversion | Bare Camper',
  description: 'The KUMA-Q converts your Toyota Hiace Super Long into a full-length campervan with queen bed, galley kitchen, and 4-seat dining. From $120,000.',
  url: '/kuma-q',
})

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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'KUMA-Q — Super Long Wheelbase Campervan Conversion',
    description: 'Full-length campervan conversion on Toyota Hiace Super Long. Queen bed, galley kitchen, 4-seat dining, 200AH lithium, full electrical.',
    brand: { '@type': 'Brand', name: 'Bare Camper' },
    url: 'https://barecamper.com.au/kuma-q',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'AUD',
      lowPrice: low,
      highPrice: high,
      offerCount: 1,
      availability: 'https://schema.org/InStock',
    },
    category: 'Campervan Conversion',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
    </>
  )
}
