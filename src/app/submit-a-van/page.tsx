import { generateMeta } from '@/lib/seo'
import SubmitVanForm from './SubmitVanForm'

export const metadata = generateMeta({
  title: 'Submit a Van — Earn $200 Finders Fee | Bare Camper',
  description: 'Have a van to list? Submit it with photos and van details. If a Bare Camper customer buys it, you earn a $200 finders fee. Takes about 5 minutes.',
  url: '/submit-a-van',
})

export default function SubmitAVanPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-charcoal text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Community Listings</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Submit a van, earn $200.</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto leading-relaxed">
            Found a great Hiace? Upload your photos, tell us about the van, and we&apos;ll list it on Bare Camper.
            If it sells, you earn a <strong className="text-sand">$200 finders fee</strong>.
          </p>
        </div>
      </section>

      {/* What you'll need */}
      <section className="py-12 bg-cream border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl mb-2">📸</div>
              <p className="font-semibold text-charcoal text-sm mb-1">At least 6 photos</p>
              <p className="text-gray-500 text-xs leading-relaxed">4 exterior sides + 2 interior shots. More is better.</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📋</div>
              <p className="font-semibold text-charcoal text-sm mb-1">Basic van details</p>
              <p className="text-gray-500 text-xs leading-relaxed">Year, mileage, body type, asking price.</p>
            </div>
            <div>
              <div className="text-2xl mb-2">⏱️</div>
              <p className="font-semibold text-charcoal text-sm mb-1">About 5 minutes</p>
              <p className="text-gray-500 text-xs leading-relaxed">That&apos;s all it takes to submit a listing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <SubmitVanForm />
        </div>
      </section>

      {/* Fine print */}
      <section className="py-10 bg-cream border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-xs text-gray-400 leading-relaxed space-y-2">
          <p>
            <strong className="text-charcoal">What vans qualify?</strong> Toyota Hiace H200 or H300, any body length. Diesel preferred. Must be suitable for campervan conversion.
          </p>
          <p>
            <strong className="text-charcoal">Will Bare Camper inspect the van?</strong> No — your submission is listed as a &ldquo;Community Find&rdquo;, which means buyers know it&apos;s customer-submitted and not Bare Camper-vetted. We&apos;ll review photos and details before publishing.
          </p>
          <p>
            <strong className="text-charcoal">When do I get paid?</strong> Once the sale settles and the van has been purchased by a customer through Bare Camper. We&apos;ll email you.
          </p>
          <p>
            <strong className="text-charcoal">What if I want to buy it myself?</strong> Just say so in the notes — we&apos;ll treat it as an enquiry instead.
          </p>
        </div>
      </section>
    </div>
  )
}
