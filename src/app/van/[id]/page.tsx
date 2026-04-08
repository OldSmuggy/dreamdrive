export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getJpyRate } from '@/lib/settings'
import { listingDisplayPrice, importBreakdown, importFixedCosts } from '@/lib/pricing'
import { generateMeta } from '@/lib/seo'
import { centsToAud, scoreColor, scoreLabel, sourceLabel, sourceBadgeColor, auctionUrgency, locationBadgeInfo, fitOutLevelInfo, curationBadgeInfo } from '@/lib/utils'
import AuctionBanner from '@/components/ui/AuctionBanner'
import { TrackPageView } from '@/components/TrackPageView'
import SourcingButton from '@/components/van/SourcingButton'
import AuctionCountdownBanner from '@/components/van/AuctionCountdownBanner'
import PhotoGallery from '@/components/van/PhotoGallery'
import ConversionDetails from '@/components/van/ConversionDetails'
import SaveVanButton from '@/components/ui/SaveVanButton'
import ShareButtons from '@/components/ui/ShareButtons'
import DepositHoldButton from '@/components/ui/DepositHoldButton'
import ImportEstimate from '@/components/van/ImportEstimate'
import ViewContentTracker from '@/components/van/ViewContentTracker'
import BuyerAgentNotes from '@/components/van/BuyerAgentNotes'
import MarketContext from '@/components/van/MarketContext'
import PipelineTimeline from '@/components/van/PipelineTimeline'
import InspirationBlock from '@/components/van/InspirationBlock'
import StickyMobileCTA from '@/components/van/StickyMobileCTA'
import AskAboutVan from '@/components/van/AskAboutVan'
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
  const curBadge = curationBadgeInfo(listing.curation_badge)

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
  const breakdown = isJapanListing ? importBreakdown(listing, jpyRate, listing.size === 'SLWB') : null
  const fixedCosts = isJapanListing && !breakdown ? importFixedCosts(listing.size === 'SLWB') : null

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

  const ctaLabel = listing.source === 'auction' ? 'View & Bid — $3,000 Deposit'
    : listing.source === 'au_stock' ? 'Reserve This Van — $3,000'
    : 'Reserve This Van — $3,000'

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
        availability: listing.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      },
    }),
  }

  return (
    <div className="min-h-screen">
      <TrackPageView event="browse_van" params={{ van_id: listing.id, model: listing.model_name, source: listing.source }} />
      <ViewContentTracker
        id={listing.id}
        model_name={listing.model_name}
        model_year={listing.model_year}
        price_cents={priceCents}
      />
      {listing.status !== 'sold' && (
        <StickyMobileCTA
          listingId={listing.id}
          price={displayPrice}
          ctaLabel={listing.source === 'au_stock' ? 'Reserve & Test Drive →' : 'Reserve This Van →'}
        />
      )}
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
            {listing.status === 'sold' && (
              <div className="bg-gray-800 text-white text-center py-3 px-4 rounded-xl mb-4 font-semibold tracking-wide">
                This van has been sold
              </div>
            )}
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
                {listing.is_community_find && <span className="bg-driftwood text-white text-xs font-bold px-2 py-0.5 rounded">Community Find</span>}
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
              {curBadge && (
                <div className={`inline-flex items-center ${curBadge.bg} ${curBadge.text} text-xs font-bold px-2.5 py-1 rounded`}>
                  {curBadge.label}
                </div>
              )}
              {(listing.source === 'dealer_goonet' || listing.source === 'dealer_carsensor') && (
                <div className="inline-flex items-center text-white text-xs font-bold px-2.5 py-1 rounded gap-1" style={{ background: '#EB0A1E' }}>
                  ✓ Toyota Partner — Japan
                </div>
              )}
              <div className="ml-auto flex items-center gap-3">
                {user ? (
                  <a
                    href={`/api/listings/${listing.id}/pdf`}
                    download
                    title="Download PDF info sheet"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7L3 7v10z" />
                    </svg>
                  </a>
                ) : (
                  <Link
                    href="/login"
                    title="Sign in to download PDF info sheet"
                    className="text-gray-300 hover:text-ocean transition-colors relative group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7L3 7v10z" />
                    </svg>
                    <span className="absolute bottom-full right-0 mb-1.5 whitespace-nowrap text-xs bg-charcoal text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Sign in to download
                    </span>
                  </Link>
                )}
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

            {/* Pipeline timeline */}
            <PipelineTimeline stage={listing.pipeline_stage} eta={listing.pipeline_eta} />

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl text-ocean">{displayPrice}</div>
                {isEstimate && priceCents && (
                  <span className="text-sm text-gray-400">est.</span>
                )}
              </div>
              {isJapanListing && priceCents && (
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                  All-in estimate — includes vehicle, sourcing fee, shipping, GST, compliance &amp; rego.
                  <span className="block text-amber-600 font-medium mt-0.5">Final price confirmed at time of payment — depends on exchange rate.</span>
                </p>
              )}
              {isJapanListing && !priceCents && (
                <p className="text-xs text-gray-400 mt-1">Contact us for pricing on this van.</p>
              )}
              {!isJapanListing && priceCents && (
                <p className="text-xs text-gray-400 mt-1">All-in price — import, compliance & GST included.</p>
              )}
              {listing.market_comparison_aud && priceCents && listing.market_comparison_aud > priceCents && (
                <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm font-semibold px-3 py-2 rounded-lg">
                  <span>📉</span>
                  <span>${Math.round((listing.market_comparison_aud - priceCents) / 100).toLocaleString()} below comparable local listings</span>
                </div>
              )}
            </div>

            {/* Itemised import estimate — full breakdown when we have a price */}
            {breakdown && (
              <ImportEstimate lines={breakdown.lines} totalCents={breakdown.totalCents} />
            )}

            {/* Fixed import costs — shown when no price (auction without starting bid) */}
            {fixedCosts && !breakdown && isJapanListing && (
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                <div className="px-4 py-3 bg-ocean/5">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-ocean shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-charcoal">Import Cost Breakdown</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Final vehicle price determined at auction. These are the fixed costs added on top.</p>
                </div>

                {/* Vehicle price row — TBD */}
                <div className="flex items-start justify-between px-4 py-2.5 text-sm bg-amber-50 border-b border-amber-100">
                  <div className="flex-1 mr-4">
                    <span className="text-amber-800 font-semibold">Vehicle purchase price</span>
                    <span className="block text-xs text-amber-600 mt-0.5">Determined at auction — you set the max bid</span>
                  </div>
                  <span className="text-amber-800 font-semibold whitespace-nowrap">TBD</span>
                </div>

                {/* GST row */}
                <div className="flex items-start justify-between px-4 py-2.5 text-sm bg-white">
                  <div className="flex-1 mr-4">
                    <span className="text-gray-700">GST (10% on vehicle + shipping)</span>
                    <span className="block text-xs text-gray-400 mt-0.5">Calculated on final auction price</span>
                  </div>
                  <span className="text-gray-800 font-medium whitespace-nowrap">10%</span>
                </div>

                {/* Fixed cost lines */}
                {fixedCosts.lines.map((line, i) => (
                  <div
                    key={line.label}
                    className={`flex items-start justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-gray-50/60' : 'bg-white'}`}
                  >
                    <div className="flex-1 mr-4">
                      <span className="text-gray-700">{line.label}</span>
                      {line.note && <span className="block text-xs text-gray-400 mt-0.5">{line.note}</span>}
                    </div>
                    <span className="text-gray-800 font-medium whitespace-nowrap">{centsToAud(line.cents)}</span>
                  </div>
                ))}

                {/* Total fixed costs */}
                <div className="flex items-center justify-between px-4 py-3 bg-charcoal text-white">
                  <div>
                    <span className="font-bold text-sm">Fixed import costs</span>
                    <span className="block text-xs text-gray-400">+ vehicle price + 10% GST</span>
                  </div>
                  <span className="font-bold text-sand text-base">{centsToAud(fixedCosts.totalFixedCents)}</span>
                </div>

                {/* Example calculation */}
                <div className="px-4 py-3 bg-cream border-t border-gray-100">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong>Example:</strong> If the van sells at auction for ¥2,000,000 (~$19,000 AUD), the total landed price would be approximately <strong>$28,000–$30,000</strong> including all fees, GST, shipping, compliance, and registration.
                  </p>
                </div>
              </div>
            )}

            {/* What You're Paying — transparency block */}
            {isJapanListing && priceCents && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                <h3 className="text-sm font-bold text-charcoal mb-3">What You&apos;re Paying</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Van price (Japan)</span>
                    <span className="text-gray-800 font-medium">{displayPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping + compliance + rego</span>
                    <span className="text-gray-800 font-medium">~$5,800–$6,200</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-charcoal font-semibold">Total landed in Brisbane</span>
                    <span className="text-charcoal font-semibold">
                      {priceCents ? centsToAud(priceCents + 600000) : '—'}
                    </span>
                  </div>
                  {listing.au_market_price_low && listing.au_market_price_high && (
                    <>
                      <div className="flex justify-between pt-2 text-gray-400">
                        <span>Same spec at a Brisbane dealer</span>
                        <span>~${Math.round((listing.au_market_price_low + listing.au_market_price_high) / 200).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-green-700 font-semibold">
                        <span>You save</span>
                        <span>~${Math.round(((listing.au_market_price_low + listing.au_market_price_high) / 2 - priceCents - 600000) / 100).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  $3,000 to reserve — fully refundable if we don&apos;t secure the van.
                </p>
              </div>
            )}

            {/* Market comparison */}
            <MarketContext
              listingPriceCents={priceCents}
              auMarketPriceLow={listing.au_market_price_low}
              auMarketPriceHigh={listing.au_market_price_high}
              auMarketSource={listing.au_market_source}
              auMarketNote={listing.au_market_note}
            />

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

            {/* Auction Sheet PDF — signed-in users only */}
            {user && listing.inspection_sheet && (
              <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                  <p className="text-sm font-semibold text-gray-600">Auction Sheet</p>
                  <a href={listing.inspection_sheet} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-ocean hover:underline">
                    Open in new tab ↗
                  </a>
                </div>
                <object
                  data={listing.inspection_sheet}
                  type="application/pdf"
                  className="w-full"
                  style={{ height: 500 }}
                >
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <p className="text-sm text-gray-500">PDF preview not available.</p>
                    <a href={listing.inspection_sheet} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 bg-ocean text-white text-sm rounded-lg hover:bg-ocean/90">
                      View Auction Sheet
                    </a>
                  </div>
                </object>
              </div>
            )}

            {/* Prompt to sign in to see auction sheet */}
            {!user && listing.inspection_sheet && (
              <div className="mb-6 p-4 bg-cream rounded-xl text-center">
                <p className="text-sm text-gray-600 mb-2">Sign in to view the full auction inspection sheet for this vehicle.</p>
                <Link href="/login" className="text-ocean font-semibold text-sm hover:underline">
                  Sign in →
                </Link>
              </div>
            )}

            {/* CTAs */}
            {listing.status === 'sold' ? (
              <div className="space-y-3">
                <Link href="/browse"
                  className="btn-primary w-full text-center text-base py-4 block">
                  Browse Available Vans →
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {listing.source === 'auction' ? (
                    <SourcingButton
                      label="Start Sourcing — $3,000 Deposit"
                      vanTitle={`${listing.model_year ?? ''} ${listing.model_name}`.trim()}
                      vanId={listing.id}
                      className="btn-primary w-full text-center text-base py-4 block"
                    />
                  ) : (
                    <Link href={`/configurator?van=${listing.id}`}
                      className="btn-primary w-full text-center text-base py-4 block">
                      {listing.source === 'au_stock' ? 'Reserve & Test Drive →' : 'Reserve This Van →'}
                    </Link>
                  )}
                  <DepositHoldButton
                    listing={listing}
                    userId={user?.id ?? null}
                  />
                  <Link href="/quiz"
                    className="text-ocean font-semibold hover:underline text-sm text-center block">
                    Not sure? Take the Van Match Quiz →
                  </Link>
                </div>

                {/* Ask about this van — logged-in users */}
                {user && (
                  <div className="mt-6">
                    <AskAboutVan listingId={listing.id} />
                  </div>
                )}
                {!user && (
                  <div className="mt-6 text-center text-sm text-gray-500">
                    <Link href="/login" className="text-ocean font-semibold hover:underline">Sign in</Link> to ask us about this van.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Pop-top / conversion upsell — show on vans without fitout */}
        {!listing.has_fitout && listing.status !== 'sold' && (
          <div className="mt-10 space-y-4">
            <h2 className="text-xl text-charcoal font-bold">Add to Your Van</h2>

            {/* Pop Top */}
            <div className="border border-gray-200 rounded-xl p-5 hover:border-ocean/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-charcoal mb-1">Pop Top Roof Conversion</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">+600mm standing height. Fits in your garage when lowered.</p>
                  <p className="text-xs text-gray-400 mt-1">$13,090 Ex GST · Fitted in Brisbane. 10 business day turnaround.</p>
                </div>
                <Link href={`/configurator?van=${listing.id}&addon=poptop`} className="text-ocean text-sm font-semibold whitespace-nowrap hover:underline shrink-0">
                  Add to this van →
                </Link>
              </div>
            </div>

            {/* Full camper conversion */}
            <div className="bg-cream border border-sand rounded-2xl p-6">
              <p className="font-semibold text-charcoal mb-1">Want a full campervan conversion?</p>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Explore TAMA (6-seat family) or MANA (2-person campervan) — choose your conversion, then add your van.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/configurator?fitout=tama&van=${listing.id}`} className="btn-primary text-sm px-5 py-2.5">Explore TAMA</Link>
                <Link href={`/configurator?fitout=mana&van=${listing.id}`} className="btn-secondary text-sm px-5 py-2.5">Explore MANA</Link>
                <a
                  href={`https://dreamdrive-configurator-3d.vercel.app/?model=tama&source=barecamper&van_id=${listing.id}&van_name=${encodeURIComponent(listing.model_name)}&van_price=${priceCents ? Math.round(priceCents / 100) : ''}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-ocean text-sm font-semibold px-5 py-2.5 border border-ocean/30 rounded-lg hover:bg-ocean/5 transition-colors"
                >
                  Customise TAMA in 3D ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {listing.description && (
          <div className="mt-10 bg-cream rounded-2xl p-6">
            <h2 className="text-xl mb-2">About this van</h2>
            <p className="text-gray-600 leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Buyer agent notes */}
        <BuyerAgentNotes notes={listing.notes ?? []} />

        {/* Inspiration / what this van could become */}
        <InspirationBlock inspiration={listing.inspiration ?? null} />

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
