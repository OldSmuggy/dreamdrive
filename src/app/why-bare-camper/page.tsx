import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Why Bare Camper — Direct Import vs Australian Dealer vs DIY',
  description: 'Compare the three ways to get a campervan in Australia: direct import through Bare Camper, buying from an Australian dealer, or going fully DIY. See the real costs and trade-offs.',
  url: '/why-bare-camper',
})

const COMPARISON_ROWS = [
  {
    feature: 'Vehicle cost (typical H200 SLWB)',
    bareCamper: '~$19,000',
    dealer: '$28,000–$38,000',
    diy: '~$19,000–$25,000',
  },
  {
    feature: 'Sourcing / agent fee',
    bareCamper: '$3,000 flat',
    dealer: 'Built into price (hidden)',
    diy: '$0 (you do it yourself)',
  },
  {
    feature: 'Shipping & customs',
    bareCamper: '~$5,000 (inc. GST)',
    dealer: 'Built into price (hidden)',
    diy: '~$5,000 (you arrange)',
  },
  {
    feature: 'Compliance',
    bareCamper: '~$1,800 (we manage)',
    dealer: 'Built into price',
    diy: '~$1,800 (you arrange)',
  },
  {
    feature: 'Total landed van cost',
    bareCamper: '~$29,000',
    dealer: '$33,000–$42,000',
    diy: '~$26,000–$32,000',
    highlight: true,
  },
  {
    feature: 'You see the auction price',
    bareCamper: '✅ Yes — full transparency',
    dealer: '❌ No — marked up',
    diy: '✅ Yes',
  },
  {
    feature: 'Auction grade & inspection',
    bareCamper: '✅ Provided',
    dealer: '⚠️ Sometimes',
    diy: '✅ If you know where to look',
  },
  {
    feature: 'Import paperwork handled',
    bareCamper: '✅ Everything',
    dealer: '✅ Everything',
    diy: '❌ You handle it all',
  },
  {
    feature: 'Compliance arranged',
    bareCamper: '✅ Managed for you',
    dealer: '✅ Managed for you',
    diy: '❌ Find your own RAWS',
  },
  {
    feature: 'Conversion available',
    bareCamper: '✅ Pop top, hi-top, TAMA, MANA',
    dealer: '❌ Rarely',
    diy: '⚠️ Source your own tradie',
  },
  {
    feature: 'Finance (van + build)',
    bareCamper: '✅ Stratton Finance partner',
    dealer: '⚠️ Sometimes',
    diy: '❌ Arrange yourself',
  },
  {
    feature: 'Conversion warranty',
    bareCamper: '✅ 12-month warranty',
    dealer: '❌ N/A',
    diy: '⚠️ Depends on tradie',
  },
  {
    feature: 'Own team in Japan',
    bareCamper: '✅ Our buyer on the ground',
    dealer: '❌ Uses third-party agents',
    diy: '❌ You hire a Japan agent',
  },
  {
    feature: 'Ongoing support',
    bareCamper: '✅ WhatsApp, email, in-person',
    dealer: '⚠️ Varies',
    diy: '❌ You\'re on your own',
  },
]

const ADVANTAGES = [
  {
    icon: '💰',
    title: 'Save $5,000–$10,000 vs dealers',
    desc: 'You pay the actual auction price plus our flat $3,000 fee — which covers both the Japan-side buyer\'s agent and the Australia-side broker. Most importers charge separately for each. No hidden dealer margins, no inflated "market price".',
  },
  {
    icon: '🔍',
    title: 'Full transparency on every van',
    desc: 'See the Japanese auction grade, interior rating, full photo set, and inspection report before we bid. You decide whether to proceed — no pressure.',
  },
  {
    icon: '🌏',
    title: 'The only campervan brand in Japan, AU & NZ',
    desc: 'We\'re the only campervan brand with our own team on the ground in Japan, Australia, and New Zealand. Our buyer in Japan, our workshop in Brisbane, our operations in NZ. Not outsourced to third-party agents — end-to-end, under one brand.',
  },
  {
    icon: '📱',
    title: 'One person, start to finish',
    desc: 'You deal with Jared from day one to handover. No call centres, no being passed between departments. WhatsApp, phone, or email — whatever works for you.',
  },
  {
    icon: '🏭',
    title: 'Professional conversion partner',
    desc: 'DIY RV Solutions in Brisbane handles all our conversions — pop tops, hi-tops, and full campervan builds. Hundreds of Hiace conversions under their belt.',
  },
  {
    icon: '🤝',
    title: 'No dealer games',
    desc: 'We don\'t buy stock to mark up. We source your specific van to order. That means you get exactly what you want, not whatever\'s sitting on a dealer\'s yard.',
  },
]

