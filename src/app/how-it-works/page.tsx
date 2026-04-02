import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/ui/Footer'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'How It Works — Import a Campervan from Japan to Australia',
  description: 'From choosing your van to driving it home — here\'s exactly how we import and convert your Toyota Hiace, step by step. Transparent pricing, real timelines, no dealer markup.',
  url: '/how-it-works',
})

const STEPS = [
  {
    number: '01',
    title: 'Browse & Choose Your Van',
    desc: 'Search our live inventory of Japanese auction and dealer vans — all graded, photographed, and priced transparently. Filter by model year, mileage, size, and grade. Found one you like? Lock it in or tell us what you\'re looking for and we\'ll source it.',
    timeline: 'Immediately',
    icon: '🔍',
    detail: 'Every van shows the Japanese auction grade, interior condition rating, full photo set, and our estimated landed cost in AUD. No guessing games.',
  },
  {
    number: '02',
    title: 'Configure Your Build',
    desc: 'Decide how far you want to take it. Just the van? A pop top or hi-top roof? A full TAMA or MANA conversion? Pick your fit-out level and electrical package — we\'ll give you a total all-in price upfront.',
    timeline: 'Same day',
    icon: '🛠️',
    detail: 'Your price includes the van, shipping, compliance, GST, and your chosen conversion. One number, no surprises.',
  },
  {
    number: '03',
    title: 'Secure with a $2,500 + GST Hold',
    desc: 'Place a fully refundable $2,750 deposit to lock in your van. This is your Bare Camper sourcing fee and covers both our Japan-side buyer\'s agent and the Australia-side brokerage — we\'re the only campervan brand that handles both under one fee.',
    timeline: 'Week 1',
    icon: '🔒',
    detail: 'Most importers outsource to third-party agents in Japan and charge you separately. Our $2,500 + GST covers everything: bidding, inspection, purchase, export, import approval, customs, compliance coordination, and project management. Changed your mind? The hold is fully refundable.',
  },
  {
    number: '04',
    title: 'We Win & Ship Your Van',
    desc: 'We handle the auction bidding (or dealer negotiation), payment in yen, export documentation, and RORO ocean freight from Yokohama to Brisbane. You get progress updates at every stage.',
    timeline: 'Weeks 2–6',
    icon: '🚢',
    detail: 'Shipping takes 3–4 weeks. While your van is on the water, we start prepping the compliance paperwork so there\'s no wasted time on arrival.',
  },
  {
    number: '05',
    title: 'Customs, Compliance & Registration',
    desc: 'On arrival in Australia, we clear customs (10% GST, 0% duty under JAEPA), pass quarantine, and send the van to a RAWS-approved compliance workshop. They fit the compliance plate, do the safety check, and get it registered.',
    timeline: 'Weeks 7–10',
    icon: '✅',
    detail: 'Compliance typically costs ~$1,800 for a standard H200 Hiace. We handle QLD registration as standard — interstate rego can be arranged.',
  },
  {
    number: '06',
    title: 'Conversion (If Selected)',
    desc: 'If you\'ve chosen a pop top, hi-top, or full campervan conversion, your van goes straight to the DIY RV Solutions factory in Brisbane. Professional fit-out by our partner team — from 10 business days for a roof conversion to 8–12 weeks for a full TAMA or MANA build.',
    timeline: 'Weeks 10–18',
    icon: '🏗️',
    detail: 'Pop top: 10 business days. Hi-top: 10 business days. Full MANA conversion: 8–12 weeks. You get photo updates throughout.',
  },
  {
    number: '07',
    title: 'Collect Your Van & Hit the Road',
    desc: 'Pick up your fully registered, road-ready campervan from our Brisbane facility. We walk you through everything — electrical systems, gas, water, pop top operation. Then you\'re off.',
    timeline: 'Day 1 of your adventure',
    icon: '🏕️',
    detail: 'All Bare Camper conversions come with a 12-month warranty on the fit-out and electrical. The van itself comes with 1-month compliance warranty.',
  },
]

