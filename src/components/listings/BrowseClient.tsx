'use client'
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { centsToAud, scoreColor, scoreLabel, auctionUrgency, locationBadgeInfo, fitOutLevelInfo, curationBadgeInfo } from '@/lib/utils'
import { listingDisplayPrice } from '@/lib/pricing'
import SaveVanButton from '@/components/ui/SaveVanButton'
import type { Listing } from '@/types'

interface ForSaleVehicle {
  id: string
  vehicle_status: string
  vehicle_description: string | null
  sale_price_aud: number | null
  sale_notes: string | null
  sale_label: string | null
  listing: { id: string; model_name: string; model_year: number | null; grade: string | null; photos: string[] } | null
  build: { build_type: string } | null
  current_stage: string | null
}

const STAGE_LABELS: Record<string, string> = {
  vehicle_selection:  'Vehicle Selection',
  bidding:            'Bidding',
  purchase:           'Purchase',
  storage:            'Storage in Japan',
  design_approval:    'Design Approval',
  van_building:       'Van Building',
  shipping:           'Shipping',
  compliance:         'Compliance',
  pop_top_install:    'Pop Top Install',
  ready_for_delivery: 'Ready for Delivery',
  delivered:          'Delivered',
}

interface Props {
  initialListings: Listing[]
  searchParams: Record<string, string | undefined>
  userId: string | null
  initialSavedIds: string[]
  jpyRate: number
  forSaleVehicles?: ForSaleVehicle[]
  colourCounts?: Record<string, number>
}

const LOCATION_FILTERS = [
  { value: '',            label: 'All Locations' },
  { value: 'in_brisbane', label: 'In Brisbane' },
  { value: 'on_ship',     label: 'At Sea' },
  { value: 'in_japan',    label: 'In Japan' },
]

const SOURCE_FILTERS = [
  { value: '',                label: 'All Sources' },
  { value: 'auction',        label: 'Auction' },
  { value: 'dealer',         label: 'Dealer' },
  { value: 'au_stock',       label: 'AU Stock' },
]

const SIZE_FILTERS = [
  { value: '',     label: 'All Sizes' },
  { value: 'SLWB', label: 'Super Long (SLWB)' },
  { value: 'LWB',  label: 'Long (LWB)' },
]

const DRIVE_FILTERS = [
  { value: '',    label: 'All' },
  { value: '4WD', label: '4WD' },
  { value: '2WD', label: '2WD' },
]

const TYPE_FILTERS = [
  { value: '',       label: 'All Types' },
  { value: 'empty',  label: 'Empty Van' },
  { value: 'partial', label: 'Head Start' },
  { value: 'full',   label: 'Full Campervan' },
]

const MODEL_OPTIONS = [
  { value: '',            label: 'All Models' },
  { value: 'hiace_h200',  label: 'Hiace H200 (2005-2019)' },
  { value: 'hiace_300',   label: 'Hiace 300 Series (2019+)' },
  { value: 'coaster',     label: 'Toyota Coaster' },
  { value: 'other',       label: 'Other' },
]

const ENGINE_FILTERS = [
  { value: '',       label: 'All' },
  { value: 'diesel', label: 'Diesel 2.8L' },
  { value: 'petrol', label: 'Petrol 2.0L' },
]

const COLOUR_DOT_MAP: Record<string, string> = {
  White:  '#ffffff',
  Silver: '#c0c0c0',
  Black:  '#000000',
  Pearl:  '#faf0e6',
  Khaki:  '#bdb76b',
}

function colourDot(colour: string): string {
  return COLOUR_DOT_MAP[colour] ?? '#9ca3af'
}

// Derive effective location from listing (respecting location_status field if set)
function effectiveLocation(l: Listing): string {
  if (l.location_status) return l.location_status
  return l.source === 'au_stock' ? 'in_brisbane' : 'in_japan'
}

