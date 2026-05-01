import Link from 'next/link'
import Image from 'next/image'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'About Bare Camper — Australia\u2019s End-to-End Campervan Platform',
  description: 'Bare Camper is Australia\u2019s only end-to-end campervan service. From Japanese auction to Australian road, one team handles every step. Dream Drive & DIY RV Solutions.',
  url: '/about',
})

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* ─── Hero ────────────────────────────────────── */}
      <section className="bg-charcoal text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">About Bare Camper</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">One team. The whole journey.</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Bare Camper is Australia&apos;s only end-to-end campervan service. We source your van from Japan, ship it, comply it, register it, and build it out — all through one team. No middlemen, no handoffs, no surprises.
          </p>
        </div>
      </section>

      {/* ─── Lifestyle image ─────────────────────────── */}
      <div className="relative w-full h-72 md:h-96 overflow-hidden">
        <Image
          src="/images/about/beach.png"
          alt="A Hiace campervan parked on the beach — the Bare Camper dream"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* ─── How It Works ────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">How It Works</p>
            <h2 className="text-4xl text-charcoal font-bold">Four steps. One team. You&apos;re camping.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="bg-white border border-gray-200 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-ocean text-white font-bold text-sm shrink-0">
                    {i + 1}
                  </span>
                  <h3 className="text-xl text-charcoal font-bold">{step.title}</h3>
                </div>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dream Drive — Japan Infrastructure ─────── */}
      <section className="bg-cream py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">Our Japan Operations</p>
            <h2 className="text-4xl text-charcoal font-bold mb-4">Dream Drive — boots on the ground in Japan</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Dream Drive isn&apos;t a broker or a reseller — we&apos;re an import operation with real infrastructure and a full-time team in Japan. That&apos;s what makes this work.
            </p>
          </div>
          {/* Real photo of the Japan team */}
          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-12">
            <Image
              src="/images/about/team.jpg"
              alt="Dream Drive team at the Komae facility, Japan — two Hiace vans ready for export"
              fill
              className="object-cover object-center"
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {JAPAN_INFRA.map(item => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-charcoal font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-10 text-lg max-w-2xl mx-auto leading-relaxed">
            We&apos;ve been doing this since 2018 and we&apos;ve delivered over 100 vehicles to Australia. We know which vans are worth buying, which auctions to trust, and how to avoid the traps that cost first-timers thousands.
          </p>
        </div>
      </section>

      {/* ─── The Only End-to-End Service ──────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">Why It Matters</p>
          <h2 className="text-4xl text-charcoal font-bold mb-6">The only campervan brand in Japan, Australia & New Zealand</h2>
          <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
            Most people who want a campervan have to piece it together themselves — find a van from one place, ship it through another, get compliance done somewhere else, then find a builder who may or may not know the vehicle. Every handoff is a chance for things to go wrong, blow out on cost, or stall for weeks.
          </p>
          <p className="text-gray-500 text-lg leading-relaxed mb-6 max-w-3xl mx-auto">
            Bare Camper is the only campervan brand with our own people on the ground in Japan, Australia, and New Zealand. Our buyer in Japan, our workshop in Brisbane, our operations across the Tasman. One team handles every stage — from auction floor to registered campervan on an Australian road. No third-party agents, no handoffs between companies you&apos;ve never met.
          </p>
          <p className="text-gray-400 text-base leading-relaxed mb-12 max-w-2xl mx-auto">
            We run our showroom online — not from a costly shopfront. That keeps our overheads down and your prices honest. Browse vans, configure your build in 3D, and get a quote without leaving home. When your campervan&apos;s ready, pick it up from our Brisbane workshop.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {END_TO_END.map(item => (
              <div key={item.title} className="bg-charcoal text-white rounded-2xl p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The People ──────────────────────────────── */}
      <section className="bg-charcoal text-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">The Team</p>
            <h2 className="text-4xl font-bold mb-4">Two blokes. Two businesses. One platform.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="relative w-32 h-32 rounded-full overflow-hidden mb-5 border-2 border-sand">
                <Image
                  src="/images/about/jared.jpg"
                  alt="Jared Campion — Dream Drive"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-sand">Jared Campion — Dream Drive</h3>
              <p className="text-gray-300 leading-relaxed mb-3">
                Jared&apos;s been importing vehicles from Japan since 2018. His team in Tokyo sources vans from auctions and trusted dealers, and handles everything from bidding to compliance to delivery. He knows which Hiace models actually work for conversions and which ones will give you grief.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Dream Drive has a full-time buyer in Japan, established relationships with auction houses and logistics providers, and handles all export documentation, shipping, quarantine, and REGO. It&apos;s not a side hustle — it&apos;s the operation.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-sand">Andrew Taylor — DIY RV Solutions</h3>
              <p className="text-gray-300 leading-relaxed mb-3">
                Andrew runs DIY RV Solutions out of Capalaba, Brisbane — a workshop that&apos;s been building fiberglass pop tops and campervan components for over 25 years. If it goes on a Hiace, his team has built it. Pop tops, hi-tops, electrical systems, furniture — the lot.
              </p>
              <p className="text-gray-300 leading-relaxed">
                DIY RV Solutions manufactures all fiberglass in-house, runs a full electrical and carpentry workshop, and supplies DIY kits to builders around the country. They&apos;re the build side of Bare Camper.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────── */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl text-charcoal font-bold mb-4">Ready when you are.</h2>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            Browse available vans, check out our build options, or just have a yarn about what you&apos;re thinking. No commitment, no pressure.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/browse" className="btn-primary text-base px-8 py-4">Browse Vans</Link>
            <a
              href="https://wa.me/61432182892?text=Hi!%20I'm%20interested%20in%20a%20campervan%20from%20Bare%20Camper."
              className="btn-ghost text-base px-8 py-4"
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
            <br />
            Workshop: 1/10 Jones Road, Capalaba QLD 4157
          </p>
        </div>
      </section>
    </div>
  )
}

