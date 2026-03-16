'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { centsToAud, scoreColor, scoreLabel, auctionUrgency, locationBadgeInfo, fitOutLevelInfo } from '@/lib/utils'
import SaveVanButton from '@/components/ui/SaveVanButton'
import type { Listing } from '@/types'

interface Props {
  initialListings: Listing[]
  searchParams: Record<string, string | undefined>
  userId: string | null
  initialSavedIds: string[]
}

const LOCATION_FILTERS = [
  { value: '',            label: 'All Locations' },
  { value: 'in_brisbane', label: 'In Brisbane' },
  { value: 'on_ship',     label: 'At Sea' },
  { value: 'in_japan',    label: 'In Japan' },
]

const TYPE_FILTERS = [
  { value: '',       label: 'All Types' },
  { value: 'empty',  label: 'Empty Van' },
  { value: 'partial', label: 'Head Start' },
  { value: 'full',   label: 'Full Campervan' },
]

const MODEL_OPTIONS = [
  { value: '',            label: 'All Models' },
  { value: 'hiace_h200',  label: 'Hiace H200 (2005–2019)' },
  { value: 'hiace_300',   label: 'Hiace 300 Series (2019+)' },
  { value: 'coaster',     label: 'Toyota Coaster' },
  { value: 'other',       label: 'Other' },
]

// Derive effective location from listing (respecting location_status field if set)
function effectiveLocation(l: Listing): string {
  if (l.location_status) return l.location_status
  return l.source === 'au_stock' ? 'in_brisbane' : 'in_japan'
}

