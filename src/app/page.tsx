import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { centsToAud } from '@/lib/utils'
import AuctionBanner from '@/components/ui/AuctionBanner'
import type { Listing } from '@/types'

export default async function HomePage() {
  let featuredVans: Listing[] = []
  let auctionVans: Listing[] = []

  try {
    const supabase = createSupabaseServer()

    const [{ data: featured }, { data: latest }] = await Promise.all([
      supabase
        .from('listings')
        .select('*')
        .eq('source', 'au_stock')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('listings')
        .select('*')
        .eq('source', 'auction')
        .eq('status', 'available')
        .order('auction_date', { ascending: true })
        .limit(6),
    ])

    featuredVans = (featured ?? []) as Listing[]
    auctionVans  = (latest  ?? []) as Listing[]
  } catch {
    // Supabase unreachable — render page without listings
  }

  return (
    <div className="min-h-screen">
      <AuctionBanner />

      {/* ---- Hero ---- */}
      <section className="relative bg-forest-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url(/hero-van.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/60 via-forest-950/40 to-forest-950" />

        <div className="relative max-w-6xl mx-auto px-4 py-28 md:py-40">
          <p className="text-sand-400 text-sm font-semibold tracking-widest uppercase mb-4">Dream Drive Van Builder</p>
          <h1 className="font-display text-5xl md:text-7xl leading-tight mb-6">
            Find it.<br />Build it.<br />Drive it.
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
            Source a Toyota Hiace H200 direct from Japan, then build your dream conversion
            with Australia's most complete van fit-out range.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/browse" className="btn-primary text-base px-8 py-4">
              Browse Vans
            </Link>
            <Link href="/build" className="btn-secondary text-base px-8 py-4 border-white/30 text-white hover:bg-white/10 hover:border-white/50">
              Build My Van
            </Link>
          </div>
        </div>
      </section>

      {/* ---- AU Stock (featured) ---- */}
      {featuredVans.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl text-forest-900">Available Now in Australia</h2>
              <p className="text-gray-500 mt-1">Import approved, ready to reserve</p>
            </div>
            <Link href="/browse?source=au_stock" className="text-forest-600 font-semibold hover:underline text-sm">
              View all →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVans.map(van => (
              <VanCard key={van.id} listing={van} />
            ))}
          </div>
        </section>
      )}

      {/* ---- Japan Auction ---- */}
      {auctionVans.length > 0 && (
        <section className="bg-sand-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl text-forest-900">This Week's Japan Auction</h2>
                <p className="text-gray-500 mt-1">Bid every Thursday — best prices direct from Japan</p>
              </div>
              <Link href="/browse?source=auction" className="text-forest-600 font-semibold hover:underline text-sm">
                View all {auctionVans.length}+ →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctionVans.slice(0, 6).map(van => (
                <VanCard key={van.id} listing={van} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---- Products ---- */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl text-forest-900 mb-3">Build Yours, Your Way</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Every product Dream Drive sells. Mix and match to your budget and adventure style.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map(p => (
            <div key={p.slug} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="text-3xl mb-3">{p.icon}</div>
              <h3 className="font-display text-xl mb-2">{p.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">{p.desc}</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href={p.href} className="text-forest-600 font-semibold text-sm hover:underline">
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

      {/* ---- How it works ---- */}
      <section className="bg-forest-950 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-4xl text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={i}>
                <div className="text-sand-400 font-display text-5xl mb-4">{i + 1}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        <p>Dream Drive (AU) • DIY RV Solutions (AU) • Japan Import Service</p>
        <p className="mt-1">
          <a href="mailto:jared@dreamdrive.life" className="hover:text-forest-600">jared@dreamdrive.life</a>
          {' · '}
          <a href="tel:0432182892" className="hover:text-forest-600">0432 182 892</a>
        </p>
      </footer>
    </div>
  )
}

// ---- Small van card ----
function VanCard({ listing }: { listing: Listing }) {
  const photo = listing.photos[0] ?? null
  const isAuStock = listing.source === 'au_stock'
  const badge = isAuStock ? 'IN STOCK AU' : listing.source === 'auction' ? 'AUCTION' : 'DEALER'
  const badgeColor = isAuStock ? 'bg-forest-600' : listing.source === 'auction' ? 'bg-amber-500' : 'bg-blue-600'

  return (
    <Link href={`/van/${listing.id}`} className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gray-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.model_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🚐</div>
        )}
        <span className={`absolute top-3 left-3 ${badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded`}>{badge}</span>
      </div>
      <div className="p-4">
        <p className="font-semibold text-sm text-gray-900 truncate">{listing.model_name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {listing.model_year} · {listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km` : '—'} · {listing.drive ?? '—'}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-display text-forest-700 text-lg">
            {isAuStock && listing.au_price_aud
              ? centsToAud(listing.au_price_aud)
              : listing.aud_estimate
              ? `~${centsToAud(listing.aud_estimate)}`
              : listing.start_price_jpy
              ? `¥${listing.start_price_jpy.toLocaleString()}`
              : 'POA'}
          </span>
          <span className="text-forest-600 text-sm font-semibold group-hover:underline">Build →</span>
        </div>
      </div>
    </Link>
  )
}

// ---- Static data ----
const PRODUCTS = [
  { slug: 'tama',   icon: '🪑', name: 'TAMA',        desc: '6-seater family conversion. Rear seat folds to bed, galley kitchen, sink & fridge.',       href: '/products/tama' },
  { slug: 'mana',   icon: '🏕️', name: 'MANA',        desc: 'Liveable 2-person campervan. Full standing room, toilet, 55L water, 200AH lithium.',        href: '/products/mana' },
  { slug: 'poptop', icon: '🏠', name: 'Pop Top Roof', desc: 'Fiberglass pop top. Adds 600mm height, park anywhere when lowered. $11,900 ex GST.',        href: '/products/poptop' },
  { slug: 'elec',   icon: '⚡', name: 'Electrical',   desc: 'Starter to Off-Grid Pro. Lithium battery, solar, inverter, shore power. From cabinet to full system.', href: '/build' },
]

const STEPS = [
  { title: 'Choose Your Van',     desc: 'Browse Japan auction listings updated every Monday, Japanese dealer buy-now vans, or our AU stock.' },
  { title: 'Build Your Config',   desc: 'Add a TAMA or MANA fit-out, pop top, electrical system. See your total price instantly.' },
  { title: 'Hold with $500',      desc: 'Place a refundable deposit hold. We bid Thursday, confirm by Friday.' },
  { title: 'Drive Away',          desc: `We handle import, compliance, shipping. Pop top and fit-out booked in parallel so you're on the road faster.` },
]

