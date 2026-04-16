'use client'

import { useState } from 'react'
import Image from 'next/image'

// ============================================================
// HEXA Product Page
// Powered by Dream Drive Japan × Bare Camper Australia
// ============================================================

const PRICING = {
  standardRoof: [
    { variant: '2WD Petrol', price: 69500, fuel: 'Petrol', drive: '2WD' },
    { variant: '2WD Diesel', price: 75500, fuel: 'Diesel', drive: '2WD' },
    { variant: '4WD Diesel', price: 79500, fuel: 'Diesel', drive: '4WD' },
  ],
  highRoof: [
    { variant: '2WD Petrol', price: 72500, fuel: 'Petrol', drive: '2WD' },
    { variant: '4WD Diesel', price: 82500, fuel: 'Diesel', drive: '4WD' },
  ],
}

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
    category: 'Finishing',
    items: [
      'Cypress (檜) timber ceiling',
      'Full floor installation',
      'Dimmable LED downlights',
    ],
  },
  {
    category: 'Electrical & Water',
    items: [
      'KickAss PowerBoss 2000W AC/DC power system',
      '230Ah lithium battery (LiFePO₄)',
      'DC-DC charger + MPPT solar controller',
      '2000W pure sine wave inverter',
      '45L fresh water system with pump',
    ],
  },
]

const OPTIONS = [
  { name: 'Pop-Top Roof Conversion', price: 13090, note: 'FRP fibreglass by DIY RV Solutions, Brisbane', highlight: true },
  { name: 'Shore Power Connection', price: 1500, note: '240V inlet with battery boxing & venting' },
  { name: 'Solar Panel System (200W)', price: null, note: 'Roof-mounted panels, wired to PowerBoss MPPT' },
  { name: 'MaxxFan Deluxe Ventilation', price: null, note: 'Thermostat-controlled roof fan with rain sensor' },
  { name: 'Blackout Curtain Set', price: null, note: 'Full cabin privacy & thermal insulation' },
  { name: 'Insect Screen Kit', price: null, note: 'Rear door & side windows' },
  { name: 'Window Covers', price: null, note: 'Reflective covers for side windows' },
  { name: 'FF Diesel Heater', price: null, note: 'Webasto or equivalent, thermostat controlled' },
  { name: 'Thermowool Insulation Package', price: null, note: 'Full cabin insulation — walls, ceiling, floor' },
  { name: 'Roof Air Conditioning', price: null, note: 'Rooftop AC unit with 200W solar & 300Ah lithium upgrade' },
]

