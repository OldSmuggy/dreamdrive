import Link from 'next/link'
import LeadFormModal from '@/components/leads/LeadFormModal'

export const metadata = {
  title: 'MANA — Liveable Compact Campervan | Dream Drive',
  description:
    'The MANA is built for two on the long road. Pop top, 75L fridge, toilet, external shower, 200AH lithium. From $105,000.',
}

export default function ManaPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-forest-950 min-h-[60vh] flex items-end overflow-hidden">
        {/* TODO: Add MANA hero photo */}
        <div className="absolute inset-0 bg-forest-900 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/30 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-16 pt-32 w-full">
          <p className="text-sand-400 text-xs font-semibold tracking-[0.25em] uppercase mb-3">Dream Drive</p>
          <h1 className="font-display text-7xl md:text-9xl text-white leading-none mb-3">MANA</h1>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-2">Liveable Compact Campervan</p>
          <p className="text-white/60 text-base md:text-lg max-w-xl">
            Built for two. Designed for the long road.
          </p>
        </div>
      </section>

      {/* ─── OVERVIEW ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Overview</p>
        <h2 className="font-display text-4xl text-forest-900 mb-6">Built for the long haul</h2>
        <p className="text-gray-500 max-w-3xl mb-8 leading-relaxed text-lg">
          The MANA Campervan is the ultimate vehicle for reliable, long-term adventures on the road.
          Built on the globally trusted, easy-to-maintain Toyota Hiace H200 platform. Designed in Australia
          for a comfortable life on the road, the interior boasts a liveable space for 2 with full standing
          room, a kitchen, toilet, and external shower. Larger water tanks for extended off-grid travel.
          3 seatbelts. Choice of 2.7L unleaded or 2.8L turbo diesel engine, including factory-built AWD option.
        </p>
        <p className="text-sm text-gray-400">4,695mm L × 1,695mm W × 2,100mm H (approx)</p>
      </section>

      {/* ─── BASE PRICING ─────────────────────────────────────── */}
      <section className="bg-sand-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Pricing</p>
          <h2 className="font-display text-4xl text-forest-900 mb-10">Base Vehicle Pricing</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-2xl p-8 bg-white hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold tracking-widest text-sand-500 uppercase mb-2">2WD Option</p>
              <h3 className="font-display text-2xl text-forest-900 mb-1">2WD Hiace Unleaded</h3>
              <p className="text-gray-500 text-sm mb-6">2.7L petrol engine</p>
              <p className="font-display text-4xl text-forest-700">$105,000</p>
            </div>
            <div className="border border-gray-200 rounded-2xl p-8 bg-white hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold tracking-widest text-sand-500 uppercase mb-2">AWD Option</p>
              <h3 className="font-display text-2xl text-forest-900 mb-1">AWD Hiace Diesel</h3>
              <p className="text-gray-500 text-sm mb-6">2.8L turbo diesel</p>
              <p className="font-display text-4xl text-forest-700">$114,000</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INCLUDED STANDARD ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Everything in the box</p>
        <h2 className="font-display text-4xl text-forest-900 mb-12">Included Standard</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4">
          {MANA_INCLUSIONS.map(item => (
            <div key={item} className="flex items-start gap-3 py-2 border-b border-gray-200/60">
              <span className="text-forest-600 mt-0.5 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-gray-700 text-sm leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SELECT OPTIONS ───────────────────────────────────── */}
      <section className="bg-sand-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Make it yours</p>
          <h2 className="font-display text-4xl text-forest-900 mb-10">Select Options</h2>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
            {MANA_OPTIONS.map(opt => (
              <div key={opt.name} className="flex items-start justify-between gap-4 px-6 py-5 hover:bg-sand-50 transition-colors">
                <div>
                  <p className="font-semibold text-forest-900 text-sm">{opt.name}</p>
                  {opt.detail && <p className="text-gray-500 text-xs mt-0.5">{opt.detail}</p>}
                </div>
                <p className="font-display text-forest-700 text-lg shrink-0">{opt.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUALITY HIGHLIGHTS ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Built to last</p>
        <h2 className="font-display text-4xl text-forest-900 mb-10">Quality You Can Feel</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {MANA_QUALITY.map(card => (
            <div key={card.title} className="border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-shadow">
              <h3 className="font-display text-xl text-forest-900 mb-3">{card.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="bg-forest-900 text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-sand-400 text-xs font-semibold tracking-widest uppercase mb-4">Get started</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Ready to build your MANA?</h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            Browse available vans, start your build, or get in touch to discuss your needs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/configurator?fitout=mana" className="btn-primary text-base px-8 py-4">
              Start My MANA Build
            </Link>
            <LeadFormModal
              trigger="Book a Free Consultation"
              source="product_page_mana"
              className="btn-ghost text-base px-8 py-4"
            />
          </div>
          <p className="mt-10 text-gray-400 text-sm">
            <a href="mailto:jared@dreamdrive.life" className="text-sand-400 hover:text-sand-300">jared@dreamdrive.life</a>
            {' · '}
            <a href="tel:0432182892" className="text-sand-400 hover:text-sand-300">0432 182 892</a>
          </p>
        </div>
      </section>
    </div>
  )
}

// ── Static data ───────────────────────────────────────────────────────────────
const MANA_INCLUSIONS = [
  'Pop top roof offering standing space',
  'Table with adjustable attachment',
  'Modular bed kit',
  'Handcrafted furniture',
  'Quality hardware & hinges',
  'Sink & faucet',
  'High pressure pump',
  'Shower hose',
  '55L fresh water tank',
  '200AH lithium battery',
  'D/C charger',
  'LED down lights',
  'Dimmable LED light bar',
  '2000W inverter',
  'A/C charging outlets ×2',
  '75L upright refrigerator',
  'Shore power charger',
  'Toilet under seat/bed',
  'Plenty of storage under the bed',
  '10cm thick trifold mattress',
  '12L grey tank',
]

const MANA_OPTIONS = [
  { name: 'Recommended Package', detail: 'Black-out curtains, insect screens, insect net rear door, side-window rain cover, fan', price: '$3,800' },
  { name: 'Solar Package', detail: 'Solar system 200W', price: '$2,000' },
  { name: 'Hot Water Package', detail: 'Duoletto 12V/240V water system with 10L additional water storage', price: '$2,000' },
  { name: 'Side Awning', detail: 'Fiamma 3.5M', price: '$2,300' },
  { name: 'Shower Awning', detail: null, price: '$800' },
  { name: 'Off-Road Tires', detail: null, price: '$2,000' },
  { name: 'Half Wrap', detail: null, price: '$3,300' },
]

const MANA_QUALITY = [
  {
    title: 'Furniture & Hardware',
    body: 'Carefully finished furniture made using top quality wood and ply, free of harmful VOC and chemical adhesives. Hand crafted by Japanese craftsmen at our Tokyo facility. Walnut kitchen countertops. Quality hinges and hardware sourced from Japan and Europe.',
  },
  {
    title: 'Paints & Oils',
    body: 'Eco-friendly and non-toxic Osmo brand paints and oils. Allows wood to breathe naturally. Fulfils European standards. Safe for children and pets.',
  },
  {
    title: 'Quality Electrical',
    body: '2000W inverter and outlets, 200AH lithium iron phosphate battery, battery display monitor, D/C charger, high quality water pump, 3-way LED down lights, dimmable LED bar, shore power.',
  },
  {
    title: 'Safety Features',
    body: 'Toyota Safety Sense, lane departure alert, pre-collision safety system, panoramic view monitor*, parking sensors*, front driver and passenger airbags*. (*Certain features may not be on all base vehicles)',
  },
]
