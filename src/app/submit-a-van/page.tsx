import { generateMeta } from '@/lib/seo'
import SubmitVanForm from './SubmitVanForm'

export const metadata = generateMeta({
  title: 'List Your Van for Free | Bare Camper Community Marketplace',
  description: 'List your Japanese campervan build on Bare Camper for free. Upload photos, add your details, and reach buyers actively looking for campervans.',
  url: '/submit-a-van',
})

export default function SubmitAVanPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-charcoal text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Community Marketplace</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">List your van for free.</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto leading-relaxed">
            Upload your photos, tell us about the van, and we&apos;ll review it. Once approved, your listing goes live and interested buyers can reach out to you directly.
          </p>
        </div>
      </section>

      {/* What you'll need */}
      <section className="py-12 bg-cream border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl mb-2">📸</div>
              <p className="font-semibold text-charcoal text-sm mb-1">At least 5 photos</p>
              <p className="text-gray-500 text-xs leading-relaxed">4 exterior sides + 1 interior shot. More is better.</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📋</div>
              <p className="font-semibold text-charcoal text-sm mb-1">Basic van details</p>
              <p className="text-gray-500 text-xs leading-relaxed">Year, mileage, body type, asking price.</p>
            </div>
            <div>
              <div className="text-2xl mb-2">⏱️</div>
              <p className="font-semibold text-charcoal text-sm mb-1">About 5 minutes</p>
              <p className="text-gray-500 text-xs leading-relaxed">That&apos;s all it takes to create a listing.</p>
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
            <strong className="text-charcoal">What vans qualify?</strong> Japanese campervan builds — Toyota Hiace, Nissan Caravan, or similar. Must be a genuine conversion or build.
          </p>
          <p>
            <strong className="text-charcoal">Will Bare Camper inspect the van?</strong> No — your listing is shown as a &ldquo;Community Build&rdquo;, which means buyers know it&apos;s owner-listed and not Bare Camper stock. We review photos and details before publishing.
          </p>
          <p>
            <strong className="text-charcoal">How do buyers contact me?</strong> When someone is interested, we&apos;ll email you their details. You can then reach out to them directly.
          </p>
          <p>
            <strong className="text-charcoal">Is there a fee?</strong> No — listing is completely free. No commission on private sales.
          </p>
        </div>
      </section>
    </div>
  )
}