const TRUST_STATS = [
  { value: 'JP + AU + NZ', label: 'our own teams' },
  { value: '$2,750', label: 'refundable deposit' },
  { value: '0% duty', label: 'under JAEPA free trade' },
  { value: '12-month', label: 'conversion warranty' },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section style={{ backgroundColor: '#2C2C2A' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">How It Works</p>
          <h1 className="text-4xl md:text-6xl leading-tight mb-6 max-w-3xl">
            From Japan to your driveway — here&apos;s the full process
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mb-10 leading-relaxed">
            We&apos;re the only campervan brand with our own team in Japan, Australia, and New Zealand.
            That means we handle every step — from sourcing your van at auction to converting it
            into the campervan you want. No third-party agents. No dealer markup. No stress.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/browse" className="btn-primary inline-block text-base px-8 py-4">
              Browse vans →
            </Link>
            <Link href="/import-costs" className="inline-block text-base px-8 py-4 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
              See pricing breakdown
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {TRUST_STATS.map(stat => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl text-ocean leading-snug mb-1">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline steps */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-charcoal mb-3">Your import journey, step by step</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Every Bare Camper import follows this process. We keep you updated at every stage.
            </p>
          </div>

          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-ocean/20 hidden md:block" />

            <div className="space-y-8 md:space-y-12">
              {STEPS.map((step, i) => (
                <div key={step.number} className="relative flex gap-5 md:gap-8">
                  {/* Step number circle */}
                  <div className="relative z-10 shrink-0">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-ocean text-white flex items-center justify-center text-lg md:text-xl font-bold shadow-md">
                      {step.icon}
                    </div>
                  </div>

                  {/* Content card */}
                  <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-ocean text-sm font-bold">Step {step.number}</span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{step.timeline}</span>
                    </div>
                    <h3 className="text-xl md:text-2xl text-charcoal mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-3">{step.desc}</p>
                    <p className="text-sm text-gray-500 bg-cream/70 rounded-lg p-3 leading-relaxed">
                      💡 {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Real worked example */}
      <section id="real-example" className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">Real Numbers</p>
            <h2 className="text-3xl md:text-4xl text-charcoal mb-3">What you actually pay — a real import</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              This is a real Toyota Hiace we imported to Queensland in 2025. Every dollar accounted for — no hidden fees.
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-5 lg:gap-8 lg:items-start">
            {/* Photo */}
            <div className="lg:col-span-2 mb-6 lg:mb-0">
              <div className="relative rounded-2xl overflow-hidden">
                <Image
                  src="/images/example-import-hiace.jpg"
                  alt="2020 Toyota Hiace DX 2.8L Diesel LWB — imported from Japan and delivered to Queensland"
                  width={800}
                  height={533}
                  className="w-full h-auto object-cover"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                2020 Toyota Hiace DX 2.8L Diesel (LWB) — delivered to QLD, March 2025
              </p>
            </div>

            {/* Breakdown */}
            <div className="lg:col-span-3">
              <div className="bg-cream rounded-2xl overflow-hidden">
                <div className="space-y-0">
                  {[
                    { label: 'Vehicle purchase (¥4,394,000 @ ¥97/$1)', value: '$45,565', note: 'Actual auction price, converted at customs valuation rate' },
                    { label: 'Japan Import Service Fee ($2,500 + GST)', value: '$2,750', note: 'Our Japan buyer + AU broker — one fee, both countries' },
                    { label: 'Shipping — RORO Yokohama → Brisbane (LWB)', value: '$1,711', note: 'SLWB vans are +$2,000 due to size' },
                    { label: 'GST (10% on landed value)', value: '$4,729', note: '10% on vehicle + shipping. 0% import duty under JAEPA.' },
                    { label: 'Customs entry + processing', value: '$109', note: 'Australian customs entry fee' },
                    { label: 'BMSB inspection + port transport', value: '$473', note: 'Biosecurity inspection at Cargo Clear + transport from port' },
                    { label: 'Compliance (RAWS) + safety cert', value: '$1,927', note: 'RAWS compliance plate, roadworthy, safety cert, transport to workshop' },
                    { label: 'Registration + stamp duty (QLD, 6 months)', value: '$1,185', note: 'State government fees — varies by state and rego period' },
                    { label: 'Rego arrangement fee', value: '$110', note: 'We handle the paperwork' },
                  ].map((row, i) => (
                    <div key={row.label} className={`flex justify-between items-start px-5 py-3 ${i % 2 === 0 ? 'bg-cream' : 'bg-white'}`}>
                      <div className="flex-1 min-w-0 mr-4">
                        <span className="text-gray-700 text-sm block">{row.label}</span>
                        <span className="text-gray-400 text-xs">{row.note}</span>
                      </div>
                      <span className="text-charcoal font-semibold text-sm shrink-0">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-5 py-4 bg-charcoal text-white">
                    <span className="font-bold text-base">Total — landed, complied & registered</span>
                    <span className="text-sand text-xl font-bold">$58,559</span>
                  </div>
                </div>

                <div className="px-5 py-4 bg-ocean/5 border-t border-ocean/10">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <strong className="text-charcoal">Important:</strong> You are responsible for all associated fees shown above. Additional costs may apply if your shipment is flagged for BMSB fumigation or heat treatment at the border. Compliance and registration costs vary by state. This example is for Queensland — other states may differ. Exchange rate fluctuates daily.
                  </p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <Link href="/import-costs" className="text-ocean text-sm font-semibold hover:underline">
                  Use our interactive calculator for your exact numbers →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Build options teaser */}
      <section className="bg-charcoal text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-3">Choose your path</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Every buyer is different. Start with just the van, or go all the way to a turnkey camper.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Just the Van',
                price: 'From ~$29k',
                desc: 'Imported, complied, and registered. Drive away and build it yourself, or use it as a workhorse.',
                href: '/browse',
                cta: 'Browse vans',
              },
              {
                title: 'Van + Roof Conversion',
                price: 'From ~$42k',
                desc: 'Add a pop top ($13,090) or hi-top ($15,090) from DIY RV Solutions. 10 business day turnaround.',
                href: '/pop-top',
                cta: 'See roof options',
              },
              {
                title: 'Full Turnkey Build',
                price: 'From ~$105k',
                desc: 'TAMA (family 6-seater) or MANA (couples adventure). Kitchen, power, water, bed — everything.',
                href: '/tama',
                cta: 'Explore builds',
              },
            ].map(option => (
              <div key={option.title} className="border border-white/10 rounded-2xl p-7 hover:border-ocean/40 transition-colors">
                <h3 className="text-xl mb-1">{option.title}</h3>
                <p className="text-ocean font-bold text-lg mb-3">{option.price}</p>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{option.desc}</p>
                <Link href={option.href} className="text-sand text-sm font-semibold hover:underline">
                  {option.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl text-charcoal mb-4">Ready to get started?</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Browse our current stock, or get in touch and tell us what you&apos;re looking for.
            No commitment — just a chat about your van.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/browse" className="btn-primary text-base px-8 py-4">
              Browse vans →
            </Link>
            <a
              href="https://wa.me/61431770087?text=Hey%20Jared%2C%20I%27m%20interested%20in%20importing%20a%20Hiace"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-base px-8 py-4 border border-charcoal text-charcoal rounded-lg hover:bg-charcoal hover:text-white transition-colors"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
