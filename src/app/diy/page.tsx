import Link from 'next/link'
import LeadFormModal from '@/components/leads/LeadFormModal'

export const metadata = {
  title: 'DIY Your Way — Pop Top, Grid Bed Kit & Base Vans | Dream Drive',
  description:
    'Get a professional pop top roof conversion and do the rest yourself. Grid modular bed kit, base vans from Japan, and everything you need for your own build.',
}

export default function DiyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-forest-950 min-h-[60vh] flex items-end overflow-hidden">
        {/* TODO: Add DIY hero photo */}
        <div className="absolute inset-0 bg-forest-900 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/30 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-16 pt-32 w-full">
          <p className="text-sand-400 text-xs font-semibold tracking-[0.25em] uppercase mb-3">Dream Drive</p>
          <h1 className="font-display text-7xl md:text-9xl text-white leading-none mb-3">DIY</h1>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-2">We handle the hard stuff. You make it yours.</p>
          <p className="text-white/60 text-base md:text-lg max-w-xl">
            Professional pop top conversion + modular bed kit. Your interior, your rules.
          </p>
        </div>
      </section>

      {/* ─── SECTION 1: POP TOP ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Step 1</p>
            <h2 className="font-display text-4xl text-forest-900 mb-4">Start with a Pop Top</h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Our fibreglass pop top roof conversion gives you standing room, ventilation, and a van that
              still fits in your garage. Installed at our Brisbane factory in 10 business days.
            </p>
            <div className="flex gap-8 mb-8">
              <div>
                <p className="font-display text-3xl text-forest-700">$11,900</p>
                <p className="text-gray-400 text-xs mt-0.5">ex GST</p>
              </div>
              <div>
                <p className="font-display text-3xl text-forest-700">10 days</p>
                <p className="text-gray-400 text-xs mt-0.5">turnaround</p>
              </div>
              <div>
                <p className="font-display text-3xl text-forest-700">+600mm</p>
                <p className="text-gray-400 text-xs mt-0.5">standing height</p>
              </div>
            </div>
            <Link href="/pop-top" className="btn-primary inline-block px-6 py-3 text-sm">
              See Full Pop Top Details →
            </Link>
          </div>
          {/* TODO: Add pop top photo */}
          <div className="h-72 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
            Pop Top photo coming soon
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: BARE CAMPER ───────────────────────────── */}
      <section className="bg-sand-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* TODO: Add Bare Camper photo */}
            <div className="h-72 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-sm md:order-first order-last">
              Bare Camper photo coming soon
            </div>
            <div>
              <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Step 2</p>
              <h2 className="font-display text-4xl text-forest-900 mb-4">Bare Camper by Skybridge</h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                A modular bed system designed for the Toyota Hiace H200. Simple to install, easy to
                reconfigure. The perfect foundation for a DIY interior — add your own mattress, panels,
                and storage around it.
              </p>
              <p className="font-display text-3xl text-forest-700 mb-8">From $25,000</p>
              <Link href="/configurator?fitout=grid" className="btn-primary inline-block px-6 py-3 text-sm">
                Configure Bare Camper →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: BASE VAN ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Step 3</p>
            <h2 className="font-display text-4xl text-forest-900 mb-4">Find Your Base Van</h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Browse 200+ Toyota Hiace vans from Japan auctions and dealers. We handle import, shipping,
              and compliance. You get a clean base van ready for your own conversion — no guesswork on
              the paperwork.
            </p>
            <Link href="/browse" className="btn-primary inline-block px-6 py-3 text-sm">
              Browse Vans →
            </Link>
          </div>
          {/* TODO: Add browse/van photo */}
          <div className="h-72 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
            Van photo coming soon
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: ELECTRICAL CABINET ───────────────────── */}
      <section className="bg-sand-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* TODO: Add electrical cabinet photo */}
            <div className="h-72 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-sm md:order-first order-last">
              Electrical cabinet photo coming soon
            </div>
            <div>
              <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Optional add-on</p>
              <h2 className="font-display text-4xl text-forest-900 mb-4">Standalone Electrical Cabinet</h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Want the electrical done professionally but handling everything else yourself? Our
                wall-mount or under-bed electrical cabinet comes fully wired and ready to install —
                lithium battery, inverter, charger, outlets, and more.
              </p>
              <a
                href="mailto:jared@dreamdrive.life?subject=Electrical%20Cabinet%20Enquiry"
                className="btn-primary inline-block px-6 py-3 text-sm"
              >
                Enquire About Electrical →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="bg-forest-900 text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-sand-400 text-xs font-semibold tracking-widest uppercase mb-4">Let&apos;s build</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Ready to start your DIY build?</h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            Browse available base vans or get in touch to plan your build.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/browse" className="btn-primary text-base px-8 py-4">
              Browse Base Vans
            </Link>
            <LeadFormModal
              trigger="Book a Consultation"
              source="product_page_diy"
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
