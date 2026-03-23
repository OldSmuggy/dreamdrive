import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'About Bare Camper — Dream Drive & DIY RV Solutions',
  description: 'Bare Camper is a partnership between Dream Drive (Jared Campion) and DIY RV Solutions (Andrew Taylor). Japanese van imports and 25+ years of fiberglass expertise, all in one platform.',
  url: '/about',
})

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl text-charcoal mb-4 font-bold">About Bare Camper</h1>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
          <p className="text-lg">
            Bare Camper is a partnership between two Aussie businesses — Dream Drive and DIY RV Solutions — built around one idea: give people exactly what they need to build a campervan, and nothing they don&apos;t.
          </p>

          <h2 className="text-2xl text-charcoal font-bold mt-8">Jared Campion — Dream Drive</h2>
          <p>
            Jared&apos;s been importing vehicles from Japan since 2018. His team in Tokyo sources Toyota Hiace vans from auctions and trusted dealers, and handles everything from bidding to compliance to delivery. He knows which models work for conversions and which ones will give you grief. Over 50 vans delivered and counting.
          </p>

          <h2 className="text-2xl text-charcoal font-bold mt-8">Andrew Taylor — DIY RV Solutions</h2>
          <p>
            Andrew runs DIY RV Solutions out of Capalaba, Brisbane — a workshop that&apos;s been building fiberglass pop tops and campervan components for over 25 years. If it goes on a Hiace, his team has built it. Pop tops, hi-tops, electrical systems, furniture — the lot.
          </p>

          <h2 className="text-2xl text-charcoal font-bold mt-8">Why Bare Camper?</h2>
          <p>
            We kept running into the same problem from different angles — people overpaying, getting bad advice, or making expensive mistakes building campervans. So we built a platform where you can get the van, the fiberglass, the parts, and the know-how from one place. No middlemen. Just two teams who do this every day.
          </p>
          <p>
            Whether you want a bare van to build yourself, a professional pop top and DIY kits, or the keys to a finished camper — we&apos;re here when you need us.
          </p>

          <p className="mt-8">
            <a href="mailto:hello@barecamper.com.au" className="text-ocean hover:underline">hello@barecamper.com.au</a>
            {' · '}
            <a href="tel:0432182892" className="text-ocean hover:underline">0432 182 892</a>
            <br />
            Workshop: 1/10 Jones Road, Capalaba QLD 4157
          </p>
        </div>
      </div>
    </div>
  )
}