const SPECS = [
  { label: 'Base Vehicle', value: 'Toyota Hiace H200 (DX grade)' },
  { label: 'Vehicle Age', value: 'Less than 7 years old' },
  { label: 'Odometer', value: 'Under 70,000 km — verified' },
  { label: 'Module Design', value: '3D CAD, CNC precision machined' },
  { label: 'Materials', value: 'Aluminium frame + birch waterproof plywood' },
  { label: 'Bed Size', value: 'Semi-double (expandable)' },
  { label: 'Bed Structure', value: 'Wood-spring slat system' },
  { label: 'Storage', value: 'Euro container standard — stackable, modular' },
  { label: 'Ceiling', value: 'Japanese cypress (檜 / hinoki)' },
  { label: 'Battery', value: '230Ah LiFePO₄ lithium' },
  { label: 'Inverter', value: '2000W pure sine wave' },
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

function HexaLogo() {
  return (
    <svg viewBox="0 0 120 40" className="w-24 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 5L27 12V26L15 33L3 26V12L15 5Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M15 10L23 15V25L15 30L7 25V15L15 10Z" stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.4" />
      <text x="35" y="24" fontFamily="system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="currentColor" letterSpacing="3">HEXA</text>
    </svg>
  )
}

function PricingCard({ title, vehicles, selectedRoof, onSelect }: {
  title: string
  vehicles: { variant: string; price: number; fuel: string; drive: string }[]
  selectedRoof: string
  onSelect: (t: string) => void
}) {
  const isSelected = selectedRoof === title
  return (
    <div
      onClick={() => onSelect(title)}
      className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 p-6 ${
        isSelected
          ? 'border-amber-500 bg-stone-800 shadow-lg shadow-amber-500/10'
          : 'border-stone-700 bg-stone-800/60 hover:border-stone-500'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-3 left-6 bg-amber-500 text-stone-900 text-xs font-bold px-3 py-1 rounded-full tracking-wide">
          SELECTED
        </div>
      )}
      <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4">{title}</h3>
      <div className="space-y-3">
        {vehicles.map((v) => (
          <div key={v.variant} className="flex items-center justify-between py-2 border-b border-stone-700/50 last:border-0">
            <div>
              <span className="text-stone-200 font-medium">{v.variant}</span>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-stone-700 text-stone-400 px-2 py-0.5 rounded">{v.drive}</span>
                <span className="text-xs bg-stone-700 text-stone-400 px-2 py-0.5 rounded">{v.fuel}</span>
              </div>
            </div>
            <span className="text-xl font-bold text-stone-100 tabular-nums">{formatPrice(v.price)}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-500 mt-4">Inc. GST · Drive away · Vehicle + full HEXA conversion</p>
    </div>
  )
}

function InclusionBlock({ group }: { group: { category: string; note?: string; items: string[] } }) {
  return (
    <div className="bg-stone-800/40 border border-stone-700/50 rounded-xl p-5">
      <h4 className="text-amber-500 font-semibold text-sm uppercase tracking-wider mb-1">{group.category}</h4>
      {group.note && <p className="text-stone-500 text-xs mb-3">{group.note}</p>}
      <ul className="space-y-2">
        {group.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-stone-300 text-sm">
            <span className="text-amber-500 mt-0.5 shrink-0">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function HexaClient() {
  const [selectedRoof, setSelectedRoof] = useState('Standard Roof')
  const [showAllOptions, setShowAllOptions] = useState(false)

  const displayedOptions = showAllOptions ? OPTIONS : OPTIONS.slice(0, 5)

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/0 via-stone-900/60 to-stone-900" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 20V40L30 55L5 40V20L30 5Z' fill='none' stroke='%23a8a29e' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-amber-500">
              <HexaLogo />
            </div>
            <span className="text-xs text-stone-500 uppercase tracking-widest border-l border-stone-700 pl-3">
              Powered by Dream Drive
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 max-w-2xl">
            More than car camping.
            <br />
            <span className="text-stone-400">Less than a full campervan.</span>
          </h1>

          <p className="text-lg text-stone-400 max-w-xl mb-2">
            車中泊仕様以上、キャンピングカー未満。
          </p>

          <p className="text-base text-stone-400 max-w-xl mb-8">
            The HEXA is a precision-engineered modular system for the Toyota Hiace — designed in Tokyo,
            CNC-machined from aluminium and birch plywood, and delivered to Australia with a verified
            low-kilometre vehicle. Everything you need to sleep, work, and travel. Nothing you don&apos;t.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="https://wa.me/61432182892?text=I'm%20interested%20in%20the%20HEXA"
              className="bg-amber-500 text-stone-900 font-semibold px-6 py-3 rounded-lg hover:bg-amber-400 transition-colors"
            >
              Enquire Now
            </a>
            <a
              href="#pricing"
              className="border border-stone-600 text-stone-300 font-semibold px-6 py-3 rounded-lg hover:border-stone-400 hover:text-stone-100 transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* ── HERO IMAGE ── */}
      <section className="max-w-5xl mx-auto px-6 -mt-4 mb-8">
        <div className="rounded-2xl overflow-hidden border border-stone-800">
          <Image
            src="/images/hexa/interior-wide.jpg"
            alt="HEXA modular campervan interior — cypress ceiling, aluminium frame, pegboard storage"
            width={1200}
            height={600}
            className="w-full h-auto"
            priority
          />
        </div>
      </section>

      {/* ── VEHICLE SPEC STRIP ── */}
      <section className="border-y border-stone-800 bg-stone-900/80">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Vehicle', value: 'Toyota Hiace H200' },
              { label: 'Age', value: '< 7 years' },
              { label: 'Odometer', value: '< 70,000 km' },
              { label: 'Grade', value: 'Auction Verified' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-amber-500 text-lg font-bold">{s.value}</div>
                <div className="text-stone-500 text-xs uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-2">What&apos;s Included</h2>
        <p className="text-stone-400 mb-8 max-w-xl">
          Every HEXA comes fully fitted with the module system, finishing, electrical, and water — ready to go.
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          {STANDARD_INCLUSIONS.map((group) => (
            <InclusionBlock key={group.category} group={group} />
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-stone-950/50 border-y border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold mb-2">Pricing</h2>
          <p className="text-stone-400 mb-8 max-w-xl">
            All prices include GST, the verified vehicle, full HEXA conversion, KickAss PowerBoss electrical system, and 45L water system. Drive away — no hidden costs.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <PricingCard
              title="Standard Roof"
              vehicles={PRICING.standardRoof}
              selectedRoof={selectedRoof}
              onSelect={setSelectedRoof}
            />
            <PricingCard
              title="High Roof"
              vehicles={PRICING.highRoof}
              selectedRoof={selectedRoof}
              onSelect={setSelectedRoof}
            />
          </div>

          {/* Pop-top callout */}
          <div className="bg-gradient-to-r from-amber-500/10 to-stone-800/40 border border-amber-500/30 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-500 text-lg">⬆</span>
                <h3 className="text-lg font-bold text-stone-100">Add a Pop-Top Roof</h3>
              </div>
              <p className="text-stone-400 text-sm max-w-md">
                FRP fibreglass pop-top built at our Brisbane workshop by DIY RV Solutions.
                25 years of fibreglass experience. 10-day turnaround.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-amber-500">+$13,090</div>
              <div className="text-xs text-stone-500">inc. GST</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OPTIONS ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-2">Options & Add-ons</h2>
        <p className="text-stone-400 mb-8 max-w-xl">
          Start with the HEXA base and add what you need. All options are professionally installed at our Capalaba workshop.
        </p>

        <div className="space-y-3">
          {displayedOptions.map((opt, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                opt.highlight
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-stone-800 bg-stone-800/30 hover:border-stone-700'
              }`}
            >
              <div>
                <div className="font-medium text-stone-200">{opt.name}</div>
                <div className="text-sm text-stone-500 mt-0.5">{opt.note}</div>
              </div>
              <div className="text-right shrink-0 ml-4">
                {opt.price ? (
                  <span className="font-bold text-stone-100">{formatPrice(opt.price)}</span>
                ) : (
                  <span className="text-stone-500 text-sm">POA</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {!showAllOptions && OPTIONS.length > 5 && (
          <button
            onClick={() => setShowAllOptions(true)}
            className="mt-4 text-amber-500 text-sm font-medium hover:text-amber-400 transition-colors"
          >
            Show all {OPTIONS.length} options →
          </button>
        )}
      </section>

      {/* ── FULL SPECS ── */}
      <section className="border-t border-stone-800 bg-stone-950/30">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold mb-8">Full Specifications</h2>

          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
            {SPECS.map((spec) => (
              <div key={spec.label} className="flex justify-between py-3 border-b border-stone-800/60">
                <span className="text-stone-500 text-sm">{spec.label}</span>
                <span className="text-stone-200 text-sm font-medium text-right">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-2">Inside the HEXA</h2>
        <p className="text-stone-400 mb-8 max-w-xl">
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
            { src: '/images/hexa/exterior-rear.jpg', alt: 'HEXA van exterior — rear door open showing modular system' },
            { src: '/images/hexa/pegboard-wide.jpg', alt: 'Pegboard wall organiser with hooks and accessories' },
          ].map((img) => (
            <div key={img.src} className="rounded-xl overflow-hidden border border-stone-800 aspect-square relative">
              <Image src={img.src} alt={img.alt} fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 33vw" />
            </div>
          ))}
        </div>
      </section>

      {/* ── DESIGN PHILOSOPHY ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">Designed in Tokyo.<br />Built for Australia.</h2>
            <p className="text-stone-400 mb-4">
              Every HEXA module is designed in 3D CAD and manufactured using computer-controlled
              precision machinery. Aluminium frames and birch waterproof plywood are finished to
              millimetre tolerances — the result is a module system that&apos;s both strong and beautiful.
            </p>
            <p className="text-stone-400 mb-4">
              The Euro container-based storage system means everything stacks, locks, and travels
              securely. Use it for work during the week and life on the weekends — the HEXA adapts
              to how you use your van.
            </p>
            <p className="text-stone-400">
              For Australia, we add the KickAss PowerBoss electrical system and a 45L water setup —
              everything you need for off-grid weekends and extended touring.
            </p>
          </div>
          <div className="bg-stone-800/40 border border-stone-700/50 rounded-xl p-8 space-y-5">
            {[
              { icon: '⬡', title: 'Modular by design', desc: 'Work, life, or disaster-prep — reconfigure without tools.' },
              { icon: '◇', title: 'Precision engineered', desc: '3D CAD design, CNC machined to millimetre accuracy.' },
              { icon: '▣', title: 'Euro container standard', desc: 'Everything stacks. Everything fits. Everything travels.' },
              { icon: '⚡', title: 'Off-grid ready', desc: 'KickAss PowerBoss 2000W + 45L water, straight out of the box.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="text-amber-500 text-lg mt-0.5">{f.icon}</span>
                <div>
                  <div className="font-medium text-stone-200 text-sm">{f.title}</div>
                  <div className="text-stone-500 text-xs">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold mb-8">How It Works</h2>

          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Choose your spec', desc: 'Pick your drivetrain, fuel type, and roof height. We\'ll source a verified vehicle from Japan.' },
              { step: '02', title: 'We build in Tokyo', desc: 'Our team fits the full HEXA module system to your vehicle at our Tokyo workshop.' },
              { step: '03', title: 'Ship to Brisbane', desc: 'RORO shipping to Australia. We handle compliance, registration, and delivery.' },
              { step: '04', title: 'Finish in Brisbane', desc: 'PowerBoss electrical, 45L water, and any options fitted at our Capalaba workshop. Pop-top if you want it.' },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="text-amber-500/30 text-4xl font-black mb-2">{s.step}</div>
                <h3 className="text-stone-200 font-semibold mb-1">{s.title}</h3>
                <p className="text-stone-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-b from-stone-900 to-stone-950">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="text-amber-500 mb-4 flex justify-center">
            <HexaLogo />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready when you are.</h2>
          <p className="text-stone-400 max-w-md mx-auto mb-8">
            Talk to Jared about your HEXA build. No commitment — just a straight conversation about what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/61432182892?text=I'm%20interested%20in%20the%20HEXA"
              className="bg-amber-500 text-stone-900 font-semibold px-8 py-4 rounded-lg hover:bg-amber-400 transition-colors text-lg"
            >
              Chat on WhatsApp
            </a>
            <a
              href="mailto:hello@barecamper.com.au?subject=HEXA%20Enquiry"
              className="border border-stone-600 text-stone-300 font-semibold px-8 py-4 rounded-lg hover:border-stone-400 hover:text-stone-100 transition-colors text-lg"
            >
              Email Us
            </a>
          </div>
          <p className="text-stone-600 text-sm mt-6">
            Or call direct: <a href="tel:0432182892" className="text-stone-500 hover:text-stone-400">0432 182 892</a>
          </p>
        </div>
      </section>

      {/* ── FOOTER NOTE ── */}
      <div className="border-t border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center">
          <p className="text-stone-600 text-xs leading-relaxed max-w-lg mx-auto">
            All prices include GST and are based on a Toyota-verified Hiace H200 (DX grade), less than 7 years old with under 70,000km.
            Prices may vary based on specific vehicle sourced. Vehicle availability subject to Japan auction supply.
            Finance available through Stratton Finance — <a href="/finance" className="text-stone-500 hover:text-stone-400">learn more</a>.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-stone-700 text-xs">
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
