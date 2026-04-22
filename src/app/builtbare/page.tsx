import { createAdminClient } from '@/lib/supabase'
import { HEXA_BASE_2WD_AUD, HEXA_BASE_4WD_AUD, HEXA_POP_TOP_AUD } from '@/lib/pricing'
import HexaProductClient from './HexaProductClient'
import { generateMeta } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const metadata = generateMeta({
  title: 'HEXA — Modular Adventure Van | Toyota Hiace H200 | From $75,000 | Bare Camper',
  description: "Dream Drive's entry-level campervan. Used Toyota Hiace H200 + precision-engineered modular fitout from Tokyo. Optional pop-top. From $75,000 delivered in Australia.",
  url: '/builtbare',
})

export default async function HexaPage() {
  const supabase = createAdminClient()

  const contentRes = await supabase
    .from('page_content')
    .select('content_key, value')
    .eq('page_slug', 'hexa-product')

  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'HEXA — Modular Adventure Van',
    description: "Entry-level campervan on a hand-picked Toyota Hiace H200 from Japan. Precision-engineered modular fitout, sub-battery system, optional pop-top. From $75,000.",
    brand: { '@type': 'Brand', name: 'Bare Camper' },
    url: 'https://builtbare.com.au/builtbare',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'AUD',
      lowPrice: HEXA_BASE_2WD_AUD,
      highPrice: HEXA_BASE_4WD_AUD + HEXA_POP_TOP_AUD,
      offerCount: 2,
      availability: 'https://schema.org/PreOrder',
    },
    category: 'Campervan Conversion',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HexaProductClient content={content} />
    </>
  )
}