export default function BrowseClient({ initialListings, userId, initialSavedIds, jpyRate, forSaleVehicles = [], colourCounts = {} }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Read initial filter state from URL params ──
  const [locationFilter, setLocationFilter] = useState(() => searchParams.get('location') ?? '')
  const [sourceFilter, setSourceFilter] = useState(() => searchParams.get('source') ?? '')
  const [sizeFilter, setSizeFilter] = useState(() => searchParams.get('size') ?? '')
  const [driveFilterSingle, setDriveFilterSingle] = useState(() => searchParams.get('driveType') ?? '')
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get('type') ?? '')
  const [modelFilter, setModelFilter] = useState(() => searchParams.get('model') ?? '')
  const [driveFilter, setDriveFilter] = useState<string[]>(() => {
    const d = searchParams.get('drive')
    return d ? d.split(',').filter(Boolean) : []
  })
  const [yearMin, setYearMin] = useState(() => searchParams.get('yearMin') ?? '')
  const [mileageMax, setMileageMax] = useState(() => searchParams.get('mileageMax') ?? '')
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') ?? 'default')
  const [engineFilter, setEngineFilter] = useState(() => searchParams.get('engine') ?? '')
  const [colourFilter, setColourFilter] = useState<string[]>(() => {
    const c = searchParams.get('colour')
    return c ? c.split(',').filter(Boolean) : []
  })
  const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') ?? '')

  // More filters (collapsible — desktop)
  const [showMore, setShowMore] = useState(() => {
    // Auto-open if any "more" filter is active from URL
    const d = searchParams.get('drive')
    return !!(d || searchParams.get('yearMin') || searchParams.get('mileageMax') || searchParams.get('engine') || searchParams.get('colour') || searchParams.get('minPrice') || searchParams.get('maxPrice'))
  })

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Stock alert (notify me when stock arrives)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyName, setNotifyName] = useState('')
  const [notifyNotes, setNotifyNotes] = useState('')
  const [notifySending, setNotifySending] = useState(false)
  const [notifySent, setNotifySent] = useState(false)

  async function submitStockAlert() {
    if (!notifyEmail) return
    setNotifySending(true)
    await fetch('/api/stock-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: notifyEmail, name: notifyName, notes: notifyNotes }),
    }).catch(() => {})
    setNotifySending(false)
    setNotifySent(true)
  }

  // ── Sync filter state to URL ──
  const syncUrl = useCallback((overrides?: Record<string, string | string[] | undefined>) => {
    const state: Record<string, string | string[] | undefined> = {
      location: locationFilter || undefined,
      source: sourceFilter || undefined,
      size: sizeFilter || undefined,
      driveType: driveFilterSingle || undefined,
      type: typeFilter || undefined,
      model: modelFilter || undefined,
      drive: driveFilter.length ? driveFilter.join(',') : undefined,
      yearMin: yearMin || undefined,
      mileageMax: mileageMax || undefined,
      sort: sortBy !== 'default' ? sortBy : undefined,
      engine: engineFilter || undefined,
      colour: colourFilter.length ? colourFilter.join(',') : undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      ...overrides,
    }
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(state)) {
      if (v && typeof v === 'string') params.set(k, v)
    }
    const qs = params.toString()
    router.replace(qs ? `/browse?${qs}` : '/browse', { scroll: false })
  }, [locationFilter, sourceFilter, sizeFilter, driveFilterSingle, typeFilter, modelFilter, driveFilter, yearMin, mileageMax, sortBy, engineFilter, colourFilter, minPrice, maxPrice, router])

  // Sync URL whenever any filter changes
  useEffect(() => {
    syncUrl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, sourceFilter, sizeFilter, driveFilterSingle, typeFilter, modelFilter, driveFilter, yearMin, mileageMax, sortBy, engineFilter, colourFilter, minPrice, maxPrice])

  // ── Filtering ──
  const filtered = useMemo(() => {
    let list = [...initialListings]
    if (locationFilter) list = list.filter(l => effectiveLocation(l) === locationFilter)
    if (sourceFilter) {
      if (sourceFilter === 'dealer') {
        list = list.filter(l => l.source === 'dealer_goonet' || l.source === 'dealer_carsensor')
      } else {
        list = list.filter(l => l.source === sourceFilter)
      }
    }
    if (sizeFilter)     list = list.filter(l => l.size === sizeFilter)
    if (driveFilterSingle) list = list.filter(l => l.drive === driveFilterSingle)
    if (typeFilter)     list = list.filter(l => (l.fit_out_level ?? 'empty') === typeFilter)
    if (modelFilter)    list = list.filter(l => (l.vehicle_model ?? 'hiace_h200') === modelFilter)
    if (driveFilter.length) list = list.filter(l => l.drive && driveFilter.includes(l.drive))
    if (yearMin)        list = list.filter(l => (l.model_year ?? 0) >= parseInt(yearMin))
    if (mileageMax)     list = list.filter(l => (l.mileage_km ?? 999999) <= parseInt(mileageMax))

    // Engine filter
    if (engineFilter === 'diesel') {
      list = list.filter(l => l.displacement_cc === 2800)
    } else if (engineFilter === 'petrol') {
      list = list.filter(l => l.displacement_cc === 2700 || l.displacement_cc === 2000)
    }

    // Colour filter
    if (colourFilter.length) {
      list = list.filter(l => l.body_colour ? colourFilter.includes(l.body_colour) : false)
    }

    // Price filter (user enters dollars, aud_estimate is in cents)
    if (minPrice) {
      const minCents = parseInt(minPrice) * 100
      list = list.filter(l => (l.aud_estimate ?? 0) >= minCents)
    }
    if (maxPrice) {
      const maxCents = parseInt(maxPrice) * 100
      list = list.filter(l => (l.aud_estimate ?? Infinity) <= maxCents)
    }

    // Sort
    if (sortBy === 'price_asc')   list.sort((a,b) => (a.aud_estimate ?? 9e9) - (b.aud_estimate ?? 9e9))
    if (sortBy === 'price_desc')  list.sort((a,b) => (b.aud_estimate ?? 0)   - (a.aud_estimate ?? 0))
    if (sortBy === 'year_desc')   list.sort((a,b) => (b.model_year ?? 0)     - (a.model_year ?? 0))
    if (sortBy === 'mileage_asc') list.sort((a,b) => (a.mileage_km ?? 9e9)  - (b.mileage_km ?? 9e9))

    // Sold listings always sort to end
    const available = list.filter(l => l.status !== 'sold')
    const sold = list.filter(l => l.status === 'sold')
    return [...available, ...sold]
  }, [initialListings, locationFilter, sourceFilter, sizeFilter, driveFilterSingle, typeFilter, modelFilter, driveFilter, yearMin, mileageMax, sortBy, engineFilter, colourFilter, minPrice, maxPrice])

  // ── Active filter count ──
  const activeFilterCount = [
    locationFilter,
    sourceFilter,
    sizeFilter,
    driveFilterSingle,
    typeFilter,
    modelFilter,
    driveFilter.length > 0 ? 'yes' : '',
    yearMin,
    mileageMax,
    engineFilter,
    colourFilter.length > 0 ? 'yes' : '',
    minPrice,
    maxPrice,
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  function clearAll() {
    setLocationFilter(''); setSourceFilter(''); setSizeFilter(''); setDriveFilterSingle('')
    setTypeFilter(''); setModelFilter('')
    setDriveFilter([]); setYearMin(''); setMileageMax('')
    setEngineFilter(''); setColourFilter([]); setMinPrice(''); setMaxPrice('')
    setSortBy('default')
  }

  function toggleDrive(d: string) {
    setDriveFilter(v => v.includes(d) ? v.filter(x => x !== d) : [...v, d])
  }

  function toggleColour(c: string) {
    setColourFilter(v => v.includes(c) ? v.filter(x => x !== c) : [...v, c])
  }

  // ── Shared filter panel content ──
  const colourEntries = Object.entries(colourCounts).sort((a, b) => b[1] - a[1])

  const pillCls = (active: boolean) =>
    `px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
      active ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-300 hover:border-charcoal'
    }`

  const selectCls = 'border border-gray-300 rounded-full px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean'

  const filterPanelContent = (
    <>
      {/* Row 1 — Source · Drive · Size pills */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* Source */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Source</span>
          {SOURCE_FILTERS.map(f => (
            <button key={f.value} onClick={() => setSourceFilter(f.value)} className={pillCls(sourceFilter === f.value)}>
              {f.label}
            </button>
          ))}
        </div>
        {/* Drive */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Drive</span>
          {DRIVE_FILTERS.map(f => (
            <button key={f.value} onClick={() => setDriveFilterSingle(f.value)} className={pillCls(driveFilterSingle === f.value)}>
              {f.label}
            </button>
          ))}
        </div>
        {/* Size */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Size</span>
          {SIZE_FILTERS.map(f => (
            <button key={f.value} onClick={() => setSizeFilter(f.value)} className={pillCls(sizeFilter === f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2 — Dropdowns + More + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={modelFilter} onChange={e => setModelFilter(e.target.value)} className={selectCls}>
          {MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={engineFilter} onChange={e => setEngineFilter(e.target.value)} className={selectCls}>
          <option value="">All Engines</option>
          <option value="diesel">Diesel 2.8L</option>
          <option value="petrol">Petrol 2.0L</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selectCls}>
          {TYPE_FILTERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className={selectCls}>
          {LOCATION_FILTERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowMore(v => !v)}
            className="text-xs text-gray-500 hover:text-gray-800 font-medium underline-offset-2 hover:underline">
            {showMore ? 'Less ▲' : 'More ▼'}
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectCls}>
            <option value="default">Sort: Default</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="year_desc">Year: Newest</option>
            <option value="mileage_asc">Mileage: Lowest</option>
          </select>
        </div>
      </div>

      {/* Expandable — Year, Mileage, Price, Colour */}
      {showMore && (
        <div className="border-t border-gray-100 pt-3 mt-1 flex flex-wrap gap-6 items-end">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Year from</p>
            <input type="number" placeholder="e.g. 2020" value={yearMin}
              onChange={e => setYearMin(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Max km</p>
            <input type="number" placeholder="e.g. 80000" value={mileageMax}
              onChange={e => setMileageMax(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Price (AUD)</p>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input type="number" placeholder="Min" value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 text-sm w-24" />
              </div>
              <span className="text-gray-400 text-xs">–</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input type="number" placeholder="Max" value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 text-sm w-24" />
              </div>
            </div>
          </div>
          {/* Colour */}
          {colourEntries.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Colour</p>
              <div className="flex flex-wrap gap-1.5">
                {colourEntries.map(([colour, count]) => (
                  <button key={colour} onClick={() => toggleColour(colour)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      colourFilter.includes(colour)
                        ? 'bg-charcoal text-white border-charcoal'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}>
                    <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colourDot(colour), border: colour === 'White' ? '1px solid #d1d5db' : 'none' }} />
                    {colour} <span className="opacity-60">({count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
    </>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl text-charcoal">Browse Vans</h1>
          <span className="text-gray-500 text-sm">Showing {filtered.length} van{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-gray-500 mt-2 text-sm max-w-2xl">
          Japanese auction vans and verified dealer stock — all graded with verified kilometres.<br />
          Reserve from $3,000. Delivered to Brisbane in 6–8 weeks. Track your purchase at every stage.
        </p>
      </div>

      {/* ── Desktop Filter Panel ── */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-2xl p-4 mb-6 space-y-3">
        {filterPanelContent}
      </div>

      {/* ── Mobile Filter Button ── */}
      <div className="md:hidden mb-6">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-charcoal hover:bg-cream transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <h2 className="text-lg text-charcoal">Filters</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {filterPanelContent}
            </div>
            {/* Footer */}
            <div className="flex gap-3 px-4 py-3 border-t border-gray-200 shrink-0">
              <button
                onClick={() => { clearAll(); setDrawerOpen(false) }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear all
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex-1 px-4 py-2.5 bg-ocean text-white rounded-lg text-sm font-medium hover:bg-ocean"
              >
                Apply ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sell a Van banner ── */}
      {!hasActiveFilters && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-cream rounded-xl px-4 py-3.5 border border-driftwood/20">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-charcoal">Got a van to sell?</span> List it here or tip us off about one — earn <strong className="text-charcoal">$200</strong> if it sells.
          </p>
          <div className="flex gap-2 shrink-0">
            <Link href="/tip-a-van" className="text-xs font-semibold text-ocean border border-ocean rounded-full px-3 py-1.5 hover:bg-ocean hover:text-white transition-colors">
              💡 Tip a Van
            </Link>
            <Link href="/account/my-listings" className="text-xs font-semibold text-ocean border border-ocean rounded-full px-3 py-1.5 hover:bg-ocean hover:text-white transition-colors">
              📬 List Your Van
            </Link>
          </div>
        </div>
      )}

      {/* ── For Sale Vehicles ── */}
      {forSaleVehicles.length > 0 && !hasActiveFilters && (
        <div className="mb-8">
          <h2 className="text-xl text-charcoal mb-4">Contract for Sale</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {forSaleVehicles.map(v => (
              <ForSaleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      {filtered.length === 0 && forSaleVehicles.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-xl font-bold text-charcoal mb-2">No vans match your filters.</p>
          <p className="text-gray-500 mb-4">Try broadening your search, or get notified when new vans arrive.</p>
          {hasActiveFilters && (
            <button onClick={clearAll} className="mb-8 text-ocean font-semibold hover:underline text-sm block mx-auto">
              ← Clear all filters
            </button>
          )}
          {notifySent ? (
            <div className="max-w-sm mx-auto bg-ocean/10 text-ocean rounded-2xl p-6">
              <div className="text-3xl mb-2">✓</div>
              <p className="font-semibold">You&apos;re on the list!</p>
              <p className="text-sm mt-1 text-ocean/70">We&apos;ll email you when new stock arrives that matches what you&apos;re after.</p>
            </div>
          ) : (
            <div className="max-w-sm mx-auto bg-cream rounded-2xl p-6 text-left">
              <p className="font-semibold text-charcoal mb-1">Get notified when stock arrives</p>
              <p className="text-gray-500 text-sm mb-4">Leave your details and we&apos;ll give you a heads-up when the right van comes in.</p>
              <input
                type="text"
                placeholder="Your name"
                value={notifyName}
                onChange={e => setNotifyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-ocean/30"
              />
              <input
                type="email"
                placeholder="Your email *"
                value={notifyEmail}
                onChange={e => setNotifyEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-ocean/30"
              />
              <textarea
                placeholder="What are you after? (e.g. diesel, 4WD, pop top)"
                value={notifyNotes}
                onChange={e => setNotifyNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ocean/30 resize-none"
              />
              <button
                onClick={submitStockAlert}
                disabled={!notifyEmail || notifySending}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
              >
                {notifySending ? 'Sending…' : 'Notify Me'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {filtered.slice(0, 12).map((listing, idx) => (
              <React.Fragment key={listing.id}>
                <ListingCard
                  listing={listing}
                  userId={userId}
                  initialSaved={initialSavedIds.includes(listing.id)}
                  jpyRate={jpyRate}
                />
                {/* Configurator upsell card after 6th listing */}
                {idx === 5 && (
                  <a
                    href="https://configure.barecamper.com.au/?model=tama"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 flex items-center gap-6 bg-brand-charcoal text-white rounded-2xl p-6 hover:ring-2 hover:ring-brand-teal transition-all"
                  >
                    <div className="flex-1">
                      <p className="text-brand-gold text-[10px] font-bold uppercase tracking-widest mb-1">Only at Bare Camper</p>
                      <p className="text-lg font-bold mb-1">See what this van could become</p>
                      <p className="text-gray-400 text-sm">Design a full build in our 3D configurator — seats, cabinets, floor, wrap, and more.</p>
                    </div>
                    <span className="shrink-0 bg-brand-teal text-white text-sm font-semibold px-4 py-2 rounded-lg">Build in 3D →</span>
                  </a>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Van Scout — compact mid-page CTA */}
          {filtered.length > 12 && (
            <div className="my-8 bg-cream rounded-2xl p-6 text-center">
              <h2 className="text-xl font-bold text-charcoal mb-2">Can&apos;t find the right one?</h2>
              <p className="text-gray-500 text-sm mb-4 max-w-lg mx-auto">
                Our buyer in Japan sources every week. Tell us what you&apos;re after and we&apos;ll find it.
              </p>
              <Link href="/van-scout" className="btn-primary inline-block text-sm px-6 py-2.5">
                Find My Van →
              </Link>
            </div>
          )}

          {filtered.length > 12 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filtered.slice(12).map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  userId={userId}
                  initialSaved={initialSavedIds.includes(listing.id)}
                  jpyRate={jpyRate}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Social Proof (below vehicles) ── */}
      <div className="mt-10 mb-8 bg-charcoal text-white rounded-2xl p-6 text-center">
        <p className="text-sand text-xs font-semibold tracking-widest uppercase mb-3">100+ vans delivered from Japan to Australia</p>
        <p className="text-lg leading-relaxed max-w-xl mx-auto">
          &ldquo;Reserved my van on a Tuesday. Had auction photos by Thursday. Picked it up in Brisbane 7 weeks later.&rdquo;
        </p>
        <p className="text-gray-400 text-sm mt-2">— Luke, H200 SLWB</p>
        <Link href="/about" className="text-sand text-sm font-semibold mt-4 inline-block hover:underline">
          See customer stories →
        </Link>
      </div>

      {/* ── How It Works Strip ── */}
      <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-charcoal mb-4 text-center">How It Works</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1">1. Browse</p>
            <p className="text-xs text-gray-500">Pick your van from auction or dealer stock in Japan</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1">2. Reserve</p>
            <p className="text-xs text-gray-500">Lock it in for $3,000 — fully refundable if we don&apos;t secure the van</p>
          </div>
          <div>
            <div className="text-2xl mb-2">📦</div>
            <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1">3. Track</p>
            <p className="text-xs text-gray-500">Follow your van from purchase to port to Brisbane</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🚐</div>
            <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1">4. Collect</p>
            <p className="text-xs text-gray-500">Pick up in Brisbane — drive it home or book a conversion</p>
          </div>
        </div>
      </div>

      {/* ── Why Bare Camper — Competitive Comparison ── */}
      <details className="mb-8 bg-white border border-gray-200 rounded-2xl overflow-hidden group">
        <summary className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h2 className="text-lg font-bold text-charcoal">Why buy through Bare Camper?</h2>
          <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium"></th>
                  <th className="py-2 px-4 text-ocean font-bold text-center">Bare Camper</th>
                  <th className="py-2 px-4 text-gray-500 font-medium text-center">Brisbane Dealer</th>
                  <th className="py-2 px-4 text-gray-500 font-medium text-center">Private Sale</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {[
                  ['Auction-graded', true, false, false],
                  ['Verified km', true, false, false],
                  ['Transparent pricing', true, false, false],
                  ['Pop-top conversion', true, false, false],
                  ['Track your purchase', true, false, false],
                  ['After-sale support', true, 'varies', false],
                ].map(([label, bc, dealer, priv], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2 pr-4 font-medium text-gray-700">{label as string}</td>
                    <td className="py-2 px-4 text-center">{bc === true ? <span className="text-green-600 font-bold">✓</span> : bc === 'varies' ? <span className="text-gray-400">varies</span> : <span className="text-gray-300">✗</span>}</td>
                    <td className="py-2 px-4 text-center">{dealer === true ? <span className="text-green-600 font-bold">✓</span> : dealer === 'varies' ? <span className="text-gray-400">varies</span> : <span className="text-gray-300">✗</span>}</td>
                    <td className="py-2 px-4 text-center">{priv === true ? <span className="text-green-600 font-bold">✓</span> : priv === 'varies' ? <span className="text-gray-400">varies</span> : <span className="text-gray-300">✗</span>}</td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200">
                  <td className="py-2 pr-4 font-medium text-gray-700">Avg saving vs dealer</td>
                  <td className="py-2 px-4 text-center text-green-700 font-bold">$3,000–$8,000</td>
                  <td className="py-2 px-4 text-center text-gray-300">—</td>
                  <td className="py-2 px-4 text-center text-gray-300">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  )
}

// ── For Sale Card ─────────────────────────────────────────────────────────────
function ForSaleCard({ vehicle }: { vehicle: ForSaleVehicle }) {
  const [showInterest, setShowInterest] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const photo = vehicle.listing?.photos?.[0] ?? null
  const label = vehicle.listing
    ? `${vehicle.listing.model_year ?? ''} ${vehicle.listing.model_name}`.trim()
    : vehicle.vehicle_description || 'Toyota HiAce'
  const stageLabel = vehicle.current_stage ? STAGE_LABELS[vehicle.current_stage] ?? vehicle.current_stage : null

  const submit = async () => {
    if (!form.email && !form.phone) return
    setSending(true)
    await fetch('/api/express-interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        customer_vehicle_id: vehicle.id,
        sale_price: vehicle.sale_price_aud,
      }),
    })
    setSending(false)
    setSent(true)
  }

  return (
    <div className="bg-white border border-amber-200 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 group">
      {/* Photo */}
      <div className="relative h-[150px] sm:h-[180px] lg:h-[220px] overflow-hidden">
        {photo ? (
          <Image src={photo} alt={label} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-amber-50 text-amber-300 text-3xl sm:text-5xl">🚐</div>
        )}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 flex-wrap">
          <span className="bg-amber-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded">{vehicle.sale_label ?? 'CONTRACT FOR SALE'}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-2 sm:p-3">
        <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{label}</p>
        {vehicle.build?.build_type && vehicle.build.build_type !== 'none' && (
          <p className="text-[10px] sm:text-xs text-amber-700 font-medium mt-0.5">{vehicle.build.build_type.toUpperCase()} Build</p>
        )}
        {stageLabel && (
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Currently: {stageLabel}</p>
        )}
        {vehicle.sale_notes && (
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-2 hidden sm:block">{vehicle.sale_notes}</p>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-amber-100">
          <span className="text-amber-700 text-sm sm:text-base font-bold">
            {vehicle.sale_price_aud ? centsToAud(vehicle.sale_price_aud) : 'POA'}
          </span>
          <button
            onClick={() => setShowInterest(true)}
            className="hidden sm:inline-flex bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-amber-600 transition-colors"
          >
            Express Interest
          </button>
        </div>
      </div>

      {/* Express Interest Modal */}
      {showInterest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowInterest(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4" onClick={e => e.stopPropagation()}>
            {sent ? (
              <div className="text-center py-4">
                <p className="text-xl text-charcoal mb-2">Thanks for your interest!</p>
                <p className="text-sm text-gray-500">We&apos;ll be in touch shortly.</p>
                <button onClick={() => setShowInterest(false)} className="mt-4 text-sm text-ocean hover:underline">Close</button>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-xl text-charcoal">Express Interest</h3>
                  <p className="text-sm text-gray-500 mt-1">{label} — {vehicle.sale_price_aud ? centsToAud(vehicle.sale_price_aud) : 'POA'}</p>
                </div>
                <div className="space-y-3">
                  <input type="text" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean" />
                  <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean" />
                  <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean" />
                  <textarea placeholder="Message (optional)" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ocean" />
                </div>
                <div className="flex gap-2">
                  <button onClick={submit} disabled={sending || (!form.email && !form.phone)} className="flex-1 bg-ocean text-white text-sm font-medium py-2 rounded-lg hover:bg-ocean disabled:opacity-50">{sending ? 'Sending...' : 'Send'}</button>
                  <button onClick={() => setShowInterest(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Listing Card ──────────────────────────────────────────────────────────────
function ListingCard({ listing, userId, initialSaved, jpyRate }: { listing: Listing; userId: string | null; initialSaved: boolean; jpyRate: number }) {
  const router = useRouter()
  const photo    = listing.photos[0] ?? null
  const spinVideo = (listing as any).spin_video as string | null
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const urgency  = listing.source === 'auction' ? auctionUrgency(listing.auction_date) : null
  const sColor   = scoreColor(listing.inspection_score)
  const locBadge = locationBadgeInfo(listing)
  const foBadge  = fitOutLevelInfo(listing.fit_out_level)
  const curBadge = curationBadgeInfo(listing.curation_badge)
  const auctionBlur = !userId && listing.source === 'auction'

  const { priceCents, isEstimate } = listingDisplayPrice(listing, jpyRate)
  const displayPrice = priceCents ? centsToAud(priceCents) : 'POA'

  // Auction countdown
  const [now, setNow] = useState(() => Date.now())
  const auctionTime = (listing as any).auction_time as string | null
  const auctionResult = (listing as any).auction_result as string | null
  const isAuctionPending = listing.source === 'auction' && (!auctionResult || auctionResult === 'pending')

  useEffect(() => {
    if (!isAuctionPending || !auctionTime) return
    const diff = new Date(auctionTime).getTime() - Date.now()
    // Only tick every second if within 24 hours
    if (diff > 0 && diff < 24 * 3600 * 1000) {
      const id = setInterval(() => setNow(Date.now()), 1000)
      return () => clearInterval(id)
    }
  }, [isAuctionPending, auctionTime])

  const countdownBadge = useMemo(() => {
    if (!isAuctionPending || !auctionTime) return null
    const diff = new Date(auctionTime).getTime() - now
    if (diff <= 0) return { text: 'Auction ended \u2014 result pending', cls: 'bg-gray-500 text-white', pulse: false }
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    if (diff < 3600000) return { text: `CLOSING IN ${m}m ${s}s`, cls: 'bg-red-600 text-white', pulse: true }
    if (diff < 24 * 3600000) return { text: `LAST CHANCE \u2014 ${h}h ${m}m ${s}s`, cls: 'bg-red-600 text-white', pulse: false }
    if (diff < 48 * 3600000) return { text: `CLOSING SOON \u2014 ${d > 0 ? d + 'd ' : ''}${h}h ${m}m`, cls: 'bg-amber-500 text-white', pulse: false }
    return { text: `Auction in ${d}d ${h}h`, cls: 'text-ocean', pulse: false }
  }, [isAuctionPending, auctionTime, now])

  // Sold / unsold badges
  const resultBadge = useMemo(() => {
    if (auctionResult === 'sold') return { text: 'SOLD', cls: 'bg-gray-500 text-white' }
    if (auctionResult === 'unsold') return { text: 'PASSED IN', cls: 'bg-amber-500 text-white' }
    if (auctionResult === 'no_sale') return { text: 'CANCELLED', cls: 'bg-gray-400 text-white' }
    return null
  }, [auctionResult])

  return (
    <Link
      href={`/van/${listing.id}`}
      className="bg-white border border-gray-100 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 group block"
      onMouseEnter={() => {
        setIsHovering(true)
        if (spinVideo && videoRef.current) {
          videoRef.current.currentTime = 0
          videoRef.current.play().catch(() => {})
        }
      }}
      onMouseLeave={() => {
        setIsHovering(false)
        if (videoRef.current) {
          videoRef.current.pause()
        }
      }}
    >
      {/* Photo / Spin Video */}
      <div className="relative h-[150px] sm:h-[180px] lg:h-[220px] overflow-hidden bg-gray-900">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={listing.model_name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${auctionBlur ? 'blur-md scale-110' : ''} ${isHovering && spinVideo ? 'opacity-0 scale-95' : 'opacity-100 group-hover:scale-105'}`}
            style={{ objectPosition: listing.image_focal_point ?? 'center' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-300 text-3xl sm:text-5xl">🚐</div>
        )}
        {/* Spin video overlay */}
        {spinVideo && (
          <video
            ref={videoRef}
            src={spinVideo}
            muted
            loop
            playsInline
            preload="metadata"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {/* Auction blur CTA */}
        {auctionBlur && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 cursor-pointer"
            style={{ background: 'rgba(15, 40, 25, 0.72)', backdropFilter: 'blur(2px)' }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); router.push('/login?next=/browse') }}
          >
            <svg className="w-7 h-7 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-white font-semibold text-sm leading-tight mb-1">Create a free account to see photos</p>
            {listing.contact_phone ? (
              <a href={`tel:${listing.contact_phone.replace(/\s/g, '')}`} onClick={e => e.stopPropagation()} className="text-sand font-semibold text-sm mt-1 hover:text-sand">
                📞 {listing.contact_phone}
              </a>
            ) : (
              <p className="text-white/70 text-xs">Free account — takes 30 seconds</p>
            )}
            <span className="mt-2 bg-white text-charcoal text-xs font-semibold px-3 py-1 rounded-full">Sign Up Free</span>
          </div>
        )}
        {/* SOLD overlay */}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.55)' }}>
            <span className="text-white font-bold text-2xl sm:text-3xl tracking-widest">SOLD</span>
          </div>
        )}
        {/* Top-left: location badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 flex-wrap max-w-[65%]">
          <span className={`${locBadge.bg} text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded`}>
            {locBadge.label}
          </span>
          {countdownBadge && (
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded ${countdownBadge.cls} ${countdownBadge.pulse ? 'animate-pulse' : ''}`}>
              {countdownBadge.text}
            </span>
          )}
          {resultBadge && (
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded ${resultBadge.cls}`}>
              {resultBadge.text}
            </span>
          )}
          {listing.featured && listing.source === 'au_stock' && (
            <span className="bg-ocean text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded">FEATURED</span>
          )}
          {listing.is_community_find && (
            <span className="bg-driftwood text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded">COMMUNITY FIND</span>
          )}
          {(listing.source === 'dealer_goonet' || listing.source === 'dealer_carsensor') && (
            <span className="text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded flex items-center gap-0.5" style={{ background: '#EB0A1E' }}>
              ✓ Toyota Verified
            </span>
          )}
        </div>
        {/* Top-right: grade + badges */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col items-end gap-0.5 sm:gap-1">
          {listing.inspection_score && (
            <div className={`score-${sColor} text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded`}>
              Grade {listing.inspection_score}
            </div>
          )}
          {listing.has_fitout && (
            <div className="text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded" style={{ background: '#92400e' }}>
              🏕 Campervan{listing.fitout_grade ? ` · ${listing.fitout_grade}` : ''}
            </div>
          )}
          {curBadge && (
            <div className={`${curBadge.bg} ${curBadge.text} text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded`}>
              {curBadge.label}
            </div>
          )}
          {listing.power_system && listing.power_system !== 'None' && (
            <div className="bg-gray-900/80 text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 rounded hidden sm:block">
              🔌 {listing.power_system === '240V Australian' ? '240V AU Ready' : '100V JP'}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2 sm:p-3">
        <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{listing.model_name}</p>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
          {[listing.model_year, listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km` : null, listing.drive, listing.engine?.match(/diesel/i) ? 'Diesel' : listing.engine?.match(/petrol|gasoline/i) ? 'Petrol' : null]
            .filter(Boolean).join(' · ')}
        </p>

        {/* Reserve / delivery subtext */}
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
          {effectiveLocation(listing) === 'in_brisbane'
            ? 'In Brisbane — drive it this weekend'
            : effectiveLocation(listing) === 'on_ship'
            ? `On the water — arriving ${listing.eta_date ? new Date(listing.eta_date).toLocaleDateString('en-AU', { month: 'long' }) : 'soon'}`
            : '$3,000 to reserve · Delivered to Brisbane in 6–8 weeks'}
        </p>

        {/* Location sub-text */}
        {locBadge.sub && (
          <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium" style={{ color: locBadge.bg.replace('bg-', '').replace('-600', '') === 'green' ? '#15803d' : locBadge.bg.replace('bg-', '').replace('-600', '') === 'orange' ? '#ea580c' : '#dc2626' }}>
            {locBadge.sub}
          </p>
        )}

        {/* Fit-out level badge */}
        {foBadge && (
          <span className={`inline-block mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded border ${foBadge.cls}`}>
            {foBadge.label}
          </span>
        )}

        {listing.source === 'au_stock' && listing.eta_date && (
          <p className="text-[10px] sm:text-xs text-ocean font-medium mt-0.5 sm:mt-1">
            ETA ~{new Date(listing.eta_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
          </p>
        )}
        {listing.source === 'auction' && listing.auction_date && (
          <p className="text-[10px] sm:text-xs text-amber-700 font-medium mt-0.5 sm:mt-1">
            Auction {new Date(listing.auction_date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-gray-100">
          <div>
            <span className="text-ocean text-sm sm:text-base font-bold">
              {displayPrice}
              {isEstimate && priceCents && <span className="text-[10px] sm:text-xs text-gray-400 font-normal ml-1">est.</span>}
            </span>
            {listing.au_market_price_low && listing.au_market_price_high && (
              <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                Similar in AU: ${Math.round(listing.au_market_price_low / 1000)}–{Math.round(listing.au_market_price_high / 1000)}K
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex btn-primary btn-sm text-xs">
                  {listing.source === 'au_stock' ? 'View & Test Drive' : listing.source === 'auction' ? 'View & Bid' : 'View & Reserve'}
                </span>
            <SaveVanButton listingId={listing.id} userId={userId} initialSaved={initialSaved} />
          </div>
        </div>
      </div>
    </Link>
  )
}
