'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { centsToAud, scoreColor, scoreLabel, sourceLabel, sourceBadgeColor, auctionUrgency } from '@/lib/utils'
import type { Listing } from '@/types'

interface Props {
  initialListings: Listing[]
  searchParams: Record<string, string | undefined>
}

const SOURCES = [
  { value: 'au_stock',          label: 'AU Stock' },
  { value: 'auction',           label: 'Japan Auction' },
  { value: 'dealer_carsensor',  label: 'Japan Dealer' },
  { value: 'dealer_goonet',     label: 'Japan Dealer (Goo-Net)' },
]

const DRIVES        = ['2WD', '4WD']
const TRANSMISSIONS = [{ v: 'IA', l: 'Auto (CVT)' }, { v: 'AT', l: 'Auto (AT)' }, { v: 'MT', l: 'Manual' }]

export default function BrowseClient({ initialListings }: Props) {
  const router = useRouter()
  const sp     = useSearchParams()

  const [sourceFilter, setSourceFilter] = useState<string[]>(sp.get('source')?.split(',') ?? [])
  const [driveFilter,  setDriveFilter]  = useState<string[]>(sp.get('drive')?.split(',') ?? [])
  const [yearMin,      setYearMin]      = useState(sp.get('yearMin') ?? '')
  const [mileageMax,   setMileageMax]   = useState(sp.get('mileageMax') ?? '')
  const [sortBy,       setSortBy]       = useState('default')

  const filtered = useMemo(() => {
    let list = [...initialListings]
    if (sourceFilter.length) list = list.filter(l => sourceFilter.includes(l.source))
    if (driveFilter.length)  list = list.filter(l => l.drive && driveFilter.includes(l.drive))
    if (yearMin)             list = list.filter(l => (l.model_year ?? 0) >= parseInt(yearMin))
    if (mileageMax)          list = list.filter(l => (l.mileage_km ?? 999999) <= parseInt(mileageMax))
    if (sortBy === 'price_asc')    list.sort((a,b) => (a.aud_estimate ?? 9e9) - (b.aud_estimate ?? 9e9))
    if (sortBy === 'price_desc')   list.sort((a,b) => (b.aud_estimate ?? 0) - (a.aud_estimate ?? 0))
    if (sortBy === 'year_desc')    list.sort((a,b) => (b.model_year ?? 0) - (a.model_year ?? 0))
    if (sortBy === 'mileage_asc')  list.sort((a,b) => (a.mileage_km ?? 9e9) - (b.mileage_km ?? 9e9))
    return list
  }, [initialListings, sourceFilter, driveFilter, yearMin, mileageMax, sortBy])

  function toggle(arr: string[], setArr: (v:string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display text-3xl text-forest-900">Browse Vans</h1>
        <span className="text-gray-500 text-sm">{filtered.length} listings</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ---- Sidebar filters ---- */}
        <aside className="lg:w-56 shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-6">
            <FilterGroup label="Source">
              {SOURCES.map(s => (
                <FilterCheck key={s.value} label={s.label} checked={sourceFilter.includes(s.value)}
                  onChange={() => toggle(sourceFilter, setSourceFilter, s.value)} />
              ))}
            </FilterGroup>

            <FilterGroup label="Drive">
              {DRIVES.map(d => (
                <FilterCheck key={d} label={d} checked={driveFilter.includes(d)}
                  onChange={() => toggle(driveFilter, setDriveFilter, d)} />
              ))}
            </FilterGroup>

            <FilterGroup label="Year (from)">
              <input type="number" placeholder="e.g. 2020" value={yearMin}
                onChange={e => setYearMin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </FilterGroup>

            <FilterGroup label="Max mileage (km)">
              <input type="number" placeholder="e.g. 80000" value={mileageMax}
                onChange={e => setMileageMax(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </FilterGroup>

            {(sourceFilter.length || driveFilter.length || yearMin || mileageMax) ? (
              <button onClick={() => { setSourceFilter([]); setDriveFilter([]); setYearMin(''); setMileageMax('') }}
                className="text-red-500 text-xs font-semibold hover:underline">
                Clear all filters
              </button>
            ) : null}
          </div>
        </aside>

        {/* ---- Listings grid ---- */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="default">Sort: Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="year_desc">Year: Newest</option>
              <option value="mileage_asc">Mileage: Lowest</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-semibold">No listings match your filters.</p>
              <p className="text-sm mt-1">Try broadening your search.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(listing => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Listing Card ----
function ListingCard({ listing }: { listing: Listing }) {
  const photo = listing.photos[0] ?? null
  const urgency = listing.source === 'auction' ? auctionUrgency(listing.auction_date) : null
  const sColor = scoreColor(listing.inspection_score)
  const badgeColor = sourceBadgeColor(listing.source)

  const displayPrice = listing.source === 'au_stock' && listing.au_price_aud
    ? centsToAud(listing.au_price_aud)
    : listing.aud_estimate
    ? `~${centsToAud(listing.aud_estimate)} AUD est.`
    : listing.start_price_jpy
    ? `¥${listing.start_price_jpy.toLocaleString()} start`
    : 'POA'

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Photo */}
      <div className="relative h-44 bg-gray-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.model_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">🚐</div>
        )}
        <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
          <span className={`${badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded`}>
            {sourceLabel(listing.source)}
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
        {listing.inspection_score && (
          <div className={`absolute top-3 right-3 score-${sColor} text-xs font-bold px-2 py-0.5 rounded`}>
            Grade {listing.inspection_score}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-sm text-gray-900 truncate">{listing.model_name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {[listing.model_year, listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km` : null, listing.drive, listing.transmission]
            .filter(Boolean).join(' · ')}
        </p>

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
          <Link href={`/van/${listing.id}`}
            className="btn-primary btn-sm text-xs">
            View & Build
          </Link>
        </div>
      </div>
    </div>
  )
}

// ---- Small helpers ----
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function FilterCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange}
        className="rounded border-gray-300 text-forest-600 focus:ring-forest-500" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}