export default function WhyBareCamperPage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section style={{ backgroundColor: '#2C2C2A' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Why Bare Camper</p>
          <h1 className="text-4xl md:text-6xl leading-tight mb-6 max-w-3xl">
            The smarter way to get a campervan in Australia
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mb-10 leading-relaxed">
            We&apos;re the only campervan brand with our own team in Japan, Australia, and New Zealand —
            not brokers hiring third-party agents, but our people on the ground at every stage.
            That means transparent pricing, professional conversion, and one point of contact
            from auction floor to your driveway.
          </p>
          <Link href="/browse" className="btn-primary inline-block text-base px-8 py-4">
            Browse vans →
          </Link>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-charcoal mb-3">How do the three paths compare?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              A side-by-side look at importing through Bare Camper vs buying from an Australian
              dealer vs doing it all yourself.
            </p>
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-4 px-4 text-sm text-gray-400 font-semibold w-1/4"></th>
                  <th className="text-left py-4 px-4 bg-ocean/5 rounded-tl-xl">
                    <div className="text-ocean font-bold text-lg">Bare Camper</div>
                    <div className="text-xs text-gray-500">Direct import + conversion</div>
                  </th>
                  <th className="text-left py-4 px-4">
                    <div className="text-charcoal font-bold text-lg">AU Dealer</div>
                    <div className="text-xs text-gray-500">Buy from local stock</div>
                  </th>
                  <th className="text-left py-4 px-4">
                    <div className="text-charcoal font-bold text-lg">Full DIY</div>
                    <div className="text-xs text-gray-500">Import it yourself</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className={`border-t border-gray-100 ${row.highlight ? 'bg-cream/50' : ''}`}>
                    <td className={`py-3.5 px-4 text-sm ${row.highlight ? 'font-bold text-charcoal' : 'text-gray-600'}`}>
                      {row.feature}
                    </td>
                    <td className={`py-3.5 px-4 text-sm bg-ocean/5 ${row.highlight ? 'font-bold text-ocean text-base' : 'text-gray-700'}`}>
                      {row.bareCamper}
                    </td>
                    <td className={`py-3.5 px-4 text-sm ${row.highlight ? 'font-bold text-charcoal' : 'text-gray-700'}`}>
                      {row.dealer}
                    </td>
                    <td className={`py-3.5 px-4 text-sm ${row.highlight ? 'font-bold text-charcoal' : 'text-gray-700'}`}>
                      {row.diy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Prices based on a typical 2015 H200 SLWB Hiace at ¥2,000,000 auction price. Actual costs vary with exchange rate and vehicle.
          </p>
        </div>
      </section>

      {/* Advantages grid */}
      <section className="bg-cream py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-charcoal mb-3">What makes Bare Camper different</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We&apos;re not a dealership and we&apos;re not just a broker. We&apos;re the only
              campervan brand with our own team in Japan, Australia, and New Zealand — handling the
              entire journey from auction floor to finished campervan.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADVANTAGES.map(adv => (
              <div key={adv.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <span className="text-3xl mb-3 block">{adv.icon}</span>
                <h3 className="font-bold text-charcoal mb-2">{adv.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The team */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl text-charcoal mb-3">Two companies, one seamless experience</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-gray-100 rounded-2xl p-7">
              <p className="text-ocean text-sm font-semibold uppercase tracking-wider mb-2">Japan Import</p>
              <h3 className="text-2xl text-charcoal mb-3">Dream Drive</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Based in Japan with direct access to every major auction house and dealer network.
                Dream Drive handles sourcing, bidding, export documentation, and shipping logistics.
                Jared Campion runs the Australia-side operations and is your single point of contact
                throughout the process.
              </p>
            </div>
            <div className="border border-gray-100 rounded-2xl p-7">
              <p className="text-driftwood text-sm font-semibold uppercase tracking-wider mb-2">Campervan Conversion</p>
              <h3 className="text-2xl text-charcoal mb-3">DIY RV Solutions</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Brisbane-based campervan conversion specialists. DIY RV Solutions handles pop top
                and hi-top roof conversions, full campervan fit-outs (TAMA, MANA), electrical systems,
                and parts supply. Andrew Taylor leads the workshop with years of Hiace-specific
                conversion experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Typical savings callout */}
      <section className="bg-charcoal text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-6xl md:text-7xl text-ocean mb-4">$5,000–$10,000</p>
          <p className="text-xl md:text-2xl text-gray-300 mb-2">less than the same van from a dealer</p>
          <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
            Because you pay the actual auction price, not the price a dealer decided to mark it up to.
            Our flat $3,000 fee covers both the Japan buyer&apos;s agent and the Australian broker — the only business that handles both sides. Everything else is at-cost.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl text-charcoal mb-4">Ready to see what&apos;s available?</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Browse our live inventory of vans from Japan, or tell us what you&apos;re looking for
            and we&apos;ll source it.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/browse" className="btn-primary text-base px-8 py-4">
              Browse vans →
            </Link>
            <Link href="/how-it-works" className="inline-block text-base px-8 py-4 border border-charcoal text-charcoal rounded-lg hover:bg-charcoal hover:text-white transition-colors">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
