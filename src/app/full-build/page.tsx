import Link from 'next/link'
import Image from 'next/image'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Custom Campervan Conversion Brisbane | TAMA, KUMA-Q & MANA Builds | Bare Camper',
  description: 'Full turnkey campervan conversions on Toyota Hiace. Choose TAMA (family), KUMA-Q (SLWB), or MANA (couples). Design yours in our 3D configurator. Brisbane workshop.',
  url: '/full-build',
})

const BUILDS = [
  {
    name: 'MANA',
    tag: 'The Compact Adventurer',
    desc: 'Built for two. Pop top roof, full kitchen, toilet, 200AH lithium. Everything you need for extended trips in a compact package.',
    image: '/images/mana/interior-full.jpg',
    price: 'From ~$68,000',
    vehicle: 'H200 LWB HiAce',
    href: '/mana',
    configUrl: 'https://configure.barecamper.com.au/?model=mana',
  },
  {
    name: 'TAMA',
    tag: 'The Family Adventure Van',
    desc: '6-seat people mover by day. Fully equipped campervan by night. ISOFIX, galley kitchen, walnut countertops, full electrical.',
    image: '/images/tama/interior-overview.jpg',
    price: 'From ~$71,000',
    vehicle: 'H200 LWB HiAce',
    href: '/tama',
    configUrl: 'https://configure.barecamper.com.au/?model=tama',
  },
  {
    name: 'KUMA-Q',
    tag: 'The Full-Length SLWB',
    desc: 'Queen bed, full galley kitchen, 4-seat dining. Maximum space on the Super Long Wheelbase HiAce H200.',
    image: '/images/kuma/interior-dining.jpg',
    price: 'From ~$76,000',
    vehicle: 'H200 SLWB HiAce',
    href: '/kuma-q',
    configUrl: 'https://configure.barecamper.com.au/?model=kuma-q',
  },
]

export default function FullBuildPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-brand-charcoal text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-brand-gold text-xs font-semibold tracking-widest uppercase mb-4">Full Build Conversions</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Your build, your way.</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Van, roof, full interior — we do everything. Choose your model, customise every detail in 3D, and pick up the keys to a finished campervan.
          </p>
          <a
            href="https://configure.barecamper.com.au/?model=tama"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-teal text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-sage transition-colors text-lg"
          >
            Launch 3D Configurator
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </a>
        </div>
      </section>

      {/* Build Options */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {BUILDS.map(build => (
            <div key={build.name} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div className="relative h-52">
                <Image src={build.image} alt={`${build.name} campervan conversion interior`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-2xl font-bold text-charcoal mb-1">{build.name}</h2>
                <p className="text-brand-teal font-semibold text-sm mb-3">{build.tag}</p>
                <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{build.desc}</p>
                <div className="space-y-1 text-sm text-gray-400 mb-4">
                  <p>Base vehicle: {build.vehicle}</p>
                  <p className="text-charcoal font-bold text-lg">{build.price}</p>
                </div>
                <div className="flex gap-3">
                  <Link href={build.href} className="flex-1 text-center py-2.5 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Details
                  </Link>
                  <a href={build.configUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2.5 rounded-lg bg-ocean text-white text-sm font-semibold hover:bg-ocean-dark transition-colors">
                    Design in 3D
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Configurator showcase */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-4">Only at Bare Camper</p>
          <h2 className="text-4xl text-charcoal font-bold mb-4">Design yours in 3D</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Choose your seats, cabinets, ceiling, floor, walls, wrap, and wheels. See the price update in real time. No other campervan company in Australia offers this.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <div className="rounded-xl overflow-hidden">
              <Image src="/images/configurator/config-seats.png" alt="3D configurator seat colour selection" width={400} height={300} className="w-full h-auto" />
            </div>
            <div className="rounded-xl overflow-hidden">
              <Image src="/images/configurator/config-cabinets.png" alt="3D configurator cabinet colour options" width={400} height={300} className="w-full h-auto" />
            </div>
            <div className="rounded-xl overflow-hidden">
              <Image src="/images/configurator/config-exterior.png" alt="3D configurator exterior view with pop top" width={400} height={300} className="w-full h-auto" />
            </div>
          </div>
          <a
            href="https://configure.barecamper.com.au/?model=tama"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base px-8 py-4"
          >
            Launch 3D Configurator →
          </a>
        </div>
      </section>

      {/* What's included */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl text-charcoal font-bold mb-10 text-center">Every full build includes</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4">
          {[
            'Professional fiberglass roof conversion',
            'Handcrafted interior furniture',
            'Walnut countertop',
            'Full electrical system (lithium battery, inverter, shore power)',
            'LED lighting throughout',
            'Galley kitchen with sink & faucet',
            'Refrigerator',
            'Fresh water system with pump',
            'Quality hardware & hinges',
            'Customisable colours and materials',
            'Quick release shower hose',
            'Quality check before handover',
          ].map(item => (
            <div key={item} className="flex items-start gap-3 py-2 border-b border-gray-200/60">
              <span className="text-ocean mt-0.5 shrink-0"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>
              <span className="text-gray-700 text-sm leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
