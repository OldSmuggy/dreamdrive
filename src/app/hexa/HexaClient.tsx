'use client'

import Image from 'next/image'
import OptionsList from '@/components/options/OptionsList'
import { BARE_CAMPER_BUILD_INC_GST_AUD, BARE_CAMPER_BUILD_EX_GST_AUD } from '@/lib/pricing'

// ============================================================
// Bare Camper Build — barecamper.com.au/hexa
// Powered by Dream Drive Japan × Bare Camper Australia
// ============================================================

const MODULE_PRICE = BARE_CAMPER_BUILD_INC_GST_AUD
const MODULE_PRICE_EX_GST = BARE_CAMPER_BUILD_EX_GST_AUD

const STANDARD_INCLUSIONS = [
  {
    category: 'Interior Module System',
    note: 'CNC-cut aluminium & birch waterproof plywood',
    items: [
      'Wood-spring slat bed kit — expands to semi-double',
      'Side cabinet with bamboo top panel',
      'Custom-designed mattress',
      'Laguna removable table',
      'Euro container modular storage system',
    ],
  },
  {
    category: 'Water System',
    note: 'Fitted as standard — no add-on required',
    items: [
      '45L fresh water tank',
      '12V water pump',
      'Sink with bamboo countertop',
    ],
  },
  {
    category: 'Finishing',
    items: [
      'Cypress timber ceiling',
      'Full floor installation',
      'Dimmable LED downlights',
    ],
  },
]

