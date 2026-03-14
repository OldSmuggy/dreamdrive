'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Listing } from '@/types'

const IMPORT_STAGES = [
  { key: 'auction_won', label: 'Auction Won / Purchase Confirmed' },
  { key: 'payment_received', label: 'Payment Received' },
  { key: 'export_docs', label: 'Export Documentation' },
  { key: 'shipped', label: 'Shipped from Japan' },
  { key: 'arrived_au', label: 'Arrived in Australia' },
  { key: 'compliance', label: 'Quarantine & Compliance' },
  { key: 'ready', label: 'Ready for Collection' },
]

type Tab = 'saved' | 'builds' | 'deposits' | 'imports'

interface SavedVanRow { id: string; listing_id: string; created_at: string; listing: Listing | null }
interface SavedBuildRow { id: string; build_config: Record<string, unknown>; total_price_min: number | null; total_price_max: number | null; created_at: string }
interface DepositHoldRow { id: string; listing_id: string; amount_aud: number; status: string; created_at: string; listing: { id: string; model_name: string; model_year: number | null; photos: string[]; source: string } | null }
interface ImportOrderRow { id: string; listing_id: string; current_stage: string; stage_dates: Record<string, string>; admin_notes: string | null; created_at: string; listing: { id: string; model_name: string; model_year: number | null; photos: string[] } | null }

