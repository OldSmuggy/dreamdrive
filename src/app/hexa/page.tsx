import { generateMeta } from '@/lib/seo'
import HexaClient from './HexaClient'

export const metadata = generateMeta({
  title: 'Bare Camper Build — Modular Campervan Conversion | Toyota Hiace | Bare Camper',
  description: 'Bare Camper Build — a precision-engineered modular system for the Toyota Hiace. Module from $25,000 installed, includes interior system, finishing, and water. Electrical available as an add-on.',
  url: '/hexa',
})

export default function HexaPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Bare Camper Build — Modular Campervan Conversion',
    description: 'Precision-engineered modular system for the Toyota Hiace. Designed in Tokyo, CNC-machined from aluminium and birch plywood. Module from $25,000 installed — includes interior system, finishing, and water. Electrical available as an add-on.',
    brand: { '@type': 'Brand', name: 'Bare Camper' },
    url: 'https://barecamper.com.au/hexa',
    offers: {
      '@type': 'Offer',
      price: 25000,
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