const SPECS = [
  { label: 'Module Design', value: '3D CAD, CNC precision machined' },
  { label: 'Materials', value: 'Aluminium frame + birch waterproof plywood' },
  { label: 'Bed Size', value: 'Semi-double (expandable)' },
  { label: 'Bed Structure', value: 'Wood-spring slat system' },
  { label: 'Storage', value: 'Euro container standard — stackable, modular' },
  { label: 'Ceiling', value: 'Japanese cypress (hinoki)' },
  { label: 'Water', value: '45L fresh water tank with 12V pump' },
  { label: 'Warranty', value: '12-month structural warranty on conversion' },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function InclusionBlock({ group }: { group: { category: string; note?: string; items: string[] } }) {
  return (
    <div className="bg-cream border border-gray-100 rounded-xl p-5">
      <h4 className="text-ocean font-semibold text-sm uppercase tracking-wider mb-1">{group.category}</h4>
      {group.note && <p className="text-gray-400 text-xs mb-3">{group.note}</p>}
      <ul className="space-y-2">
        {group.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-charcoal text-sm">
            <span className="text-ocean mt-0.5 shrink-0 font-bold">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function HexaClient() {
  return (
    <div className="min-h-screen bg-white text-charcoal">
      {/* ── HERO ── */}
      <section style={{ backgroundColor: '#2C2C2A' }} className="text-white">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-16">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Bare Camper Build</p>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 max-w-2xl">
            More than car camping.
            <br />
            <span className="text-gray-400">Less than a full campervan.</span>
          </h1>

          <p className="text-base text-gray-300 max-w-xl mb-8">
            A precision-engineered modular system for the Toyota Hiace — designed in Tokyo,
            CNC-machined from aluminium and birch plywood. Includes the interior system,
            finishing, and water. Electrical is available as an add-on.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="https://wa.me/61432182892?text=I'm%20interested%20in%20the%20Bare%20Camper%20Build"
              className="btn-primary inline-block text-base px-6 py-3"
            >
              Enquire Now
            </a>
            <a
              href="#pricing"
              className="border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* ── HERO IMAGE ── */}
      <section className="max-w-5xl mx-auto px-6 -mt-4 mb-8">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <Image
            src="/images/hexa/interior-wide.jpg"
            alt="Bare Camper Build modular interior — cypress ceiling, aluminium frame, pegboard storage"
            width={1200}
            height={600}
            className="w-full h-auto"
            priority
          />
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-charcoal mb-2">What&apos;s Included in the Module</h2>
        <p className="text-gray-500 mb-8 max-w-xl">
          The {formatPrice(MODULE_PRICE)} module includes the interior system, finishing, and the water system.
          Electrical is available as an add-on below.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STANDARD_INCLUSIONS.map((group) => (
            <InclusionBlock key={group.category} group={group} />
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-cream border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-charcoal mb-2">Pricing</h2>
          <p className="text-gray-500 mb-8 max-w-xl">
            The Bare Camper Build module is <strong className="text-charcoal">{formatPrice(MODULE_PRICE)}</strong> installed,
            including the water system. Electrical and pop-top are available as add-ons.
          </p>

          {/* Module price highlight */}
          <div className="bg-ocean text-white rounded-xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Bare Camper Build — Module</h3>
              <p className="text-white/70 text-sm">Interior module system + water system + cypress ceiling + floor + LED lighting. Fitted to your vehicle.</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold text-sand">{formatPrice(MODULE_PRICE)}</div>
              <div className="text-xs text-white/60">inc. GST · installed</div>
              <div className="text-xs text-white/50 mt-0.5">({formatPrice(MODULE_PRICE_EX_GST)} ex GST)</div>
            </div>
          </div>

          {/* Pop-top callout */}
          <div className="bg-ocean/5 border border-ocean/20 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-ocean text-lg">⬆</span>
                <h3 className="text-lg font-bold text-charcoal">Add a Pop-Top Roof</h3>
              </div>
              <p className="text-gray-500 text-sm max-w-md">
                FRP fibreglass pop-top built at our Brisbane workshop by DIY RV Solutions.
                25 years of fibreglass experience. 10-day turnaround.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-ocean">+$13,090</div>
              <div className="text-xs text-gray-400">inc. GST</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OPTIONS & ADD-ONS (from TAMA) ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-charcoal mb-2">Options & Add-ons</h2>
        <p className="text-gray-500 mb-8 max-w-xl">
          Start with the base build and add what you need. Electrical systems, solar, heating and more — professionally
          installed at our Capalaba workshop.
        </p>
        <OptionsList source="hexa_options" />
      </section>

      {/* ── PHOTO GALLERY ── */}
      <section className="bg-cream border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-charcoal mb-2">Inside the Build</h2>
          <p className="text-gray-500 mb-8 max-w-xl">
            Every detail is intentional. Cypress ceiling, aluminium framing, birch plywood, and Euro container storage — precision-built in Tokyo.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { src: '/images/hexa/ceiling-cypress.jpg', alt: 'Japanese cypress timber ceiling with LED strip lighting' },
              { src: '/images/hexa/cabinet-euro.jpg', alt: 'Modular cabinet with Euro container storage system' },
              { src: '/images/hexa/storage-euro.jpg', alt: 'Euro containers sliding out from rear — stackable modular storage' },
              { src: '/images/hexa/table-laguna.jpg', alt: 'Laguna removable table with bamboo top' },
              { src: '/images/hexa/sink-dometic.jpg', alt: 'Dometic sink with bamboo countertop and pegboard storage' },
              { src: '/images/hexa/storage-overhead.jpg', alt: 'Overhead view of Euro container storage — everything fits' },
              { src: '/images/hexa/seating.jpg', alt: 'Rear seating with green upholstery and modular side cabinet' },
              { src: '/images/hexa/exterior-rear.jpg', alt: 'Van exterior — rear door open showing modular system' },
              { src: '/images/hexa/pegboard-wide.jpg', alt: 'Pegboard wall organiser with hooks and accessories' },
            ].map((img) => (
              <div key={img.src} className="rounded-xl overflow-hidden border border-gray-200 aspect-square relative">
                <Image src={img.src} alt={img.alt} fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 33vw" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL SPECS ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-charcoal mb-8">Full Specifications</h2>

        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
          {SPECS.map((spec) => (
            <div key={spec.label} className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-400 text-sm">{spec.label}</span>
              <span className="text-charcoal text-sm font-medium text-right">{spec.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── DESIGN PHILOSOPHY ── */}
      <section className="bg-cream border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-4">Designed in Tokyo.<br />Built for Australia.</h2>
              <p className="text-gray-500 mb-4">
                Every module is designed in 3D CAD and manufactured using computer-controlled
                precision machinery. Aluminium frames and birch waterproof plywood are finished to
                millimetre tolerances — the result is a module system that&apos;s both strong and beautiful.
              </p>
              <p className="text-gray-500 mb-4">
                The Euro container-based storage system means everything stacks, locks, and travels
                securely. Use it for work during the week and life on the weekends — the build adapts
                to how you use your van.
              </p>
              <p className="text-gray-500">
                The 45L water system is built in as standard. If you want power for fridges, lights or
                inverters, pick an electrical package from the add-ons below.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-5">
              {[
                { icon: '⬡', title: 'Modular by design', desc: 'Work, life, or disaster-prep — reconfigure without tools.' },
                { icon: '◇', title: 'Precision engineered', desc: '3D CAD design, CNC machined to millimetre accuracy.' },
                { icon: '▣', title: 'Euro container standard', desc: 'Everything stacks. Everything fits. Everything travels.' },
                { icon: '◎', title: 'Water ready', desc: '45L fresh water tank + 12V pump fitted as standard.' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <span className="text-ocean text-lg mt-0.5">{f.icon}</span>
                  <div>
                    <div className="font-medium text-charcoal text-sm">{f.title}</div>
                    <div className="text-gray-400 text-xs">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-charcoal mb-8">How It Works</h2>

        <div className="grid sm:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Configure your module', desc: 'Tell us your vehicle and how you\'ll use it. We\'ll confirm the module spec and any add-ons.' },
            { step: '02', title: 'We build in Tokyo', desc: 'Our team fits the full module system to your vehicle at our Tokyo workshop.' },
            { step: '03', title: 'Ship to Brisbane', desc: 'RORO shipping to Australia. We handle compliance, registration, and delivery.' },
            { step: '04', title: 'Finish in Brisbane', desc: 'Any electrical, solar, heating or pop-top add-ons fitted at our Capalaba workshop.' },
          ].map((s) => (
            <div key={s.step} className="relative">
              <div className="text-ocean/20 text-4xl font-black mb-2">{s.step}</div>
              <h3 className="text-charcoal font-semibold mb-1">{s.title}</h3>
              <p className="text-gray-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: '#2C2C2A' }} className="text-white">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Bare Camper Build</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready when you are.</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Talk to Jared about your build. No commitment — just a straight conversation about what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/61432182892?text=I'm%20interested%20in%20the%20Bare%20Camper%20Build"
              className="btn-primary inline-block text-lg px-8 py-4"
            >
              Chat on WhatsApp
            </a>
            <a
              href="mailto:hello@barecamper.com.au?subject=Bare%20Camper%20Build%20Enquiry"
              className="border border-white/30 text-white font-semibold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg"
            >
              Email Us
            </a>
          </div>
          <p className="text-gray-600 text-sm mt-6">
            Or call direct: <a href="tel:0432182892" className="text-gray-400 hover:text-white">0432 182 892</a>
          </p>
        </div>
      </section>

      {/* ── FOOTER NOTE ── */}
      <div className="border-t border-gray-100 bg-cream">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center">
          <p className="text-gray-400 text-xs leading-relaxed max-w-lg mx-auto">
            Module fitted to a customer-supplied or Bare Camper-sourced Toyota Hiace. Prices include GST.
            Finance available through Stratton Finance — <a href="/finance" className="text-ocean hover:underline">learn more</a>.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-gray-300 text-xs">
            <span>Bare Camper</span>
            <span>·</span>
            <span>Dream Drive</span>
            <span>·</span>
            <span>DIY RV Solutions</span>
          </div>
        </div>
      </div>
    </div>
  )
}
