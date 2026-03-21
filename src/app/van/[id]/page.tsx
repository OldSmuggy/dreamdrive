import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getJpyRate } from '@/lib/settings'
import { listingDisplayPrice } from '@/lib/pricing'
import { generateMeta } from '@/lib/seo'
import { centsToAud, scoreColor, scoreLabel, sourceLabel, sourceBadgeColor, auctionUrgency, locationBadgeInfo, fitOutLevelInfo } from '@/lib/utils'
import AuctionBanner from '@/components/ui/AuctionBanner'
import AuctionCountdownBanner from '@/components/van/AuctionCountdownBanner'
import PhotoGallery from '@/components/van/PhotoGallery'
import ConversionDetails from '@/components/van/ConversionDetails'
import SaveVanButton from '@/components/ui/SaveVanButton'
import ShareButtons from '@/components/ui/ShareButtons'
import DepositHoldButton from '@/components/ui/DepositHoldButton'
import ViewContentTracker from '@/components/van/ViewContentTracker'
import type { Listing } from '@/types'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const { data } = await supabase.from('listings').select('model_name, model_year, description, photos').eq('id', params.id).single()
  if (!data) return { title: 'Van Detail' }
  return generateMeta({
    title: `${data.model_year} ${data.model_name}`,
    description: data.description || `${data.model_year} ${data.model_name} — imported from Japan by Bare Camper. View photos, specs and pricing.`,
    image: data.photos?.[0],
    url: `/van/${params.id}`,
  })
}

