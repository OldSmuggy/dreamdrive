import Link from 'next/link'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Sell or Tip a Van | Earn $200 Finders Fee | Bare Camper',
  description: 'Spotted a great Hiace? Tip us off and earn $200 if it sells. Or list your own van on Bare Camper for free.',
  url: '/sell',
})

export default function SellPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-cream py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-4">Sell or Tip</p>
          <h1 className="text-4xl md:text-5xl text-charcoal font-bold mb-4">Got a van? Let&apos;s talk.</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Spotted a great Hiace? Let us know and earn $200. Got one to sell? List it here for free.
          </p>
        </div>
      </section>

      {/* Two options */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Tip a Van */}
          <div className="border-2 border-ocean/20 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="text-5xl mb-4">💡</div>
            <h2 className="text-2xl font-bold text-charcoal mb-3">Tip a Van — Earn $200</h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              Seen a great Hiace on Facebook, Gumtree, or parked down the street? Drop us the link or details. If it sells through Bare Camper, we&apos;ll pay you a <strong className="text-charcoal">$200 finders fee</strong>.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-start gap-2"><span className="text-ocean">✓</span> Takes 60 seconds</li>
              <li className="flex items-start gap-2"><span className="text-ocean">✓</span> $200 for Japanese vans bought by a customer</li>
              <li className="flex items-start gap-2"><span className="text-ocean">✓</span> $200 for Aussie vans that lead to a conversion</li>
              <li className="flex items-start gap-2"><span className="text-ocean">✓</span> We do all the legwork</li>
            </ul>
            <Link href="/tip-a-van" className="btn-primary inline-block text-sm px-6 py-3">
              Send a Tip →
            </Link>
          </div>

          {/* List Your Van */}
          <div className="border-2 border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="text-5xl mb-4">📬</div>
            <h2 className="text-2xl font-bold text-charcoal mb-3">List Your Van</h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              Selling a van yourself? List it on Bare Camper for free. We&apos;ll show it to our buyer network — people actively looking for conversion-ready vans.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-start gap-2"><span className="text-ocean">✓</span> Free to list</li>
              <li className="flex items-start gap-2"><span className="text-ocean">✓</span> Reach buyers who want to convert</li>
              <li className="flex items-start gap-2"><span className="text-ocean">✓</span> We handle enquiries</li>
              <li className="flex items-start gap-2"><span className="text-ocean">✓</span> No commission on private sales</li>
            </ul>
            <Link href="/account/my-listings" className="btn-secondary inline-block text-sm px-6 py-3">
              Create a Listing →
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
