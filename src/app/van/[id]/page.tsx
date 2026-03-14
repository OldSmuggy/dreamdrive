import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { centsToAud, scoreColor, scoreLabel, sourceLabel, sourceBadgeColor, auctionUrgency } from '@/lib/utils'
import AuctionBanner from '@/components/ui/AuctionBanner'
import PhotoGallery from '@/components/van/PhotoGallery'
import SaveVanButton from '@/components/ui/SaveVanButton'
import DepositHoldButton from '@/components/ui/DepositHoldButton'
import type { Listing } from '@/types'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const { data } = await supabase.from('listings').select('model_name, model_year').eq('id', params.id).single()
  return { title: data ? `${data.model_year} ${data.model_name}` : 'Van Detail' }
}

export default async function VanDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const [{ data }, { data: { user } }] = await Promise.all([
    supabase.from('listings').select('*').eq('id', params.id).single(),
    supabase.auth.getUser(),
  ])
  if (!data) notFound()

  const listing = data as Listing
  const sColor  = scoreColor(listing.inspection_score)
  const urgency = listing.source === 'auction' ? auctionUrgency(listing.auction_date) : null

  // Check if user has saved this van
  let isSaved = false
  if (user) {
    const { data: saved } = await supabase
      .from('saved_vans')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listing.id)
      .maybeSingle()
    isSaved = !!saved
  }

  const isJapanListing = listing.source !== 'au_stock'
  const displayPrice = listing.source === 'au_stock' && listing.au_price_aud
    ? centsToAud(listing.au_price_aud)
    : listing.aud_estimate
    ? `~${centsToAud(listing.aud_estimate)} AUD`
    : listing.start_price_jpy
    ? `¥${listing.start_price_jpy.toLocaleString()}`
    : 'POA'

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

  const ctaLabel = listing.source === 'auction' ? 'Hold This Van — $500 Deposit'
    : listing.source === 'au_stock' ? 'Reserve Now — $500 Deposit'
    : 'Express Interest — Book a Call'

  return (
    <div className="min-h-screen">
      <AuctionBanner />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/browse" className="text-forest-600 text-sm font-medium hover:underline mb-6 inline-block">
          ← Back to Browse
        </Link>

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
              />
              <div className="absolute top-3 left-3 flex gap-2 flex-wrap pointer-events-none">
                <span className={`${sourceBadgeColor(listing.source)} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                  {sourceLabel(listing.source)}
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
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className={`inline-flex items-center score-${sColor} text-xs font-bold px-2.5 py-1 rounded`}>
                {listing.inspection_score ? `Grade ${listing.inspection_score} — ${scoreLabel(listing.inspection_score)}` : 'No grade'}
              </div>
              {listing.has_fitout && (
                <div className="inline-flex items-center text-white text-xs font-bold px-2.5 py-1 rounded" style={{ background: '#92400e' }}>
                  🏕 Campervan Build{listing.fitout_grade ? ` · ${listing.fitout_grade}` : ''}
                </div>
              )}
              <div className="ml-auto">
                <SaveVanButton listingId={listing.id} userId={user?.id ?? null} initialSaved={isSaved} />
              </div>
            </div>
            <h1 className="font-display text-3xl text-forest-900 mb-2">{listing.model_name}</h1>

            {listing.source === 'auction' && listing.auction_date && (
              <p className="text-amber-700 font-medium text-sm mb-4">
                Auction: {new Date(listing.auction_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {listing.source === 'au_stock' && listing.eta_date && (
              <p className="text-forest-600 font-medium text-sm mb-4">
                ETA in Australia: ~{new Date(listing.eta_date).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
              </p>
            )}

            <div className="mb-6">
              <div className="text-3xl font-display text-forest-700">{displayPrice}</div>
              {isJapanListing && listing.start_price_jpy && listing.aud_estimate && (
                <p className="text-xs text-gray-400 mt-1">
                  ¥{listing.start_price_jpy.toLocaleString()} JPY · AUD estimate based on today&apos;s rate.{' '}
                  <span className="text-amber-600 font-medium">Final price depends on the exchange rate at time of payment.</span>
                </p>
              )}
              {isJapanListing && listing.start_price_jpy && !listing.aud_estimate && (
                <p className="text-xs text-gray-400 mt-1">
                  AUD equivalent varies with exchange rate at time of payment.
                </p>
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

            {/* CTAs */}
            <div className="space-y-3">
              <Link href={`/build?listing=${listing.id}`}
                className="btn-primary w-full text-center text-base py-4 block">
                Build This Van →
              </Link>
              <DepositHoldButton
                listing={listing}
                userId={user?.id ?? null}
              />
              <Link href="/quiz"
                className="text-forest-600 font-semibold hover:underline text-sm text-center block">
                Not sure? Take the Van Match Quiz →
              </Link>
            </div>
          </div>
        </div>

        {listing.description && (
          <div className="mt-10 bg-sand-50 rounded-2xl p-6">
            <h2 className="font-display text-xl mb-2">About this van</h2>
            <p className="text-gray-600 leading-relaxed">{listing.description}</p>
          </div>
        )}

        {listing.has_fitout && listing.show_interior_gallery && (listing.internal_photos ?? []).length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl text-forest-900 mb-4">Campervan Interior &amp; Features</h2>
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
  return <span className="bg-forest-50 text-forest-700 border border-forest-200 text-xs font-medium px-3 py-1 rounded-full">{children}</span>
}
