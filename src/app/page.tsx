export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServer } from '@/lib/supabase-server'
import { centsToAud } from '@/lib/utils'
import { getSiteSettings } from '@/lib/site-settings'
import { generateMeta } from '@/lib/seo'
import type { Metadata } from 'next'
import AuctionBanner from '@/components/ui/AuctionBanner'
import Footer from '@/components/ui/Footer'
import VehicleSelector from '@/components/ui/VehicleSelector'
import type { Listing } from '@/types'

export const metadata = generateMeta({
  title: 'Import Japanese Hiace Vans to Australia | Bare Camper',
  description: "Australia's only end-to-end Hiace import service. Source direct from Japanese auction, shipped and complied to your door, then convert it — pop top, hi-top or full turnkey. By Dream Drive & DIY RV Solutions.",
  url: '/',
})

export default async function HomePage() {
  let featuredVan: Listing | null = null

  const [{ hero_video_url, hero_video_poster }] = await Promise.all([
    getSiteSettings(),
  ])

  try {
    const supabase = createSupabaseServer()
    // Prefer featured vans, fall back to most recent with photos
    let { data } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'available')
      .eq('featured', true)
      .limit(1)
      .single()
    // If no featured van, get most recent non-auction van with photos
    if (!data) {
      const fallback = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'available')
        .neq('source', 'auction')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      data = fallback.data
    }
    if (data) featuredVan = data as Listing
  } catch {
    // Supabase unreachable — render page without listings
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://barecamper.com.au'
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['AutoDealer', 'LocalBusiness'],
        '@id': `${baseUrl}/#business`,
        name: 'Bare Camper',
        description: "Australia's only end-to-end Hiace import service. Source direct from Japanese auction, shipped and complied to your door, then convert it — pop top, hi-top or full turnkey. By Dream Drive & DIY RV Solutions.",
        url: baseUrl,
        telephone: '+61432182892',
        email: 'hello@barecamper.com.au',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '1/10 Jones Road',
          addressLocality: 'Capalaba',
          addressRegion: 'QLD',
          postalCode: '4157',
          addressCountry: 'AU',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: -27.527,
          longitude: 153.207,
        },
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '17:00',
        },
        areaServed: {
          '@type': 'Country',
          name: 'Australia',
        },
        priceRange: '$$$',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5',
          reviewCount: '6',
          bestRating: '5',
          worstRating: '5',
        },
        review: [
          { '@type': 'Review', author: { '@type': 'Person', name: 'Luke' }, reviewRating: { '@type': 'Rating', ratingValue: '5' }, reviewBody: 'I love my new home.' },
          { '@type': 'Review', author: { '@type': 'Person', name: 'Josh' }, reviewRating: { '@type': 'Rating', ratingValue: '5' }, reviewBody: 'No more rent — I happily live in my camper.' },
          { '@type': 'Review', author: { '@type': 'Person', name: 'Michael' }, reviewRating: { '@type': 'Rating', ratingValue: '5' }, reviewBody: 'This is the perfect weekender for my family.' },
          { '@type': 'Review', author: { '@type': 'Person', name: 'Kate' }, reviewRating: { '@type': 'Rating', ratingValue: '5' }, reviewBody: 'Goober van is part of the family.' },
          { '@type': 'Review', author: { '@type': 'Person', name: 'Tom' }, reviewRating: { '@type': 'Rating', ratingValue: '5' }, reviewBody: 'The perfect size for me to travel in comfort.' },
          { '@type': 'Review', author: { '@type': 'Person', name: 'Sharon' }, reviewRating: { '@type': 'Rating', ratingValue: '5' }, reviewBody: 'Could not be happier with our camper.' },
        ],
        knowsAbout: [
          'Toyota Hiace import Australia',
          'Japanese vehicle import',
          'Campervan conversion',
          'RAWS compliance',
          'Pop top conversion',
          'Hi-top conversion',
        ],
        sameAs: [
          'https://www.facebook.com/barecamper',
          'https://www.instagram.com/barecamper',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'Bare Camper',
        description: "Australia's only end-to-end Hiace import and campervan conversion service.",
        publisher: { '@id': `${baseUrl}/#business` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}/browse?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <AuctionBanner />

      {/* ─── 1. HERO — VIDEO WITH OVERLAID TEXT + ICONS ──── */}
      {/* Mobile: stacked layout. Desktop: overlaid */}
      <section className="relative w-full overflow-hidden bg-white">
        {/* Mobile tagline — above video */}
        <div className="md:hidden text-center px-4 pt-6 pb-4">
          <h1 className="text-3xl leading-tight mb-1 text-charcoal font-bold">
            Just what you need.
          </h1>
          <p className="text-sm text-gray-500">
            Auction-graded vans. Verified kms. Fixed price. Professional roof conversion. Ready for your build.
          </p>
        </div>

        {/* Video */}
        <div className="relative w-full">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-auto block"
            poster="/images/hero-poster.jpg"
          >
            <source src="/images/hero-spin.mp4" type="video/mp4" />
          </video>

          {/* Desktop tagline — overlaid on video */}
          <div className="hidden md:block absolute top-0 left-0 right-0 z-10 text-center px-4 pt-14">
            <h1 className="text-5xl lg:text-6xl leading-tight mb-2 text-charcoal font-bold">
              Just what you need.
            </h1>
            <p className="text-base text-gray-600 max-w-md mx-auto leading-relaxed">
              Auction-graded vans. Verified kms. Fixed price. Professional roof conversion. Ready for your build.
            </p>
          </div>

          {/* Desktop icons — overlaid at bottom */}
          <div className="hidden md:block absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-charcoal/90 via-charcoal/60 to-transparent pt-16 pb-4">
            <VehicleSelector />
          </div>
        </div>

        {/* Mobile icons — below video */}
        <div className="md:hidden bg-charcoal py-4">
          <VehicleSelector />
        </div>
      </section>

      {/* ─── 2. THE CONCEPT ───────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">The Bare Camper Way</p>
        <h2 className="text-4xl text-charcoal mb-6 font-bold">Start bare. Build from there.</h2>
        <div className="text-gray-500 text-lg leading-relaxed space-y-4 max-w-3xl mx-auto">
          <p>
            Most campervan companies want to sell you the whole thing — van, fit-out, the lot. But not everyone needs that. Some people just want a great van. Others want the fiberglass done right and they&apos;ll handle the rest. And yeah, some want the keys to a finished camper.
          </p>
          <p>
            Bare Camper gives you exactly what you need, and nothing you don&apos;t. No locked-in packages. No pressure to go all-in. Just a quality starting point and a team who can help at every stage — if and when you want it.
          </p>
        </div>
      </section>

      {/* ─── 3. THREE PATHS ───────────────────────────────── */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">Your Build, Your Call</p>
            <h2 className="text-4xl text-charcoal mb-3 font-bold">Pick your starting point.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {PATHS.map(path => (
              <Link
                key={path.href}
                href={path.href}
                className={`group bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col relative ${path.highlight ? 'border-ocean border-2' : 'border-gray-200'}`}
              >
                {path.highlight && (
                  <span className="absolute top-3 right-3 bg-ocean text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">Most popular</span>
                )}
                <div className="relative h-48 overflow-hidden">
                  <Image src={path.image} alt={path.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-2xl text-charcoal mb-2 font-bold">{path.name}</h3>
                  <p className="text-ocean font-semibold text-sm mb-3 italic">&ldquo;{path.tag}&rdquo;</p>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1">{path.desc}</p>
                  <p className="text-xs text-gray-400 mt-3">{path.tags}</p>
                  <span className="mt-4 text-ocean font-semibold text-sm group-hover:underline">{path.cta} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. FEATURED VAN ──────────────────────────────── */}
      {featuredVan && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl text-charcoal font-bold">Featured Van</h2>
                <p className="text-gray-500 mt-1">Hand-picked from our current stock</p>
              </div>
              <Link href="/browse" className="text-ocean font-semibold hover:underline text-sm">
                Browse all vans →
              </Link>
            </div>
            <FeaturedVanCard listing={featuredVan} />
          </div>
        </section>
      )}

      {/* ─── 5. WHO WE ARE ────────────────────────────────── */}
      <section className="bg-charcoal text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">The Team Behind It</p>
            <h2 className="text-4xl mb-4 font-bold">Two blokes. Two businesses. One platform.</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Australia has a campervan supply problem. Great vans exist — they&apos;re just in Japan. And the best fiberglass work in the country has been happening in one Brisbane factory for 25 years. Bare Camper brings both together to get more vans on the road and solve the supply issue.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 mt-12">
            <div>
              <h3 className="text-2xl font-bold mb-3 text-sand">Jared Campion — Dream Drive</h3>
              <p className="text-gray-300 leading-relaxed">
                Jared&apos;s been importing vehicles from Japan since 2018. His team in Tokyo sources vans from auctions and trusted dealers, and handles everything from bidding to compliance to delivery. He knows which Hiace models actually work for conversions and which ones will give you grief. Over 50 vans delivered.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-sand">Andrew Taylor — DIY RV Solutions</h3>
              <p className="text-gray-300 leading-relaxed">
                Andrew runs DIY RV Solutions out of Capalaba, Brisbane — a workshop that&apos;s been building fiberglass pop tops and campervan components for over 25 years. If it goes on a Hiace, his team has built it. Pop tops, hi-tops, electrical systems, furniture — the lot.
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-center mt-12 text-lg max-w-2xl mx-auto leading-relaxed">
            We built Bare Camper together so you can get the van, the fiberglass, the parts, and the know-how from one place. No middlemen. Just two teams who do this every day.
          </p>
        </div>
      </section>

      {/* ─── 6. WHY BARE CAMPER ───────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-charcoal font-bold">Just what you need. Nothing you don&apos;t.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {WHY_US.map(item => (
              <div key={item.title} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-charcoal font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. TRUST BAR ─────────────────────────────────── */}
      <section className="border-y border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {TRUST.map(t => (
              <div key={t.label}>
                <p className="text-3xl text-charcoal mb-1 font-bold">{t.value}</p>
                <p className="text-gray-500 text-sm">{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. TESTIMONIALS ──────────────────────────────── */}
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-4">Real Customers</p>
            <h2 className="text-4xl text-charcoal font-bold">What our customers say</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Luke', location: 'Brisbane, QLD', van: 'H200 SLWB', quote: 'I love my new home.' },
              { name: 'Josh', location: 'Brisbane, QLD', van: 'H200 Pop Top', quote: 'No more rent — I happily live in my camper.' },
              { name: 'Michael', location: 'QLD', van: 'H200 SLWB', quote: 'This is the perfect weekender for my family.' },
              { name: 'Kate', location: 'QLD', van: 'H200 SLWB', quote: 'Goober van is part of the family.' },
              { name: 'Tom', location: 'QLD', van: 'H200 LWB', quote: 'The perfect size for me to travel in comfort.' },
              { name: 'Sharon', location: 'QLD', van: 'H200 Pop Top', quote: 'Could not be happier with our camper.' },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-charcoal text-lg leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-semibold text-charcoal text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.van} · {t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. CTA FOOTER ────────────────────────────────── */}
      <section className="bg-charcoal text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Get Started</p>
          <h2 className="text-4xl md:text-5xl mb-4 font-bold">Ready when you are.</h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            Browse available vans, price up a build, or just have a yarn about what you&apos;re thinking. No commitment, no pressure — just what you need.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/browse" className="btn-ghost text-base px-8 py-4">Browse Vans</Link>
            <a href="https://wa.me/61432182892?text=Hi!%20I'm%20interested%20in%20a%20campervan%20from%20Bare%20Camper." className="btn-primary text-base px-8 py-4" target="_blank" rel="noopener noreferrer">Book a Free Chat</a>
          </div>
          <p className="mt-10 text-gray-400 text-sm">
            <a href="mailto:hello@barecamper.com.au" className="text-sand hover:text-sand-light">hello@barecamper.com.au</a>
            {' · '}
            <a href="tel:0432182892" className="text-sand hover:text-sand-light">0432 182 892</a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ── Featured van card (wide layout) ──────────────────────────────────────────
function FeaturedVanCard({ listing }: { listing: Listing }) {
  const photo = listing.photos[0] ?? null
  const isAuStock = listing.source === 'au_stock'
  const badge = isAuStock ? 'IN STOCK AU' : listing.source === 'auction' ? 'AUCTION' : 'DEALER'
  const badgeColor = isAuStock ? 'bg-ocean' : listing.source === 'auction' ? 'bg-amber-500' : 'bg-blue-600'

  return (
    <Link
      href={`/van/${listing.id}`}
      className="group flex flex-col md:flex-row border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative md:w-1/2 h-56 md:h-auto bg-gray-100 shrink-0">
        {photo ? (
          <Image src={photo} alt={listing.model_name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 50vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">🚐</div>
        )}
        <span className={`absolute top-3 left-3 ${badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded`}>{badge}</span>
      </div>
      <div className="p-8 flex flex-col justify-center">
        <h3 className="text-3xl text-charcoal mb-2 font-bold">{listing.model_name}</h3>
        <p className="text-gray-500 mb-4">
          {listing.model_year} · {listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km` : '—'} · {listing.drive ?? '—'}
        </p>
        <p className="text-ocean text-3xl mb-6 font-bold">
          {isAuStock && listing.au_price_aud
            ? centsToAud(listing.au_price_aud)
            : listing.aud_estimate
            ? `~${centsToAud(listing.aud_estimate)}`
            : listing.start_price_jpy
            ? `¥${listing.start_price_jpy.toLocaleString()}`
            : 'POA'}
        </p>
        <span className="btn-primary inline-block text-sm px-6 py-3 self-start">View &amp; Build →</span>
      </div>
    </Link>
  )
}

// ── Static data ───────────────────────────────────────────────────────────────
const PATHS: { image: string; tag: string; name: string; desc: string; tags: string; href: string; cta: string; highlight?: boolean }[] = [
  {
    image: '/images/diy-basevan.jpg',
    tag: 'Just the van.',
    name: 'Quality Conversion Ready Van',
    desc: "A quality Toyota Hiace imported direct from Japan, or sourced locally. We handle the auction, shipping, compliance, and rego — you get a clean van delivered to your door. Drive it as a people mover, start a slow build in the garage, or just sit on it until you're ready.",
    tags: 'From ~$25k | Japan: 6–10 weeks | Local: ready now',
    href: '/browse',
    cta: 'Browse vans',
  },
  {
    image: '/images/path-convert.jpg',
    tag: 'Just give me standing room.',
    name: 'The Van + The Roof',
    desc: "You've got the skills and the vision — you just need the fiberglass done right. We cut the roof, fit a professional pop top or hi-top, and hand it back ready for your build. No compromise on the shell. What you do inside is up to you — and if you want our DIY kits at a bundle price, they're there when you need them.",
    tags: 'From $13,090 inc GST | 10-day turnaround | Pop top or hi-top',
    href: '/pop-top',
    cta: 'See roof conversions',
    highlight: true,
  },
  {
    image: '/images/path-diy.jpg',
    tag: 'Just hand me the keys.',
    name: 'The Full Build',
    desc: "Van, roof, full interior — we do everything. Choose from our TAMA (family), MANA (couples), or a custom spec. Every build includes fiberglass roof work, furniture, electrical, plumbing, and a quality check before handover.",
    tags: 'From ~$71k all-in | Van + import + full conversion',
    href: '/tama',
    cta: 'See fit-outs',
  },
]

const TRUST = [
  { value: '100+',   label: 'Vans delivered' },
  { value: '25+',    label: 'Years of fiberglass' },
  { value: '$3,000', label: 'Refundable hold' },
  { value: '100%',   label: 'Aus compliant' },
]

const WHY_US = [
  { icon: '🔓', title: 'No lock-in', desc: "Buy just the van. Add the roof next month. Fit it out next year. Or get everything now. Your timeline, your call." },
  { icon: '🇯🇵', title: 'Direct from Japan', desc: "Vans sourced from Japanese auctions and dealers. No mystery pricing, no middlemen. You see what's available and what it costs." },
  { icon: '🏭', title: '25 years of fiberglass', desc: "Our Brisbane factory has been manufacturing pop tops since before van life was a hashtag. This is what we do." },
  { icon: '🤝', title: 'Real people', desc: "You're dealing with Jared and Andrew — not a call centre. The same people who import the vans and build the roofs are the ones answering your questions." },
]
