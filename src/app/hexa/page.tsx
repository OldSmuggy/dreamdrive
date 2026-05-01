import { generateMeta } from '@/lib/seo'
import HexaClient from './HexaClient'
import { BARE_CAMPER_BUILD_INC_GST_AUD } from '@/lib/pricing'

export const metadata = generateMeta({
  title: 'Bare Camper Build — Modular Campervan Conversion | Toyota Hiace | Bare Camper',
  description: `Bare Camper Build — a precision-engineered modular system for the Toyota Hiace. Module from $${BARE_CAMPER_BUILD_INC_GST_AUD.toLocaleString('en-AU')} inc. GST installed, includes interior system, finishing, and water. Electrical available as an add-on.`,
  url: '/hexa',
})

export default function HexaPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Bare Camper Build — Modular Campervan Conversion',
    description: `Precision-engineered modular system for the Toyota Hiace. Designed in Tokyo, CNC-machined from aluminium and birch plywood. Module from $${BARE_CAMPER_BUILD_INC_GST_AUD.toLocaleString('en-AU')} inc. GST installed — includes interior system, finishing, and water. Electrical available as an add-on.`,
    brand: { '@type': 'Brand', name: 'Bare Camper' },
    url: 'https://barecamper.com.au/hexa',
    offers: {
      '@type': 'Offer',
      price: BARE_CAMPER_BUILD_INC_GST_AUD,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
    },
    category: 'Campervan Conversion',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HexaClient />
    </>
  )
}
