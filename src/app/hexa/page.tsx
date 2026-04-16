import { generateMeta } from '@/lib/seo'
import HexaClient from './HexaClient'

export const metadata = generateMeta({
  title: 'Bare Camper Build — Modular Campervan Conversion | Toyota Hiace H200 | Bare Camper',
  description: 'The Bare Camper Build is a precision-engineered modular system for the Toyota Hiace — designed in Tokyo, CNC-machined from aluminium and birch plywood. From $25,000 for the conversion module.',
  url: '/hexa',
})

export default function HexaPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Bare Camper Build — Modular Campervan Conversion',
    description: 'Precision-engineered modular system for Toyota Hiace H200. Designed in Tokyo, CNC-machined from aluminium and birch plywood. Module system from $25,000, electrical and water systems available separately.',
    brand: { '@type': 'Brand', name: 'Bare Camper' },
    url: 'https://barecamper.com.au/hexa',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'AUD',
      lowPrice: 25000,
      highPrice: 82500,
      offerCount: 5,
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
