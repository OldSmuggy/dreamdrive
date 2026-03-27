import Link from 'next/link'
import ImportCalculator from './ImportCalculator'
import Footer from '@/components/ui/Footer'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Toyota Hiace Import Costs Australia — What You\'ll Actually Pay | Bare Camper',
  description: 'Full breakdown of every cost to import a Toyota Hiace from Japan to Australia. Auction price, shipping, GST, compliance — no surprises. Includes interactive cost calculator.',
  url: '/import-costs',
})

export default function ImportCostsPage() {
  return (
    <div className="min-h-screen">

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="bg-charcoal text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Import Pricing Guide</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">How Pricing Works</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            No dealer markup. No hidden fees. Just the real cost of getting a quality van to Australia.
          </p>
        </div>
      </section>

      {/* ─── Section 1: Why direct is smarter ───────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="max-w-3xl mb-14">
            <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">The Case for Going Direct</p>
            <h2 className="text-4xl text-charcoal font-bold mb-5">Why direct from auction is smarter</h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              When you buy from an Australian dealer, you&apos;re paying their margin on top of an exporter&apos;s margin on top of the actual auction price. That&apos;s two sets of profit stacked on the same van. With Bare Camper you pay the actual auction price plus a single flat fee. The saving is typically $5,000–$10,000 on the same quality van — or you put those savings into a significantly better van.
            </p>
          </div>

          {/* Comparison chart */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <h3 className="text-lg font-semibold text-charcoal mb-8 text-center">Same van. Two very different prices.</h3>
            <div className="space-y-6">

              {/* Dealer bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Australian Dealer</span>
                  <span className="text-sm font-bold text-red-600">~$35,000</span>
                </div>
                <div className="flex h-10 rounded-lg overflow-hidden text-xs font-semibold">
                  <div className="flex items-center justify-center bg-gray-400 text-white" style={{ width: '43%' }}>
                    Auction ~$15k
                  </div>
                  <div className="flex items-center justify-center bg-gray-500 text-white" style={{ width: '14%' }}>
                    Ship $5k
                  </div>
                  <div className="flex items-center justify-center bg-orange-400 text-white" style={{ width: '14%' }}>
                    Export +
                  </div>
                  <div className="flex items-center justify-center bg-red-500 text-white" style={{ width: '29%' }}>
                    Dealer profit ~$10k
                  </div>
                </div>
              </div>

              {/* Bare Camper bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Bare Camper</span>
                  <span className="text-sm font-bold text-ocean">~$25,000</span>
                </div>
                <div className="flex h-10 rounded-lg overflow-hidden text-xs font-semibold" style={{ width: '72%' }}>
                  <div className="flex items-center justify-center bg-gray-400 text-white" style={{ width: '60%' }}>
                    Auction ~$15k
                  </div>
                  <div className="flex items-center justify-center bg-ocean text-white" style={{ width: '12%' }}>
                    Fee $3k
                  </div>
                  <div className="flex items-center justify-center bg-teal-500 text-white" style={{ width: '28%' }}>
                    Ship + import
                  </div>
                </div>
                {/* Saving annotation */}
                <div className="mt-3 ml-auto w-[28%] flex items-center gap-2">
                  <div className="flex-1 border-t-2 border-dashed border-ocean/40"></div>
                  <span className="text-ocean text-xs font-bold whitespace-nowrap bg-ocean/10 px-2 py-1 rounded-full">Save ~$10k</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              Indicative figures based on a ¥1,500,000 Hiace H200. Actual savings vary by vehicle and exchange rate.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Your costs ───────────────────────────────── */}
      <section className="bg-cream py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">Full Breakdown</p>
            <h2 className="text-4xl text-charcoal font-bold">Your costs — all in one place</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {COSTS.map((item, i) => (
              <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-charcoal text-white text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <h3 className="font-bold text-charcoal text-base">{item.title}</h3>
                  </div>
                  <span className="text-ocean font-bold text-sm shrink-0 bg-ocean/10 px-3 py-1 rounded-full whitespace-nowrap">{item.cost}</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed pl-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 3: Worked example ───────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">Real Numbers</p>
            <h2 className="text-4xl text-charcoal font-bold mb-3">Example: What a typical Hiace costs</h2>
            <p className="text-gray-500 text-lg">
              Based on a ¥2,000,000 H200 LWB Hiace (approx $19,000 AUD at ¥105 to $1)
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Item</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-700">AUD</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_ROWS.map((row, i) => (
                  <tr key={row.item} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-6 py-3.5 text-gray-700">{row.item}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-900">{row.value}</td>
                  </tr>
                ))}
                <tr className="bg-charcoal text-white">
                  <td className="px-6 py-4 font-bold text-base">Total landed &amp; complied</td>
                  <td className="px-6 py-4 text-right font-bold text-sand text-lg">~$28,863</td>
                </tr>
              </tbody>
            </table>

            <div className="px-6 py-5 bg-ocean/5 border-t border-ocean/10">
              <p className="text-sm text-charcoal">
                <span className="font-semibold">Compare this to a similar quality Hiace from an Australian dealer:</span>
                {' '}<span className="text-red-600 font-bold">$33,000 – $38,000</span>
              </p>
              <p className="text-sm text-ocean font-semibold mt-1">
                That&apos;s a saving of $4,000–$9,000 on the same quality van — or a much better van for the same money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 4: Calculator ───────────────────────────────── */}
      <section className="bg-cream py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">Build Your Estimate</p>
            <h2 className="text-4xl text-charcoal font-bold mb-3">Run the numbers yourself</h2>
            <p className="text-gray-500 text-lg">
              Adjust the auction price and see your full landed cost update in real time.
            </p>
          </div>
          <ImportCalculator />
        </div>
      </section>

      {/* ─── Section 5: Ready for your build ────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">Next Steps</p>
            <h2 className="text-4xl text-charcoal font-bold">Ready for your build</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {BUILD_OPTIONS.map(opt => (
              <Link
                key={opt.title}
                href={opt.href}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-ocean/30 transition-all flex flex-col"
              >
                <div className="text-3xl mb-3">{opt.icon}</div>
                <h3 className="font-bold text-charcoal text-lg mb-1">{opt.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{opt.desc}</p>
                <p className="text-ocean font-bold mt-3">{opt.price}</p>
                <span className="text-ocean text-sm font-semibold mt-2 group-hover:underline">View details →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 6: How to get started ──────────────────────── */}
      <section className="bg-charcoal text-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">The Process</p>
            <h2 className="text-4xl font-bold">How to get started</h2>
          </div>
          <div className="space-y-4">
            {HOW_TO_START.map((step, i) => (
              <div key={step.title} className="flex items-start gap-5 bg-white/5 rounded-2xl px-6 py-5">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-ocean text-white font-bold text-sm shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-white text-base mb-1">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer CTA ──────────────────────────────────────────── */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl text-charcoal font-bold mb-4">Ready when you are.</h2>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            Browse available vans, check out our build options, or just have a yarn about what you&apos;re thinking. No commitment, no pressure.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/browse" className="btn-ghost text-base px-8 py-4">Browse Vans</Link>
            <a
              href="https://wa.me/61432182892?text=Hi!%20I'm%20interested%20in%20a%20campervan%20from%20Bare%20Camper."
              className="btn-primary text-base px-8 py-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Free Chat
            </a>
          </div>
          <p className="mt-10 text-gray-400 text-sm">
            <a href="mailto:hello@barecamper.com.au" className="text-ocean hover:underline">hello@barecamper.com.au</a>
            {' · '}
            <a href="tel:0432182892" className="text-ocean hover:underline">0432 182 892</a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ── Static data ───────────────────────────────────────────────────────────────

const COSTS = [
  {
    title: 'Bare Camper sourcing & Japan agent fee',
    cost: '$3,000 flat',
    desc: 'Covers everything from finding your van at auction through to landing it in Australia. Sourcing, inspection, purchase coordination, Japan-side logistics, export paperwork, and import management.',
  },
  {
    title: 'Vehicle purchase price',
    cost: 'Varies',
    desc: 'The actual auction price in JPY, converted at the current exchange rate. You see what we pay. Every van is independently graded at auction — condition, kms, history — so you know exactly what you\'re getting.',
  },
  {
    title: 'Shipping to Australia',
    cost: '~$2,500',
    desc: 'Ocean freight, Yokohama to Brisbane. Includes pre-clean and quarantine preparation in Japan.',
  },
  {
    title: 'Australian customs & GST',
    cost: 'Varies',
    desc: '0% import duty (Japan-built under JEPA free trade agreement). 10% GST on the landed value (vehicle + shipping). Customs entry fee ~$110. BMSB heat treatment ~$250.',
  },
  {
    title: 'Compliance',
    cost: '~$1,800',
    desc: 'Through our recommended RAWS workshop. Includes transport from wharf, roadworthy inspection, emissions check, safety certificate, and compliance plate. We have recommended workshops in QLD, NSW, VIC, and WA.',
  },
]

const EXAMPLE_ROWS = [
  { item: 'Vehicle (¥2,000,000 @ ~¥105/$1)', value: '$19,048' },
  { item: 'Bare Camper fee', value: '$3,000' },
  { item: 'Shipping', value: '$2,500' },
  { item: 'GST (10% on ~$21,548)', value: '$2,155' },
  { item: 'Customs entry + BMSB', value: '$360' },
  { item: 'Compliance (inc transport + safety cert)', value: '$1,800' },
]

const BUILD_OPTIONS = [
  {
    icon: '🏕️',
    title: 'Pop top or hi-top',
    desc: 'Roof conversion done at our Brisbane factory. Professional fiberglass, 10-day turnaround. You handle the rest.',
    price: 'From $13,090 inc GST',
    href: '/pop-top',
  },
  {
    icon: '🪑',
    title: 'Basic fit-out',
    desc: 'Flooring, lining, basic furniture, and electrical starter pack. Great foundation for your own touches.',
    price: 'POA',
    href: '/build',
  },
  {
    icon: '🔑',
    title: 'Full turnkey build',
    desc: 'TAMA (family) or MANA (couples). Complete interior — kitchen, bed, electrical, toilet. Keys and go.',
    price: 'From ~$45,000 all-in',
    href: '/fit-outs',
  },
]

const HOW_TO_START = [
  {
    title: 'Pay a $3,000 deposit to start the search',
    desc: 'This is applied directly to your sourcing fee. It gets us started and secures your spot in the queue.',
  },
  {
    title: 'We find vans matching your spec',
    desc: 'You see the auction grades, photos, kms, and condition reports. No surprises — you approve before we bid.',
  },
  {
    title: 'You approve a van — we win it at auction',
    desc: 'Once you\'re happy, we bid on your behalf. We know the right prices and won\'t overpay.',
  },
  {
    title: 'We handle shipping, customs, compliance',
    desc: 'Everything from Japan to your state is handled. You\'ll get updates along the way.',
  },
  {
    title: 'Van arrives complied and ready',
    desc: 'Choose your build level — bare van, roof conversion, or full fit-out. Or just drive it home.',
  },
]
