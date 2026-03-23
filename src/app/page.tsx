import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServer } from '@/lib/supabase-server'
import { centsToAud } from '@/lib/utils'
import { getSiteSettings } from '@/lib/site-settings'
import { generateMeta } from '@/lib/seo'
import type { Metadata } from 'next'
import AuctionBanner from '@/components/ui/AuctionBanner'
import Footer from '@/components/ui/Footer'
import type { Listing } from '@/types'

export const metadata = generateMeta({
  title: 'Toyota Hiace Campervans from $70k | Find it. Build it. Drive it.',
  description: "Australia's complete Toyota Hiace campervan platform. Source from Japan or convert your own. Pop tops, TAMA & MANA fitouts, DIY kits. Brisbane workshop. From $70k delivered.",
  url: '/',
})

export default async function HomePage() {
  let featuredVan: Listing | null = null

  const [{ hero_video_url, hero_video_poster }] = await Promise.all([
    getSiteSettings(),
  ])

  try {
    const supabase = createSupabaseServer()
    // Pick one AU-stock or most-recent available van as the featured card
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (data) featuredVan = data as Listing
  } catch {
    // Supabase unreachable — render page without listings
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://barecamper.com'
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Bare Camper',
    description: "Australia's complete Toyota Hiace campervan platform. Source from Japan or convert your own.",
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

      {/* ─── 1. HERO ─────────────────────────────────────── */}
      <section className="relative bg-charcoal text-white overflow-hidden">
        <Image
          src="/images/og-image.jpg"
          alt="Bare Camper — Toyota Hiace campervans"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal/80" />

        <div className="relative max-w-6xl mx-auto px-4 py-28 md:py-40 z-10">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Bare Camper</p>
          <h1 className="text-5xl md:text-7xl leading-tight mb-6 text-white font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            Find it.<br />Build it.<br />Drive it.
          </h1>
          <p className="text-lg md:text-xl max-w-xl mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            Australia&apos;s complete Toyota Hiace campervan platform. Source your van from Japan or convert one here — we handle everything from auction to driveway.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/browse" className="btn-ghost text-base px-8 py-4">Browse Vans</Link>
            <a href="https://wa.me/61432182892?text=Hi!%20I'm%20interested%20in%20a%20campervan%20from%20Bare%20Camper." className="btn-primary text-base px-8 py-4" target="_blank" rel="noopener noreferrer">Talk to Us → WhatsApp</a>
          </div>
        </div>
      </section>

      {/* ─── 2. THREE PATHS ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-charcoal mb-3 font-bold">Three paths to your campervan</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {PATHS.map(path => (
            <Link
              key={path.href}
              href={path.href}
              className={`group border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col relative ${path.highlight ? 'border-ocean border-2' : 'border-gray-200'}`}
            >
              {path.highlight && (
                <span className="absolute top-3 right-3 bg-ocean text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">Most popular</span>
              )}
              <div className="relative h-48 overflow-hidden">
                <Image src={path.image} alt={path.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">{path.tag}</span>
                <h3 className="text-2xl text-charcoal mb-2 font-bold">{path.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1">{path.desc}</p>
                <p className="text-xs text-gray-400 mt-3">{path.tags}</p>
                <span className="mt-4 text-ocean font-semibold text-sm group-hover:underline">{path.cta} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 3. FEATURED VAN ──────────────────────────────── */}
      {featuredVan && (
        <section className="bg-cream py-16">
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

      {/* ─── PACKAGE EXAMPLES ───────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-charcoal mb-3 font-bold">Ready-to-go packages</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {PACKAGES.map(pkg => (
            <div key={pkg.name} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48">
                <Image src={pkg.image} alt={pkg.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className="p-6">
                <h3 className="text-xl text-charcoal mb-2 font-bold">{pkg.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{pkg.desc}</p>
                <p className="text-ocean text-2xl font-bold">{pkg.price}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-xs mt-8 max-w-2xl mx-auto">
          Prices are estimates based on recent builds and current exchange rates. Your final price depends on the specific van, configuration, and options. No surprises — we confirm your total before you commit.
        </p>
      </section>

      {/* ─── 5. PRODUCT SHOWCASE ──────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-charcoal mb-3 font-bold">Build Yours, Your Way</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Every product in our range. Mix and match to your budget and adventure style.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map(p => (
            <div key={p.slug} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="text-3xl mb-3">{p.icon}</div>
              <h3 className="text-xl mb-2 font-bold">{p.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">{p.desc}</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href={p.href} className="text-ocean font-semibold text-sm hover:underline">
                  More details →
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/build" className="btn-primary inline-block text-base px-10 py-4">
            Start Your Build →
          </Link>
        </div>
      </section>

      {/* ─── 6. HOW IT WORKS ──────────────────────────────── */}
      <section className="bg-charcoal text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl text-center mb-12 font-bold">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={i}>
                <div className="text-sand text-5xl mb-4 font-bold">{i + 1}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY BARE CAMPER ───────────────────────────── */}
      <section className="bg-cream py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl text-charcoal text-center mb-12 font-bold">Why Bare Camper</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_US.map(item => (
              <div key={item.title} className="flex gap-4">
                <span className="text-ocean text-xl mt-0.5 shrink-0">✓</span>
                <div>
                  <h3 className="text-charcoal font-bold mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-4xl text-charcoal mb-8 font-bold">The team behind Bare Camper</h2>
        <div className="prose prose-lg max-w-3xl text-gray-500 leading-relaxed space-y-4">
          <p>
            We&apos;ve been building campervans on Toyota Hiace platforms for over a decade, working across Japan and Australia. What started as a passion for Japanese vehicles and van life grew into Bare Camper — a team that&apos;s now delivered 50+ campervans to customers across the country.
          </p>
          <p>
            Our team in Tokyo hand-builds every TAMA and MANA fitout at our dedicated conversion facility, using top-quality materials and Japanese craftsmanship. In Brisbane, our workshop at Capalaba handles pop top roof conversions, local builds, and vehicle preparation.
          </p>
          <p>
            We built Bare Camper because we kept seeing people make expensive mistakes — buying the wrong base vehicle, getting stuck in compliance nightmares, or paying too much for a conversion that didn&apos;t suit their needs. This platform gives you a place to see exactly what&apos;s available, configure what you want, know what it costs, and trust that a team who&apos;s done this hundreds of times is handling every detail.
          </p>
          <p>
            Whether you want a bare van to convert yourself, a full turnkey campervan, or just a pop top on the Hiace you already own — we&apos;re here to help you build it.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-6 text-sm">
          <a href="tel:0432182892" className="text-ocean font-semibold hover:underline">0432 182 892</a>
          <a href="mailto:hello@barecamper.com" className="text-ocean font-semibold hover:underline">hello@barecamper.com</a>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="relative h-48 rounded-xl overflow-hidden">
            <Image src="/images/about-delivery.jpg" alt="Van delivery" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          </div>
          <div className="relative h-48 rounded-xl overflow-hidden">
            <Image src="/images/about-japan-workshop.jpg" alt="Japan workshop" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          </div>
          <div className="relative h-48 rounded-xl overflow-hidden">
            <Image src="/images/about-brisbane.jpg" alt="Brisbane pop top facility" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─────────────────────────────────── */}
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

      {/* ─── CTA FOOTER ────────────────────────────────── */}
      <section className="bg-charcoal text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl mb-4 font-bold">Ready to start?</h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            Browse available vans, build your dream configuration, or talk to us directly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/browse" className="btn-ghost text-base px-8 py-4">Browse Vans</Link>
            <Link href="/build" className="btn-primary text-base px-8 py-4">Build My Van</Link>
          </div>
          <p className="mt-10 text-gray-400 text-sm">
            Questions?{' '}
            <a href="mailto:hello@barecamper.com" className="text-sand hover:text-sand-light">hello@barecamper.com</a>
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
    tag: 'I need a vehicle',
    name: 'Source your van',
    desc: "Browse 20+ Toyota Hiace vans from Japanese auctions and dealers, or let us find one locally through our Australian network. Our team knows which models, specs, and seat configurations actually work for conversions — and which ones will cause you headaches. We handle import, compliance, and shipping.",
    tags: 'From ~$25k base vehicle | Japan: 6–10 weeks | Local: ready now',
    href: '/browse',
    cta: 'Browse stock',
  },
  {
    image: '/images/path-convert.jpg',
    tag: 'I already have a van',
    name: 'Convert your van',
    desc: "Bring your Hiace — H200 or 300 Series — to our Brisbane workshop. Pop top roof conversion, TAMA family fitout, MANA couples fitout, or all of the above. Our team will assess your vehicle first and tell you honestly what's possible.",
    tags: 'Pop top from $11,900 inc GST | 10-day turnaround',
    href: '/tama',
    cta: 'See conversion options',
    highlight: true,
  },
  {
    image: '/images/path-diy.jpg',
    tag: 'I want to DIY',
    name: 'Parts & kits',
    desc: "Pop top conversions, modular bed kits, standalone electrical cabinets, and parts sourced from Japan. We do the hard stuff — you make it yours. Expert support so you don't learn the hard lessons the expensive way.",
    tags: 'Kits from $2,000 | Step-by-step guides',
    href: '/diy',
    cta: 'Shop kits',
  },
]

const PACKAGES = [
  {
    name: 'The Weekender',
    desc: '2019 Hiace 2WD + TAMA family fitout. Weekend trips and school holidays sorted. 6 seats by day, full camper by night.',
    price: 'From ~$88,000',
    image: '/images/package-weekender.jpg',
  },
  {
    name: 'The Explorer',
    desc: '2020 Hiace 4WD + MANA fitout + pop top. Full standing room, toilet, 200AH lithium. Go anywhere, stay anywhere.',
    price: 'From ~$95,000',
    image: '/images/package-explorer.jpg',
  },
  {
    name: 'The Off-Grid Pro',
    desc: '2022 Hiace 4WD + MANA fitout + solar + hot water + FF heater. The ultimate self-contained tourer.',
    price: 'From ~$105,000',
    image: '/images/package-offgrid.jpg',
  },
]

const PRODUCTS = [
  { slug: 'tama', icon: '🪑', name: 'TAMA', desc: '6-seat family conversion. Rear seat folds to bed, galley kitchen, sink & fridge. Fits Japan-import H200 or Australian 300 Series. From $45,600 conversion', href: '/tama' },
  { slug: 'mana', icon: '🏕️', name: 'MANA', desc: 'Liveable 2-person campervan. Full standing room, toilet, 55L water, 200AH lithium. Pop top included. Built in Japan or Brisbane. From $42,800 conversion (Japan) | $45,000 (Brisbane)', href: '/mana' },
  { slug: 'poptop', icon: '🏠', name: 'Pop Top Roof', desc: 'Fibreglass pop top roof. Adds 600mm standing height. Park anywhere when lowered. Fits H200 and 300 Series Hiace. $13,090 inc GST | 10-day turnaround at our Brisbane factory', href: '/pop-top' },
  { slug: 'diy', icon: '⚡', name: 'DIY Kits', desc: 'Electrical kits, modular bed frames, parts from Japan. Build at your pace with expert support. From $2,000', href: '/diy' },
]

const STEPS = [
  { title: 'Find It', desc: 'Pick from 20+ Hiace vans updated weekly — Japan auction, Japan dealer, or ready-now Brisbane stock. Or bring your own.' },
  { title: 'Build It', desc: 'Add a fitout, pop top, options. See your total price instantly. No surprises, no hidden fees.' },
  { title: 'Hold for $3,000', desc: 'Fully refundable. We bid at auction Thursday, confirm Friday. Zero risk to you.' },
  { title: 'Drive It', desc: "We handle import (6–10 weeks), compliance, conversion, and delivery. Pop top and fitout run in parallel so you're on the road faster. Converting in Japan? Allow extra time for the build." },
]

const TRUST = [
  { value: '100+',   label: 'Vans delivered' },
  { value: '3',      label: 'Fit-out models' },
  { value: '$3,000', label: 'Refundable hold' },
  { value: '100%',   label: 'Aus compliance' },
]

const WHY_US = [
  { title: 'Save money', desc: 'vs factory-built campervans — same quality, Toyota reliability, fraction of the price.' },
  { title: 'Built on Toyota Hiace', desc: 'Parts at any dealer, serviced anywhere in Australia.' },
  { title: 'One team, start to finish', desc: 'No juggling importers, converters, and compliance shops.' },
  { title: '100+ vans delivered', desc: 'The Bare Camper team has been building campervans between Japan and Australia for over a decade.' },
  { title: 'We find the RIGHT vehicle', desc: "Don't waste money on a Hiace that won't convert properly." },
  { title: '100% Australian compliant', desc: 'Fully registered and road-legal on delivery.' },
]
