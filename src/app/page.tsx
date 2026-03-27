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
  title: 'Bare Camper — Just What You Need | Toyota Hiace Campervans',
  description: "A quality Hiace from Japan. Professional fiberglass when you're ready. A full build if you want it. Nothing you don't. Australia's campervan platform by Dream Drive & DIY RV Solutions.",
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
    '@type': 'AutoDealer',
    name: 'Bare Camper',
    description: "Australia's campervan platform. Source your Hiace from Japan, get professional fiberglass, or go full turnkey. By Dream Drive & DIY RV Solutions.",
    url: baseUrl,
    telephone: '0432182892',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1/10 Jones Road',
      addressLocality: 'Capalaba',
      addressRegion: 'QLD',
      postalCode: '4157',
      addressCountry: 'AU',
    },
    openingHours: 'Mo-Fr 10:00-16:00',
    priceRange: '$$',
  }

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <AuctionBanner />

      {/* ─── 1. HERO — FULL-WIDTH VIDEO + BLACK TEXT ─────── */}
      <section className="relative bg-cream overflow-visible">
        {/* Tagline */}
        <div className="text-center px-4 pt-8 md:pt-12 mb-4 md:mb-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl leading-tight mb-3 text-charcoal font-bold">
            Just what you need.
          </h1>
          <p className="text-base md:text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
            Toyota Hiace campervans — sourced from Japan, built in Brisbane.
          </p>
        </div>

        {/* Full-width video */}
        <div className="w-full overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-auto"
            poster="/images/og-image.jpg"
          >
            <source src="/images/hero-spin.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Vehicle selector below video */}
        <div className="relative z-20 bg-charcoal py-6">
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

      {/* ─── 8. CTA FOOTER ────────────────────────────────── */}
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
    image: '/images/path-source.jpg',
    tag: 'Just the van.',
    name: 'The Van',
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
