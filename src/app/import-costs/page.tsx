import Link from 'next/link'
import ImportCalculator from './ImportCalculator'
import Footer from '@/components/ui/Footer'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'How Much Does It Cost to Import a Hiace from Japan?',
  description: 'Transparent breakdown of every cost involved in importing a Toyota Hiace from Japan to Australia — auction fees, shipping, compliance, and registration.',
  url: '/import-costs',
})

const FITOUTS = [
  {
    name: 'TAMA',
    icon: '🪑',
    desc: '6-seater family conversion with fold-flat sleeping platform, galley kitchen, and full carpet lining.',
    range: '$12,000 – $18,000',
    href: '/products/tama',
  },
  {
    name: 'MANA',
    icon: '🏕️',
    desc: 'Full liveable campervan — standing room, composting toilet, 55L water, 200AH lithium battery.',
    range: '$18,000 – $28,000',
    href: '/products/mana',
  },
  {
    name: 'Grid Bed Kit',
    icon: '🛏️',
    desc: 'Modular sleeping platform with quick-release rails. Folds up for full cargo use.',
    range: '$2,500 – $5,000',
    href: '/products/grid-bed-kit',
  },
  {
    name: 'Pop Top Roof',
    icon: '🏠',
    desc: '+600mm standing height when raised. Installed at our Brisbane factory.',
    range: '$9,500 – $14,000',
    href: '/products/poptop',
  },
  {
    name: 'Electrical Systems',
    icon: '⚡',
    desc: 'From starter cabinet (100AH AGM) to full off-grid pro (300AH lithium, 400W solar).',
    range: '$2,500 – $12,000',
    href: '/build',
  },
]

const WHAT_IS_INCLUDED = [
  { label: 'Japan purchase price', desc: 'The bid or buy-now price of the van at auction or from a dealer.' },
  { label: 'Import duty (5%)', desc: 'Applied to the purchase price of the vehicle by Australian Customs.' },
  { label: 'RORO shipping', desc: 'Roll-on/roll-off freight from Japan to Brisbane. $2,600–$3,200 depending on Hiace size.' },
  { label: 'Marine insurance', desc: 'Approx. $300–$500. Covers transit from Japan to port of entry.' },
  { label: 'Compliance & ADR', desc: 'Approx. $2,200. Includes inspection (covered by your sourcing fee).' },
  { label: 'Registration', desc: '$500–$1,000 depending on state. Queensland is typically the lowest.' },
]

export default function ImportCostsPage() {
  return (
    <div className="min-h-screen">

      {/* ---- Disclaimer banner ---- */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 text-sm text-amber-800">
          <span className="text-base shrink-0">⚠️</span>
          <p>
            <strong>All costs shown are estimates and subject to change.</strong>{' '}
            Final pricing is confirmed at your free consultation call with the Bare Camper team.
          </p>
        </div>
      </div>

      {/* ---- Hero ---- */}
      <section className="bg-charcoal text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Import Cost Guide</p>
          <h1 className="text-4xl md:text-6xl leading-tight mb-5">
            What Does It Cost to Import a Hiace?
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
            We use RORO (roll-on/roll-off) shipping exclusively — no containers. Here&apos;s a transparent breakdown of every cost from Japan to your driveway.
          </p>
        </div>
      </section>

      {/* ---- What's included ---- */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-3xl text-charcoal mb-2">What&apos;s Included</h2>
        <p className="text-gray-500 mb-8">
          Vehicle inspection is included in the sourcing fee — you don&apos;t pay it separately.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WHAT_IS_INCLUDED.map(item => (
            <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-gray-900 mb-1">{item.label}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Calculator ---- */}
      <section className="bg-cream py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl text-charcoal mb-2">Cost Calculator</h2>
          <p className="text-gray-500 mb-8">
            Adjust the sliders to estimate your total landed cost. Fit-out costs are separate — see the table below.
          </p>
          <ImportCalculator />
        </div>
      </section>

      {/* ---- Fit-out comparison ---- */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-3xl text-charcoal mb-2">Add a Fit-Out</h2>
        <p className="text-gray-500 mb-8 max-w-2xl">
          Import costs get you the van — fit-outs make it a home. All installations are done at our Brisbane workshop. Prices are indicative ranges; exact pricing at consultation.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {FITOUTS.map(f => (
            <div key={f.name} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-xl text-charcoal mb-1">{f.name}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">{f.desc}</p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-ocean text-lg">{f.range}</span>
                <Link href={f.href} className="text-ocean font-semibold text-sm hover:underline">
                  Details →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-charcoal text-white rounded-2xl p-8 text-center">
          <h3 className="text-3xl mb-3">Ready to get an exact quote?</h3>
          <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            Book a free 30-minute call and we&apos;ll walk through the full landed cost for the exact van and build you have in mind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/build" className="btn-primary px-8 py-4 text-base">
              Build My Van →
            </Link>
            <Link href="/browse" className="btn-ghost px-8 py-4 text-base">
              Browse Available Vans
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
