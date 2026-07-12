import { createAdminClient } from '@/lib/supabase'
import { getJpyRate } from '@/lib/settings'
import { manaConversionAud, conversionPriceRange } from '@/lib/pricing'
import ManaProductClient from './ManaProductClient'
import { generateMeta } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const metadata = generateMeta({
  title: 'MANA — Liveable Compact Campervan Conversion | Bare Camper',
  description: 'The MANA is built for two on the long road. 75L fridge, toilet, external shower, 200AH lithium. Pop top optional. From ~$69,000.',
  url: '/mana',
})

export default async function ManaPage() {
  const [jpyRate, contentRes] = await Promise.all([
    getJpyRate(),
    createAdminClient().from('page_content').select('content_key, value').eq('page_slug', 'mana-product'),
  ])
  const { low, high } = conversionPriceRange(manaConversionAud(jpyRate))
  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'MANA — Liveable Compact Campervan Conversion',
    description: 'Compact campervan conversion on Toyota Hiace LWB. 75L fridge, toilet, external shower, 200AH lithium. Pop top optional. Built for two on the long road.',
    brand: { '@type': 'Brand', name: 'Bare Camper' },
    url: 'https://barecamper.com.au/mana',
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
      <ManaProductClient jpyRate={jpyRate} content={content} />
    </>
  )
}