export default async function VanDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const [{ data }, { data: { user } }, jpyRate] = await Promise.all([
    supabase.from('listings').select('*').eq('id', params.id).single(),
    supabase.auth.getUser(),
    getJpyRate(),
  ])
  if (!data) notFound()

  const listing  = data as Listing
  const sColor   = scoreColor(listing.inspection_score)
  const urgency  = listing.source === 'auction' ? auctionUrgency(listing.auction_date) : null
  const locBadge = locationBadgeInfo(listing)
  const foBadge  = fitOutLevelInfo(listing.fit_out_level)

  // Check if user has saved this van + is admin
  let isSaved = false
  let isAdmin = false
  if (user) {
    const [{ data: saved }, { data: profile }] = await Promise.all([
      supabase.from('saved_vans').select('id').eq('user_id', user.id).eq('listing_id', listing.id).maybeSingle(),
      supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    ])
    isSaved = !!saved
    isAdmin = !!profile?.is_admin || !!user.email?.endsWith('@dreamdrive.life')
  }

  const sourceUrl = (listing.raw_data as Record<string, string> | null)?.url ?? null
  const sourceLabel = listing.source === 'dealer_carsensor' ? 'Car Sensor'
    : listing.source === 'dealer_goonet' ? 'Goo-net'
    : listing.source === 'auction' ? 'Japan auction house'
    : null

  const isJapanListing = listing.source !== 'au_stock'
  const { priceCents, isEstimate } = listingDisplayPrice(listing, jpyRate)
  const displayPrice = priceCents ? centsToAud(priceCents) : 'POA'

  const internalsLabel: Record<string, string> = {
    empty: 'Empty',
    seats: 'Seats',
    campervan: 'Campervan Fit Out',
  }

  const specs: [string, string][] = [
    ['Model',          listing.model_name],
    ['Grade',          listing.grade ?? '—'],
    ['Year',           listing.model_year?.toString() ?? '—'],
    ...(listing.size ? [['Size', listing.size] as [string, string]] : []),
    ...(listing.internals ? [['Internals', internalsLabel[listing.internals] ?? listing.internals] as [string, string]] : []),
    ...(listing.has_fitout && listing.fitout_grade ? [['Fitout Condition', listing.fitout_grade] as [string, string]] : []),
    ...(listing.power_system && listing.power_system !== 'None' ? [['Power System', listing.power_system] as [string, string]] : []),
    ['Chassis',        listing.chassis_code ?? '—'],
    ['Engine',         listing.displacement_cc ? `${(listing.displacement_cc / 1000).toFixed(1)}L ${listing.displacement_cc > 2500 ? 'Diesel' : 'Petrol'}` : '—'],
    ['Transmission',   listing.transmission === 'IA' ? 'Auto (CVT/IA)' : listing.transmission ?? '—'],
    ['Drive',          listing.drive ?? '—'],
    ['Mileage',        listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km` : '—'],
    ['Colour',         listing.body_colour ?? '—'],
    ['Grade Score',    listing.inspection_score ? `${listing.inspection_score} — ${scoreLabel(listing.inspection_score)}` : '—'],
  ]

  const ctaLabel = listing.source === 'auction' ? 'Hold This Van — $3,000 Deposit'
    : listing.source === 'au_stock' ? 'Reserve Now — $3,000 Deposit'
    : 'Express Interest — Book a Call'

  const vehicleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: `${listing.model_year} ${listing.model_name}`,
    brand: 'Toyota',
    model: 'Hiace',
    vehicleModelDate: listing.model_year?.toString(),
    ...(listing.mileage_km && {
      mileageFromOdometer: {
        '@type': 'QuantitativeValue',
        value: listing.mileage_km,
        unitCode: 'KMT',
      },
    }),
    ...(priceCents && {
      offers: {
        '@type': 'Offer',
        price: (priceCents / 100).toFixed(2),
        priceCurrency: 'AUD',
        availability: 'https://schema.org/InStock',
      },
    }),
  }

  return (
    <div className="min-h-screen">
      <ViewContentTracker
        id={listing.id}
        model_name={listing.model_name}
        model_year={listing.model_year}
        price_cents={priceCents}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd) }}
      />
      <AuctionBanner />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/browse" className="text-ocean text-sm font-medium hover:underline">
            ← Back to Browse
          </Link>
          {isAdmin && (
            <Link
              href={`/admin/listings`}
              className="text-xs px-3 py-1.5 bg-ocean text-white rounded-lg hover:bg-ocean font-semibold"
            >
              ✏ Edit in Admin
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* ---- Photos ---- */}
          <div>
            {/* Badges overlay (server-rendered, sits above the gallery) */}
            <div className="relative">
              <PhotoGallery
                photos={listing.photos}
                modelName={listing.model_name}
                focalPoint={listing.image_focal_point}
                isAuction={listing.source === 'auction'}
                contactPhone={listing.contact_phone}
              />
              <div className="absolute top-3 left-3 flex gap-2 flex-wrap pointer-events-none">
                <span className={`${locBadge.bg} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                  {locBadge.label}
                </span>
                {urgency === 'closing_soon' && <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">CLOSING SOON</span>}
                {urgency === 'last_chance'  && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">LAST CHANCE</span>}
                {listing.has_fitout && <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded">🏕 Campervan Build</span>}
              </div>
              {listing.power_system && listing.power_system !== 'None' && (
                <div className="absolute top-3 right-3 bg-gray-900/80 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
                  🔌 {listing.power_system === '240V Australian' ? '240V AU Ready' : '100V JP'}
                </div>
              )}
            </div>
          </div>

          {/* ---- Details ---- */}
          <div>
            {/* Auction countdown / result banner */}
            {listing.source === 'auction' && (
              <AuctionCountdownBanner
                auctionTime={listing.auction_time}
                auctionResult={listing.auction_result}
                soldPriceJpy={listing.sold_price_jpy}
                topBidJpy={listing.top_bid_jpy}
                jpyRate={jpyRate}
                listingId={listing.id}
              />
            )}

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className={`inline-flex items-center score-${sColor} text-xs font-bold px-2.5 py-1 rounded`}>
                {listing.inspection_score ? `Grade ${listing.inspection_score} — ${scoreLabel(listing.inspection_score)}` : 'No grade'}
              </div>
              {listing.has_fitout && (
                <div className="inline-flex items-center text-white text-xs font-bold px-2.5 py-1 rounded" style={{ background: '#92400e' }}>
                  🏕 Campervan Build{listing.fitout_grade ? ` · ${listing.fitout_grade}` : ''}
                </div>
              )}
              <div className="ml-auto flex items-center gap-3">
                <ShareButtons url={`/van/${listing.id}`} title={`${listing.model_year} ${listing.model_name} — Bare Camper`} />
                <SaveVanButton listingId={listing.id} userId={user?.id ?? null} initialSaved={isSaved} />
              </div>
            </div>
            <h1 className="text-3xl text-charcoal mb-2">{listing.model_name}</h1>

            {/* Location + fit-out level */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {locBadge.sub && (
                <p className="text-sm font-medium text-gray-600">{locBadge.sub}</p>
              )}
              {foBadge && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${foBadge.cls}`}>
                  {foBadge.label} — {foBadge.desc}
                </span>
              )}
            </div>

            {listing.source === 'auction' && (listing.auction_time || listing.auction_date) && !listing.auction_result && (
              <p className="text-amber-700 font-medium text-sm mb-4">
                Auction: {new Date(listing.auction_time ?? listing.auction_date!).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {listing.source === 'au_stock' && listing.eta_date && (
              <p className="text-ocean font-medium text-sm mb-4">
                ETA in Australia: ~{new Date(listing.eta_date).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
              </p>
            )}

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl text-ocean">{displayPrice}</div>
                {isEstimate && priceCents && (
                  <span className="text-sm text-gray-400">est.</span>
                )}
              </div>
              {isJapanListing && listing.start_price_jpy && priceCents && (
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                  ¥{listing.start_price_jpy.toLocaleString()} JPY × {jpyRate.toFixed(4)} + $10,000 import package
                  <span className="block text-amber-600 font-medium mt-0.5">Final price confirmed at time of payment — depends on exchange rate.</span>
                </p>
              )}
              {isJapanListing && !listing.start_price_jpy && !priceCents && (
                <p className="text-xs text-gray-400 mt-1">Contact us for pricing on this van.</p>
              )}
              {!isJapanListing && priceCents && (
                <p className="text-xs text-gray-400 mt-1">All-in price — import, compliance & GST included.</p>
              )}
            </div>

            {/* Spec table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
              {specs.map(([k, v], i) => (
                <div key={k} className={`flex justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <span className="text-gray-500 font-medium">{k}</span>
                  <span className="text-gray-800">{v}</span>
                </div>
              ))}
            </div>

            {/* Equipment */}
            {(listing.has_nav || listing.has_leather || listing.has_sunroof || listing.has_alloys) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {listing.has_nav      && <Chip>Navigation</Chip>}
                {listing.has_leather  && <Chip>Leather Seats</Chip>}
                {listing.has_sunroof  && <Chip>Sunroof</Chip>}
                {listing.has_alloys   && <Chip>Alloy Wheels</Chip>}
              </div>
            )}

            {/* Source verification */}
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-ocean mb-4 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Verify source listing on {sourceLabel}
              </a>
            )}

            {/* CTAs */}
            <div className="space-y-3">
              <Link href={`/configurator?van=${listing.id}`}
                className="btn-primary w-full text-center text-base py-4 block">
                Build This Van →
              </Link>
              <DepositHoldButton
                listing={listing}
                userId={user?.id ?? null}
              />
              <Link href="/quiz"
                className="text-ocean font-semibold hover:underline text-sm text-center block">
                Not sure? Take the Van Match Quiz →
              </Link>
            </div>
          </div>
        </div>

        {listing.description && (
          <div className="mt-10 bg-cream rounded-2xl p-6">
            <h2 className="text-xl mb-2">About this van</h2>
            <p className="text-gray-600 leading-relaxed">{listing.description}</p>
          </div>
        )}

        {listing.conversion_video_url && (
          <div className="mt-10">
            <ConversionDetails videoUrl={listing.conversion_video_url} />
          </div>
        )}

        {listing.has_fitout && listing.show_interior_gallery && (listing.internal_photos ?? []).length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl text-charcoal mb-4">Campervan Interior &amp; Features</h2>
            <PhotoGallery
              photos={listing.internal_photos ?? []}
              modelName={`${listing.model_name} — Interior`}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="bg-cream text-ocean border border-ocean-light text-xs font-medium px-3 py-1 rounded-full">{children}</span>
}