export default function BrowseClient({ initialListings, userId, initialSavedIds }: Props) {
  const router = useRouter()

  // Top filter rows
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter,     setTypeFilter]     = useState('')
  const [modelFilter,    setModelFilter]    = useState('')

  // More filters (collapsible)
  const [showMore,    setShowMore]    = useState(false)
  const [driveFilter, setDriveFilter] = useState<string[]>([])
  const [yearMin,     setYearMin]     = useState('')
  const [mileageMax,  setMileageMax]  = useState('')
  const [sortBy,      setSortBy]      = useState('default')

  const filtered = useMemo(() => {
    let list = [...initialListings]
    if (locationFilter) list = list.filter(l => effectiveLocation(l) === locationFilter)
    if (typeFilter)     list = list.filter(l => (l.fit_out_level ?? 'empty') === typeFilter)
    if (modelFilter)    list = list.filter(l => (l.vehicle_model ?? 'hiace_h200') === modelFilter)
    if (driveFilter.length) list = list.filter(l => l.drive && driveFilter.includes(l.drive))
    if (yearMin)        list = list.filter(l => (l.model_year ?? 0) >= parseInt(yearMin))
    if (mileageMax)     list = list.filter(l => (l.mileage_km ?? 999999) <= parseInt(mileageMax))
    if (sortBy === 'price_asc')   list.sort((a,b) => (a.aud_estimate ?? 9e9) - (b.aud_estimate ?? 9e9))
    if (sortBy === 'price_desc')  list.sort((a,b) => (b.aud_estimate ?? 0)   - (a.aud_estimate ?? 0))
    if (sortBy === 'year_desc')   list.sort((a,b) => (b.model_year ?? 0)     - (a.model_year ?? 0))
    if (sortBy === 'mileage_asc') list.sort((a,b) => (a.mileage_km ?? 9e9)  - (b.mileage_km ?? 9e9))
    return list
  }, [initialListings, locationFilter, typeFilter, modelFilter, driveFilter, yearMin, mileageMax, sortBy])

  const hasActiveFilters = locationFilter || typeFilter || modelFilter || driveFilter.length || yearMin || mileageMax

  function clearAll() {
    setLocationFilter(''); setTypeFilter(''); setModelFilter('')
    setDriveFilter([]); setYearMin(''); setMileageMax('')
  }

  function toggleDrive(d: string) {
    setDriveFilter(v => v.includes(d) ? v.filter(x => x !== d) : [...v, d])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display text-3xl text-forest-900">Browse Vans</h1>
        <span className="text-gray-500 text-sm">{filtered.length} listing{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Filter rows ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 space-y-3">

        {/* Row 1 — Location */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider w-20 shrink-0">Location</span>
          <div className="flex flex-wrap gap-1.5">
            {LOCATION_FILTERS.map(f => (
              <button key={f.value} onClick={() => setLocationFilter(f.value)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                  locationFilter === f.value
                    ? 'bg-forest-900 text-white border-forest-900'
                    : 'bg-white text-forest-900 border-forest-900 hover:bg-forest-50'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2 — Type */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider w-20 shrink-0">Type</span>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map(f => (
              <button key={f.value} onClick={() => setTypeFilter(f.value)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                  typeFilter === f.value
                    ? 'bg-forest-900 text-white border-forest-900'
                    : 'bg-white text-forest-900 border-forest-900 hover:bg-forest-50'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3 — Model + sort + more filters toggle */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider w-20 shrink-0">Model</span>
          <select value={modelFilter} onChange={e => setModelFilter(e.target.value)}
            className="border border-forest-900 text-forest-900 rounded-full px-4 py-1.5 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-forest-600">
            {MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowMore(v => !v)}
              className="text-xs text-gray-500 hover:text-gray-800 font-medium underline-offset-2 hover:underline">
              {showMore ? 'Hide filters' : 'More filters'}
            </button>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700">
              <option value="default">Sort: Default</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="year_desc">Year: Newest</option>
              <option value="mileage_asc">Mileage: Lowest</option>
            </select>
          </div>
        </div>

        {/* More filters (collapsible) */}
        {showMore && (
          <div className="border-t border-gray-100 pt-3 mt-1 flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Drive</p>
              <div className="flex gap-2">
                {['2WD', '4WD'].map(d => (
                  <button key={d} onClick={() => toggleDrive(d)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      driveFilter.includes(d) ? 'bg-forest-900 text-white border-forest-900' : 'bg-white text-forest-900 border-forest-900 hover:bg-forest-50'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Year from</p>
              <input type="number" placeholder="e.g. 2020" value={yearMin}
                onChange={e => setYearMin(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Max mileage (km)</p>
              <input type="number" placeholder="e.g. 80000" value={mileageMax}
                onChange={e => setMileageMax(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32" />
            </div>
          </div>
        )}

        {/* Clear all */}
        {hasActiveFilters && (
          <div className="pt-1">
            <button onClick={clearAll} className="text-red-500 text-xs font-semibold hover:underline">
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold">No listings match your filters.</p>
          <p className="text-sm mt-1">Try broadening your search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              userId={userId}
              initialSaved={initialSavedIds.includes(listing.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Listing Card ──────────────────────────────────────────────────────────────
function ListingCard({ listing, userId, initialSaved }: { listing: Listing; userId: string | null; initialSaved: boolean }) {
  const router = useRouter()
  const photo    = listing.photos[0] ?? null
  const urgency  = listing.source === 'auction' ? auctionUrgency(listing.auction_date) : null
  const sColor   = scoreColor(listing.inspection_score)
  const locBadge = locationBadgeInfo(listing)
  const foBadge  = fitOutLevelInfo(listing.fit_out_level)
  const auctionBlur = !userId && listing.source === 'auction'

  const displayPrice = listing.source === 'au_stock' && listing.au_price_aud
    ? centsToAud(listing.au_price_aud)
    : listing.aud_estimate
    ? `~${centsToAud(listing.aud_estimate)} AUD est.`
    : listing.start_price_jpy
    ? `¥${listing.start_price_jpy.toLocaleString()} start`
    : 'POA'

  return (
    <Link href={`/van/${listing.id}`} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group block">
      {/* Photo */}
      <div className="relative h-[220px] overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={listing.model_name}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${auctionBlur ? 'blur-md scale-110' : ''}`}
            style={{ objectPosition: listing.image_focal_point ?? 'center' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-300 text-5xl">🚐</div>
        )}
        {/* Auction blur CTA */}
        {auctionBlur && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 cursor-pointer"
            style={{ background: 'rgba(15, 40, 25, 0.72)', backdropFilter: 'blur(2px)' }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); router.push('/login?next=/browse') }}
          >
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-white font-semibold text-sm leading-tight mb-1">Register to see photos</p>
            <p className="text-white/70 text-xs">Free account — takes 30 seconds</p>
          </div>
        )}
        {/* Top-left: location badge */}
        <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
          <span className={`${locBadge.bg} text-white text-xs font-bold px-2 py-0.5 rounded`}>
            {locBadge.label}
          </span>
          {urgency === 'closing_soon' && (
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">CLOSING SOON</span>
          )}
          {urgency === 'last_chance' && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">LAST CHANCE</span>
          )}
          {listing.featured && listing.source === 'au_stock' && (
            <span className="bg-forest-500 text-white text-xs font-bold px-2 py-0.5 rounded">FEATURED</span>
          )}
        </div>
        {/* Top-right: save + grade */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          <SaveVanButton listingId={listing.id} userId={userId} initialSaved={initialSaved} />
          {listing.inspection_score && (
            <div className={`score-${sColor} text-xs font-bold px-2 py-0.5 rounded`}>
              Grade {listing.inspection_score}
            </div>
          )}
          {listing.has_fitout && (
            <div className="text-white text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#92400e' }}>
              🏕 Campervan Build{listing.fitout_grade ? ` · ${listing.fitout_grade}` : ''}
            </div>
          )}
          {listing.power_system && listing.power_system !== 'None' && (
            <div className="bg-gray-900/80 text-white text-xs px-2 py-0.5 rounded">
              🔌 {listing.power_system === '240V Australian' ? '240V AU Ready' : '100V JP'}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-sm text-gray-900 truncate">{listing.model_name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {[listing.model_year, listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km` : null, listing.drive, listing.transmission]
            .filter(Boolean).join(' · ')}
        </p>

        {/* Location sub-text */}
        {locBadge.sub && (
          <p className="text-xs mt-1 font-medium" style={{ color: locBadge.bg.replace('bg-', '').replace('-600', '') === 'green' ? '#15803d' : locBadge.bg.replace('bg-', '').replace('-600', '') === 'orange' ? '#ea580c' : '#dc2626' }}>
            {locBadge.sub}
          </p>
        )}

        {/* Fit-out level badge */}
        {foBadge && (
          <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded border ${foBadge.cls}`}>
            {foBadge.label}
          </span>
        )}

        {listing.source === 'au_stock' && listing.eta_date && (
          <p className="text-xs text-forest-600 font-medium mt-1">
            ETA ~{new Date(listing.eta_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
          </p>
        )}
        {listing.source === 'auction' && listing.auction_date && (
          <p className="text-xs text-amber-700 font-medium mt-1">
            Auction {new Date(listing.auction_date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="font-display text-forest-700 text-base font-semibold">{displayPrice}</span>
          <span className="btn-primary btn-sm text-xs">View & Build</span>
        </div>
      </div>
    </Link>
  )
}