// ── Static data ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Find your van',
    desc: 'Browse quality Hiace vans from Japanese auctions or local stock. Every van is inspected and graded so you know exactly what you\u2019re getting.',
  },
  {
    title: 'We handle the hard part',
    desc: 'Import, shipping, compliance, rego. Fixed price, no surprises. We\u2019ve done this over 100 times and we know exactly how it works.',
  },
  {
    title: 'Choose your build level',
    desc: 'Bare van, roof conversion, or full turnkey. You pick where we stop. Come back for the next stage whenever you\u2019re ready — no lock-in.',
  },
  {
    title: 'Get camping',
    desc: 'Everything\u2019s lined up through one team, so you\u2019re on the road faster than doing it yourself. No chasing tradies, no waiting on parts.',
  },
]

const JAPAN_INFRA = [
  {
    icon: '\uD83C\uDDEF\uD83C\uDDF5',
    title: 'Full-time team in Japan',
    desc: 'We have a dedicated buyer based in Japan who inspects, bids, and manages logistics on the ground. Not a third-party agent — our team.',
  },
  {
    icon: '\uD83D\uDD28',
    title: 'Auction house access',
    desc: 'Direct access to Japanese vehicle auctions (USS, TAA, HAA, and more). We bid on your behalf with expert knowledge of grading, condition, and pricing.',
  },
  {
    icon: '\uD83D\uDE22',
    title: 'Established shipping lanes',
    desc: 'Long-standing relationships with RORO and container shipping providers. Vans move on regular sailings from Japan to Brisbane and Melbourne.',
  },
  {
    icon: '\uD83D\uDCCB',
    title: 'Export & compliance sorted',
    desc: 'We handle Japanese export paperwork, Australian import approvals, quarantine, compliance workshop booking, and state registration.',
  },
  {
    icon: '\uD83D\uDCB0',
    title: 'Transparent pricing',
    desc: 'Fixed-cost import packages. You see the auction price, the shipping cost, and the compliance fee upfront. No hidden margins or surprise charges.',
  },
  {
    icon: '\uD83D\uDD0D',
    title: 'Vehicle knowledge',
    desc: 'After 100+ imports, we know which Hiace models suit conversions, which grades to avoid, and what to look for in auction sheets. That experience saves you money.',
  },
]

const END_TO_END = [
  {
    icon: '\uD83D\uDD17',
    title: 'Single point of contact',
    desc: 'One team from start to finish. No juggling between importers, shippers, compliance workshops, and builders.',
  },
  {
    icon: '\u23F1\uFE0F',
    title: 'Faster turnaround',
    desc: 'Because we control every stage, your van moves through the pipeline without sitting in queues between providers.',
  },
  {
    icon: '\uD83D\uDEE1\uFE0F',
    title: 'Nothing falls through the cracks',
    desc: 'Every handoff between companies is a risk. We\u2019ve eliminated them. If something goes wrong, it\u2019s on us to fix it.',
  },
]
