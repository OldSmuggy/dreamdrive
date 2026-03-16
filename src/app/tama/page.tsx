import Link from 'next/link'

export const metadata = {
  title: 'TAMA — 6-Seat Family Campervan | Dream Drive',
  description:
    'The TAMA converts your Toyota Hiace into a 6-seat people mover with ISOFIX, galley kitchen, walnut countertops, and full electrical. From $106,000.',
}

export default function TamaPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-forest-950 min-h-[60vh] flex items-end overflow-hidden">
        {/* TODO: Add TAMA hero photo */}
        {/* Placeholder texture */}
        <div className="absolute inset-0 bg-forest-900 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/30 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-16 pt-32 w-full">
          <p className="text-sand-400 text-xs font-semibold tracking-[0.25em] uppercase mb-3">Dream Drive</p>
          <h1 className="font-display text-7xl md:text-9xl text-white leading-none mb-3">TAMA</h1>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-2">The Family Adventure Van</p>
          <p className="text-white/60 text-base md:text-lg max-w-xl">
            6-seat people mover by day. Fully equipped campervan by night.
          </p>
        </div>
      </section>

      {/* ─── BASE VEHICLE ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Base Vehicle</p>
        <h2 className="font-display text-4xl text-forest-900 mb-4">
          Toyota Hiace H200 — Pop Top Standard Wheel Base
        </h2>
        <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">
          The H200 is the only model Hiace sold in Japan. The cab-over engine design maximises cabin space,
          giving you more room for what matters — family and gear.
        </p>
        <p className="text-sm text-gray-400 mb-10">
          4,695mm L × 1,695mm W × 1,980mm H — Automatic Transmission
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold tracking-widest text-sand-500 uppercase mb-2">2WD Option</p>
            <h3 className="font-display text-2xl text-forest-900 mb-1">2WD · 2.0L Unleaded</h3>
            <p className="text-gray-500 text-sm mb-6">3 front seats</p>
            <p className="font-display text-4xl text-forest-700">$106,000</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold tracking-widest text-sand-500 uppercase mb-2">4×4 Option</p>
            <h3 className="font-display text-2xl text-forest-900 mb-1">4×4 · 2.8L Turbo Diesel</h3>
            <p className="text-gray-500 text-sm mb-6">2 front seats</p>
            <p className="font-display text-4xl text-forest-700">$111,000</p>
          </div>
        </div>
      </section>

      {/* ─── INCLUDED STANDARD ────────────────────────────────── */}
      <section className="bg-sand-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Everything in the box</p>
          <h2 className="font-display text-4xl text-forest-900 mb-12">Included Standard</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4">
            {TAMA_INCLUSIONS.map(item => (
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
        </div>
      </section>

      {/* ─── CHOICE OF LAYOUT ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Tailored for you</p>
        <h2 className="font-display text-4xl text-forest-900 mb-10">Choice of Layout</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {TAMA_LAYOUTS.map(opt => (
            <div key={opt.name} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              {/* TODO: Add layout photo */}
              <div className="h-52 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                {opt.name} photo coming soon
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold tracking-widest text-sand-500 uppercase mb-2">{opt.name}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{opt.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CHOICE OF BED ────────────────────────────────────── */}
      <section className="bg-sand-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Sleep the way you want</p>
          <h2 className="font-display text-4xl text-forest-900 mb-10">Choice of Bed</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {TAMA_BEDS.map(opt => (
              <div key={opt.name} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                {/* TODO: Add bed photo */}
                <div className="h-52 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                  {opt.name} photo coming soon
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold tracking-widest text-sand-500 uppercase mb-2">{opt.name}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SELECT OPTIONS ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Make it yours</p>
        <h2 className="font-display text-4xl text-forest-900 mb-10">Select Options</h2>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
          {TAMA_OPTIONS.map(opt => (
            <div key={opt.name} className="flex items-start justify-between gap-4 px-6 py-5 hover:bg-sand-50 transition-colors">
              <div>
                <p className="font-semibold text-forest-900 text-sm">{opt.name}</p>
                {opt.detail && <p className="text-gray-500 text-xs mt-0.5">{opt.detail}</p>}
              </div>
              <p className="font-display text-forest-700 text-lg shrink-0">{opt.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="bg-forest-900 text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-sand-400 text-xs font-semibold tracking-widest uppercase mb-4">Get started</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Ready to build your TAMA?</h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            Browse available vans, start your build, or talk to us about what&apos;s right for your family.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/configurator?fitout=tama" className="btn-primary text-base px-8 py-4">
              Start My TAMA Build
            </Link>
            <a
              href="mailto:jared@dreamdrive.life"
              className="btn-ghost text-base px-8 py-4"
            >
              Book a Free Consultation
            </a>
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
const TAMA_INCLUSIONS = [
  'Transforming rear seat with ISOFIX (except 2-seater options)',
  'Walnut countertop',
  'Table with adjustable attachment',
  'Fixed full-length bed with removable panel for extra seating',
  'Handcrafted furniture',
  'Quality hardware & hinges',
  'Deep sink & faucet',
  'High pressure pump',
  'Quick release shower hose',
  '38L fresh water tank',
  '2 × 100AH lithium battery',
  'D/C charger',
  'LED down lights',
  'Dimmable LED light bar',
  '2000W inverter',
  'A/C charging outlets ×2',
  '40L refrigerator',
  'Shore power charger',
]

const TAMA_LAYOUTS = [
  {
    name: 'FAMILY SEAT',
    desc: 'Rear folding seat with 3 extra seatbelts and ISOFIX child seat anchors. The ideal layout for families who need full seating capacity alongside all camping facilities.',
  },
  {
    name: 'VANLIFE',
    desc: 'Rear bench seat with slide-out drawer, toilet and pantry space under the bench seat. Optimised for couples or solo adventurers wanting maximum storage and living space.',
  },
]

const TAMA_BEDS = [
  {
    name: 'TAMA',
    desc: 'Semi double bed, galley kitchen with sink, 40L fridge and cupboard for storage. A well-rounded setup that balances sleeping comfort with kitchen functionality.',
  },
  {
    name: 'NICO',
    desc: 'Full width bed with fixed mattress and integrated storage. Features 2 slide-out drawers with table tops — great for those who prioritise a large, comfortable sleeping area.',
  },
]

const TAMA_OPTIONS = [
  { name: 'Recommended Package', detail: 'Black-out curtains, insect screens, insect net rear door, side-window rain cover, MAXXFAN', price: '$3,800' },
  { name: 'Solar Package', detail: 'Solar system 175W', price: '$2,000' },
  { name: 'FF Heater Package', detail: 'Thermal wool insulation + Webasto FF heater', price: '$5,500' },
  { name: 'Side Awning', detail: 'Fiamma 3.5M', price: '$2,300' },
  { name: 'Off-Road Tires', detail: null, price: '$2,300' },
  { name: 'Half Wrap', detail: null, price: '$3,300' },
  { name: 'Lift Kit 2 inch by Ironman 4×4', detail: null, price: '$2,580' },
]
