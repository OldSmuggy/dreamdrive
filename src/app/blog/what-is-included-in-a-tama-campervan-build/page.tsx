import Link from 'next/link'
import { generateMeta } from '@/lib/seo'
import BlogArticleJsonLd from '@/components/BlogArticleJsonLd'
import RelatedPosts from '@/components/RelatedPosts'

export const metadata = generateMeta({
  title: 'What\'s Included in a TAMA Campervan Build — Full Spec Breakdown',
  description: 'Complete breakdown of the Bare Camper TAMA conversion for Toyota Hiace. 6-seat family campervan with ISOFIX, galley kitchen, walnut countertops, full electrical, and more.',
  url: '/blog/what-is-included-in-a-tama-campervan-build',
})

const SPEC_SECTIONS = [
  {
    title: '🪑 Seating & Safety',
    items: [
      '6-seat people mover configuration — 2 front + 4 rear',
      'ISOFIX anchor points for child seats (rear row)',
      'ADR-compliant seatbelts for all positions',
      'Full engineering certification for seating layout',
      'Seats fold/remove for cargo mode when needed',
    ],
  },
  {
    title: '🍳 Kitchen & Cooking',
    items: [
      'Galley kitchen with solid walnut countertops',
      'Stainless steel sink with electric pump tap',
      '2-burner gas cooktop (certified LPG install)',
      'Slide-out gas bottle with regulator',
      'Overhead storage cabinets',
      'Under-bench storage and pantry space',
      'Splashback and finishing trim throughout',
    ],
  },
  {
    title: '💤 Sleeping',
    items: [
      'Rear double bed platform (sleeps 2 adults comfortably)',
      'High-density foam mattress with removable cover',
      'Pop top bed (sleeps 2 more — great for kids)',
      'Total sleeping capacity: 4 people',
      'Under-bed storage accessible from rear barn doors',
    ],
  },
  {
    title: '⚡ Electrical System',
    items: [
      '200Ah lithium battery bank (LiFePO4)',
      '2000W pure sine wave inverter (runs anything)',
      'DC-DC charger (charges while driving)',
      '240V shore power inlet with charger',
      'Solar-ready wiring (panel mounting on request)',
      'LED interior lighting throughout',
      'USB-A and USB-C charging points at bed and kitchen',
      '12V outlets for accessories',
      'Battery monitor with state-of-charge display',
    ],
  },
  {
    title: '💧 Water System',
    items: [
      '60L fresh water tank (under floor)',
      'Electric pump tap at kitchen sink',
      'Grey water collection',
      'Easy-fill external water inlet',
    ],
  },
  {
    title: '🏗️ Roof & Structure',
    items: [
      'Pop top roof conversion (fibreglass, gas strut assisted)',
      'Canvas sides with zip-out windows and insect mesh',
      'Interior headliner and trim',
      'LED lighting in pop top area',
      'Full standing room when popped (~1.9m internal)',
    ],
  },
  {
    title: '🎨 Fit & Finish',
    items: [
      'Walnut timber countertops and trim throughout',
      'Marine-grade vinyl upholstery',
      'Insulation — walls, ceiling, and floor',
      'Vinyl plank flooring (waterproof, durable)',
      'Curtains / window covers for privacy',
      'Finished cabinetry — no exposed screws or raw edges',
    ],
  },
]

