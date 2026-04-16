import { generateMeta } from '@/lib/seo'
import HexaClient from './HexaClient'

export const metadata = generateMeta({
  title: 'HEXA — Precision Modular Campervan | Toyota Hiace H200 | Bare Camper',
  description: 'The HEXA is a precision-engineered modular system for the Toyota Hiace — designed in Tokyo, CNC-machined from aluminium and birch plywood. From $69,500 drive away.',
  url: '/hexa',
})

export default function HexaPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'HEXA — Precision Modular Campervan Conversion',
    description: 'Precision-engineered modular system for Toyota Hiace H200. Designed in Tokyo, CNC-machined from aluminium and birch plywood. Includes KickAss PowerBoss 2000W electrical, 230Ah lithium, and 45L water system.',
    brand: { '@type': 'Brand', name: 'Bare Camper' },
    url: 'https://barecamper.com.au/hexa',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'AUD',
      lowPrice: 69500,
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
