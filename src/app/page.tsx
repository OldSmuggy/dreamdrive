import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { centsToAud } from '@/lib/utils'
import { getSiteSettings } from '@/lib/site-settings'
import AuctionBanner from '@/components/ui/AuctionBanner'
import type { Listing } from '@/types'

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

  return (
    <div className="min-h-screen">
      <AuctionBanner />

      {/* ─── 1. HERO ─────────────────────────────────────── */}
      <section className="relative bg-charcoal text-white overflow-hidden">
        {hero_video_url ? (
          <>
            <video
              autoPlay muted loop playsInline
              poster={hero_video_poster || undefined}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
            >
              <source src={hero_video_url} type="video/mp4" />
            </video>
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1 }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'url(/hero-van.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal" />
          </>
        )}

        <div className="relative max-w-6xl mx-auto px-4 py-28 md:py-40" style={{ zIndex: 2 }}>
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Bare Camper</p>
          <h1
            className="text-5xl md:text-7xl leading-tight mb-6 text-white font-bold"
            style={hero_video_url ? { textShadow: '0 1px 3px rgba(0,0,0,0.5)' } : undefined}
          >
            Find it.<br />Build it.<br />Drive it.
          </h1>
          <p
            className={`text-lg md:text-xl max-w-xl mb-10 leading-relaxed ${hero_video_url ? '' : 'text-gray-300'}`}
            style={hero_video_url ? { color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' } : undefined}
          >
            Source a Toyota Hiace direct from Japan, then build your dream conversion
            with Australia&apos;s most complete van fit-out range.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/browse" className="btn-ghost text-base px-8 py-4">
              Browse Vans
            </Link>
            <Link href="/build" className="btn-primary text-base px-8 py-4">
              Build My Van
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 2. THREE PATHS ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-charcoal mb-3 font-bold">Three ways to van life</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Whether you want a turn-key camper, a premium fit-out on your own van, or a DIY project — we&apos;ve got the path for you.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {PATHS.map(path => (
            <Link
              key={path.href}
              href={path.href}
              className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              {/* Gray placeholder image box */}
              <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400 text-5xl">
                {path.icon}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">{path.tag}</span>
                <h3 className="text-2xl text-charcoal mb-2 font-bold">{path.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1">{path.desc}</p>
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

      {/* ─── 4. PRODUCT SHOWCASE ──────────────────────────── */}
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

      {/* ─── 5. HOW IT WORKS ──────────────────────────────── */}
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

      {/* ─── 6. TRUST BAR ─────────────────────────────────── */}
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

      {/* ─── 7. CTA FOOTER ────────────────────────────────── */}
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
            <a href="mailto:jared@dreamdrive.life" className="text-sand hover:text-sand-light">jared@dreamdrive.life</a>
            {' · '}
            <a href="tel:0432182892" className="text-sand hover:text-sand-light">0432 182 892</a>
          </p>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-gray-400 text-xs">
        <p>Bare Camper (AU) &middot; DIY RV Solutions (AU) &middot; Japan Import Service</p>
      </footer>
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.model_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
const PATHS = [
  {
    icon: '🚐',
    tag: 'Full build',
    name: 'Complete Campervan',
    desc: 'We source the van from Japan, handle compliance and shipping, and install your chosen fit-out. Drive away in a finished camper.',
    href: '/build',
    cta: 'Build mine',
  },
  {
    icon: '🪑',
    tag: 'Fit-out only',
    name: 'Fit-Out My Own Van',
    desc: 'Already have a Hiace? Choose a TAMA or MANA fit-out, pop top, or electrical system and we install it at our workshop.',
    href: '/tama',
    cta: 'See fit-outs',
  },
  {
    icon: '⚡',
    tag: 'DIY',
    name: 'DIY Kits',
    desc: 'Modular electrical kits, grid bed frames, and accessory bundles. Build at your own pace with our step-by-step guides.',
    href: '/diy',
    cta: 'Shop kits',
  },
]

const PRODUCTS = [
  { slug: 'tama',   icon: '🪑', name: 'TAMA',        desc: '6-seater family conversion. Rear seat folds to bed, galley kitchen, sink & fridge.',       href: '/tama' },
  { slug: 'mana',   icon: '🏕️', name: 'MANA',        desc: 'Liveable 2-person campervan. Full standing room, toilet, 55L water, 200AH lithium.',        href: '/mana' },
  { slug: 'poptop', icon: '🏠', name: 'Pop Top Roof', desc: 'Fiberglass pop top. Adds 600mm height, park anywhere when lowered. $11,900 ex GST.',        href: '/pop-top' },
  { slug: 'elec',   icon: '⚡', name: 'DIY Kits',     desc: 'Electrical kits, bed frames, accessories. Starter to Off-Grid Pro. Build at your pace.',    href: '/diy' },
]

const STEPS = [
  { title: 'Choose Your Van',     desc: 'Browse Japan auction listings updated every Monday, Japanese dealer buy-now vans, or our AU stock.' },
  { title: 'Build Your Config',   desc: 'Add a TAMA or MANA fit-out, pop top, electrical system. See your total price instantly.' },
  { title: 'Hold with $500',      desc: 'Place a refundable deposit hold. We bid Thursday, confirm by Friday.' },
  { title: 'Drive Away',          desc: `We handle import, compliance, shipping. Pop top and fit-out booked in parallel so you're on the road faster.` },
]

const TRUST = [
  { value: '50+',    label: 'Vans imported' },
  { value: '3',      label: 'Fit-out models' },
  { value: '$500',   label: 'Refundable hold' },
  { value: '100%',   label: 'Aus compliance' },
]