export default function TamaBuildPost() {
  return (
    <div className="min-h-screen bg-cream">
      <BlogArticleJsonLd title="What's Included in a TAMA Campervan Build — Full Spec Breakdown" description="Complete breakdown of the Bare Camper TAMA conversion for Toyota Hiace." slug="what-is-included-in-a-tama-campervan-build" datePublished="2026-03-28" category="Build Guide" />
      <article className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-ocean bg-ocean/10 px-2.5 py-1 rounded-full">Build Guide</span>
            <span className="text-xs text-gray-400">28 March 2026</span>
            <span className="text-xs text-gray-400">8 min read</span>
          </div>
          <h1 className="text-3xl md:text-4xl text-charcoal leading-snug mb-4">
            What&apos;s Included in a TAMA Campervan Build — Full Spec Breakdown
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            The TAMA is Bare Camper&apos;s flagship family build — a 6-seat Toyota Hiace
            campervan with everything you need for weekends away or extended road trips.
            Here&apos;s exactly what&apos;s included.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">

          {/* Quick overview card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 mb-8 not-prose">
            <h2 className="text-xl font-bold text-charcoal mb-4">TAMA at a glance</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { value: '6 seats', label: 'with ISOFIX' },
                { value: '4 sleeps', label: 'double + pop top' },
                { value: '200Ah', label: 'lithium battery' },
                { value: 'From $106k', label: 'van + build' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-ocean">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-charcoal">Who is the TAMA for?</h2>
          <p className="text-gray-600 leading-relaxed">
            The TAMA was designed for families and groups who need a vehicle that works double duty —
            a comfortable people mover during the week, and a fully self-contained campervan on
            weekends and holidays. Six seats means you can take the whole family (including kids
            in ISOFIX car seats), and the pop top gives you sleeping room for four.
          </p>
          <p className="text-gray-600 leading-relaxed">
            It&apos;s also a solid choice for couples who want the extra seating for friends, or
            anyone who needs their van to function as a daily driver and a camper. The rear seats
            can be removed when you want maximum cargo space.
          </p>

          <h2 className="text-2xl font-bold text-charcoal">TAMA vs MANA — what&apos;s the difference?</h2>
          <p className="text-gray-600 leading-relaxed">
            The TAMA is the <strong>family build</strong> — 6 seats, ISOFIX, walnut kitchen, and
            a layout designed around people-moving and weekend camping. The MANA is the{' '}
            <strong>adventure build</strong> — 2 seats, bigger fridge (75L), built-in toilet,
            external shower, and a layout optimised for extended off-grid living as a couple.
          </p>
          <p className="text-gray-600 leading-relaxed">
            If you need to carry more than 2 people regularly → TAMA. If you&apos;re building
            for long-term travel as a couple and want maximum off-grid capability → MANA.
          </p>

          <h2 className="text-2xl font-bold text-charcoal">Full specification breakdown</h2>
          <p className="text-gray-600 leading-relaxed">
            Here&apos;s everything that&apos;s included in a standard TAMA build. All items
            are fitted and tested before handover — you drive away with a finished, ready-to-camp van.
          </p>

          {/* Spec sections */}
          <div className="space-y-6 my-8 not-prose">
            {SPEC_SECTIONS.map(section => (
              <div key={section.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-charcoal mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="text-ocean mt-px shrink-0 font-bold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-charcoal">What&apos;s the base van?</h2>
          <p className="text-gray-600 leading-relaxed">
            The TAMA is built on a Toyota Hiace H200 SLWB (Super Long Wheelbase). We import
            these direct from Japan — typically a 2012–2018 model with the 2.7L petrol (2TR-FE)
            or 3.0L turbo diesel (1KD-FTV) engine. Diesel is the more popular choice for the
            better fuel economy and torque.
          </p>
          <p className="text-gray-600 leading-relaxed">
            The SLWB gives you the maximum interior space — roughly 3.3m from bulkhead to rear
            doors. This is what allows us to fit 6 seats AND a full kitchen AND a double bed
            without it feeling cramped.
          </p>

          <h2 className="text-2xl font-bold text-charcoal">How much does it cost?</h2>
          <p className="text-gray-600 leading-relaxed">
            The total price for a TAMA depends on the base van you choose. As a guide:
          </p>
          <div className="bg-cream/70 rounded-xl p-5 my-6 not-prose">
            <div className="space-y-2 text-sm">
              {[
                { label: 'Typical H200 SLWB van (imported & complied)', value: '~$29,000' },
                { label: 'TAMA conversion', value: '~$77,000' },
                { label: 'Total drive-away', value: '~$106,000' },
              ].map(row => (
                <div key={row.label} className={`flex justify-between py-1.5 ${row.label.includes('Total') ? 'border-t-2 border-ocean/20 pt-3 mt-2' : ''}`}>
                  <span className={`text-gray-600 ${row.label.includes('Total') ? 'font-bold text-charcoal' : ''}`}>{row.label}</span>
                  <span className={`font-semibold ${row.label.includes('Total') ? 'text-ocean text-base' : 'text-charcoal'}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Prices are indicative and depend on the specific van, exchange rate, and any custom options.
              Finance available through Stratton Finance — van + conversion in one loan.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-charcoal">Build timeline</h2>
          <p className="text-gray-600 leading-relaxed">
            From the moment your complied van arrives at the DIY RV Solutions workshop in Brisbane,
            a TAMA conversion takes <strong>8–12 weeks</strong>. You&apos;ll get photo updates
            throughout the build, and you&apos;re welcome to visit the workshop to check on progress.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Total timeline from choosing your van in Japan to driving away in a finished TAMA:
            approximately <strong>18–26 weeks</strong> (10–14 weeks import + 8–12 weeks build).
          </p>

          <h2 className="text-2xl font-bold text-charcoal">Warranty</h2>
          <p className="text-gray-600 leading-relaxed">
            Every TAMA build comes with a <strong>12-month warranty</strong> on the conversion —
            covering the fit-out, electrical system, plumbing, gas installation, and pop top roof.
            The compliance work on the base van carries a 1-month warranty. And because DIY RV
            Solutions is right here in Brisbane, warranty claims are handled in-house with fast
            turnaround.
          </p>

          {/* CTA */}
          <div className="bg-charcoal rounded-2xl p-6 md:p-8 text-white mt-10 not-prose">
            <h3 className="text-xl font-bold mb-2">Want to build a TAMA?</h3>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              Check out the full TAMA product page, or browse our current van stock to find your base vehicle.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/tama" className="btn-primary text-sm px-6 py-3">
                See the TAMA →
              </Link>
              <Link href="/browse" className="text-sm px-6 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
                Browse vans
              </Link>
              <Link href="/finance" className="text-sm px-6 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
                Finance options
              </Link>
            </div>
          </div>
        </div>

        <RelatedPosts currentSlug="what-is-included-in-a-tama-campervan-build" />

        {/* Back to blog */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link href="/blog" className="text-ocean text-sm font-semibold hover:underline">
            ← Back to all guides
          </Link>
        </div>
      </article>
    </div>
  )
}