interface Props {
  user: { id: string; email: string }
  profile: { first_name: string | null; last_name: string | null } | null
  savedVans: SavedVanRow[]
  builds: SavedBuildRow[]
  depositHolds: DepositHoldRow[]
  importOrders: ImportOrderRow[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  refunded: 'bg-gray-100 text-gray-500',
  converted: 'bg-forest-100 text-forest-700',
}

export default function AccountClient({ user, profile, savedVans: initialSaved, builds, depositHolds, importOrders }: Props) {
  const [tab, setTab] = useState<Tab>('saved')
  const [savedVans, setSavedVans] = useState(initialSaved)
  const [removing, setRemoving] = useState<string | null>(null)

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email

  const removeVan = async (listingId: string) => {
    setRemoving(listingId)
    setSavedVans(vs => vs.filter(v => v.listing_id !== listingId))
    await fetch('/api/saved-vans', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId }),
    })
    setRemoving(null)
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'saved', label: 'Saved Vans', count: savedVans.length },
    { key: 'builds', label: 'My Builds', count: builds.length },
    { key: 'deposits', label: 'Deposit Holds', count: depositHolds.length },
    { key: 'imports', label: 'Import Tracker', count: importOrders.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-forest-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <p className="text-white/50 text-sm mb-1">My Account</p>
          <h1 className="font-display text-3xl">{name}</h1>
          <p className="text-white/60 text-sm mt-1">{user.email}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1.5 mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 min-w-fit px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                tab === t.key ? 'bg-forest-600 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t.label}{t.count !== undefined && t.count > 0 ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {/* Tab: Saved Vans */}
        {tab === 'saved' && (
          <div>
            {savedVans.length === 0 ? (
              <EmptyState icon="🚐" title="No saved vans yet" desc="Browse our listings and tap the heart to save vans to your watchlist.">
                <Link href="/browse" className="btn-primary inline-block mt-4">Browse Vans</Link>
              </EmptyState>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedVans.map(sv => {
                  const l = sv.listing
                  if (!l) return null
                  return (
                    <div key={sv.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="relative h-44">
                        {l.photos?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.photos[0]} alt={l.model_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">🚐</div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-gray-900 text-sm">{l.model_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[l.model_year, l.mileage_km ? `${l.mileage_km.toLocaleString()} km` : null].filter(Boolean).join(' · ')}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Link href={`/van/${l.id}`} className="btn-primary btn-sm flex-1 text-center text-xs">View &amp; Build</Link>
                          <button
                            onClick={() => removeVan(sv.listing_id)}
                            disabled={removing === sv.listing_id}
                            className="btn-secondary btn-sm text-xs disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: My Builds */}
        {tab === 'builds' && (
          <div>
            {builds.length === 0 ? (
              <EmptyState icon="🔧" title="No builds saved yet" desc="Use the Build configurator to design your van setup, then save it to come back later.">
                <Link href="/browse" className="btn-primary inline-block mt-4">Start Building</Link>
              </EmptyState>
            ) : (
              <div className="space-y-4">
                {builds.map(b => (
                  <div key={b.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Saved Build</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {b.total_price_min && b.total_price_max
                            ? `$${(b.total_price_min / 100).toLocaleString()} – $${(b.total_price_max / 100).toLocaleString()} AUD est.`
                            : 'Price estimate unavailable'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(b.created_at).toLocaleDateString('en-AU')}</p>
                      </div>
                      <Link href="/build" className="btn-secondary btn-sm text-xs">Continue Building</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Deposit Holds */}
        {tab === 'deposits' && (
          <div>
            {depositHolds.length === 0 ? (
              <EmptyState icon="💰" title="No deposit holds placed yet" desc="Place a $500 refundable deposit to hold any van for up to 7 days.">
                <Link href="/browse" className="btn-primary inline-block mt-4">Browse Vans</Link>
              </EmptyState>
            ) : (
              <div className="space-y-4">
                {depositHolds.map(d => (
                  <div key={d.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {d.listing?.photos?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.listing.photos[0]} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {d.listing ? `${d.listing.model_year ?? ''} ${d.listing.model_name}` : d.listing_id}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">${d.amount_aud} AUD · {new Date(d.created_at).toLocaleDateString('en-AU')}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 capitalize ${statusColors[d.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {d.status}
                      </span>
                    </div>
                    {d.status === 'active' || d.status === 'pending' ? (
                      <p className="mt-3 text-xs text-gray-500">
                        To request a refund, email{' '}
                        <a href="mailto:jared@dreamdrive.life" className="text-forest-600 hover:underline">jared@dreamdrive.life</a>
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Import Tracker */}
        {tab === 'imports' && (
          <div>
            {importOrders.length === 0 ? (
              <EmptyState icon="🚢" title="No active imports" desc="Contact us to get started with your van import.">
                <a href="mailto:hello@dreamdrive.life" className="btn-primary inline-block mt-4">Contact Us</a>
              </EmptyState>
            ) : (
              <div className="space-y-6">
                {importOrders.map(order => {
                  const currentIdx = IMPORT_STAGES.findIndex(s => s.key === order.current_stage)
                  return (
                    <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        {order.listing?.photos?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={order.listing.photos[0]} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.listing ? `${order.listing.model_year ?? ''} ${order.listing.model_name}` : 'Your Van'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Import started {new Date(order.created_at).toLocaleDateString('en-AU')}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {IMPORT_STAGES.map((stage, idx) => {
                          const done = idx < currentIdx
                          const active = idx === currentIdx
                          const date = order.stage_dates?.[stage.key]
                          return (
                            <div key={stage.key} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                done ? 'bg-forest-600 border-forest-600' : active ? 'border-forest-600 bg-forest-50' : 'border-gray-300 bg-white'
                              }`}>
                                {done ? (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : active ? (
                                  <div className="w-2 h-2 rounded-full bg-forest-600" />
                                ) : null}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm ${active ? 'font-semibold text-forest-800' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {stage.label}
                                </p>
                                {date && <p className="text-xs text-gray-400">{new Date(date).toLocaleDateString('en-AU')}</p>}
                              </div>
                              {active && <span className="text-xs bg-forest-100 text-forest-700 font-semibold px-2 py-0.5 rounded-full">Current</span>}
                            </div>
                          )
                        })}
                      </div>
                      {order.admin_notes && (
                        <div className="mt-4 bg-sand-50 rounded-xl p-3 text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Note: </span>{order.admin_notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, desc, children }: { icon: string; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display text-xl text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">{desc}</p>
      {children}
    </div>
  )
}
