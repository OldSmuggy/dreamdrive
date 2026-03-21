'use client'

import { useState } from 'react'
import Link from 'next/link'
import { centsToAud, scoreLabel, scoreColor, sourceBadgeColor, sourceLabel } from '@/lib/utils'
import type { Listing, Product } from '@/types'

// ── Stage definitions ─────────────────────────────────────────────────────────

interface StageInfo { label: string; desc: string; next?: string; isFinal?: boolean }

const STAGE_META: Record<string, StageInfo> = {
  order_confirmed:      { label: 'Order Confirmed',         desc: 'Your order has been received and your deposit is holding your build slot.',          next: 'Our team will contact you within 1 business day to confirm your build specifications.' },
  scheduled_for_build:  { label: 'Scheduled for Build',     desc: 'Your build has been scheduled at our Tokyo facility.',                               next: 'Our team will be in touch with your estimated build start date.' },
  vehicle_sourced:      { label: 'Vehicle Sourced',         desc: 'Your base Toyota HiAce has been sourced and is ready for conversion.',                next: 'Your van will shortly begin the conversion process.' },
  fitout_in_progress:   { label: 'Fit-Out in Progress',     desc: 'Our craftsmen are building your custom fit-out in our Tokyo workshop.',              next: "We'll send progress updates as your build takes shape." },
  quality_check:        { label: 'Quality Check & Photos',  desc: 'Your build is complete and undergoing final quality inspection.',                    next: 'Final photos will be shared with you shortly.' },
  shipping:             { label: 'Shipping to Australia',   desc: 'Your van has left Japan and is on its way to Australia.',                            next: "Estimated arrival depends on vessel schedule — we'll keep you updated." },
  arrived_processing:   { label: 'Arrived & Processing',    desc: 'Your van has arrived in Australia and is going through quarantine and compliance.',   next: 'Compliance typically takes 2–3 weeks. We\'ll notify you when complete.' },
  pop_top_install:      { label: 'Pop Top Installation',    desc: 'Your van is at our Capalaba workshop for pop top installation.',                     next: 'Pop top installation typically takes 3–5 business days.' },
  ready_for_handover:   { label: 'Ready for Handover! 🎉',  desc: 'Your van is ready and waiting for you. Time to start your adventure!',               isFinal: true },
  // Legacy keys
  auction_won:          { label: 'Purchase Confirmed',      desc: 'Your van purchase has been confirmed.' },
  payment_received:     { label: 'Payment Received',        desc: 'Your payment has been received.' },
  export_docs:          { label: 'Export Documentation',    desc: 'Export documentation is being prepared.' },
  shipped:              { label: 'Shipped from Japan',      desc: 'Your van is on its way to Australia.' },
  arrived_au:           { label: 'Arrived in Australia',    desc: 'Your van has arrived in Australia.' },
  compliance:           { label: 'Quarantine & Compliance', desc: 'Your van is going through quarantine and compliance.' },
  ready:                { label: 'Ready for Collection',    desc: 'Your van is ready for collection!', isFinal: true },
}

const FLOW_VAN_FITOUT = ['order_confirmed','scheduled_for_build','vehicle_sourced','fitout_in_progress','quality_check','shipping','arrived_processing','pop_top_install','ready_for_handover']
const FLOW_VAN_ONLY   = ['order_confirmed','vehicle_sourced','shipping','arrived_processing','pop_top_install','ready_for_handover']
const FLOW_LEGACY     = ['auction_won','payment_received','export_docs','shipped','arrived_au','compliance','ready']

function getStageFlow(order: ImportOrderRow): string[] {
  if (FLOW_LEGACY.includes(order.current_stage)) return FLOW_LEGACY
  return order.order_type === 'van_only' ? FLOW_VAN_ONLY : FLOW_VAN_FITOUT
}

// ── 4-stage visual mapping ────────────────────────────────────────────────────
const MAIN_STAGES = [
  {
    num: 1,
    title: 'Exporting from Japan',
    subStages: ['order_confirmed','scheduled_for_build','vehicle_sourced','fitout_in_progress','quality_check','auction_won','payment_received','export_docs'],
    currentSubLabel: (key: string) =>
      ({ order_confirmed: 'Purchase Confirmed', scheduled_for_build: 'Export Documentation',
         vehicle_sourced: 'Loaded for Shipping', fitout_in_progress: 'Build in Progress',
         quality_check: 'Quality Check', auction_won: 'Purchase Confirmed',
         payment_received: 'Export Documentation', export_docs: 'Loaded for Shipping' }[key] ?? key),
  },
  {
    num: 2,
    title: 'On the Ship',
    subStages: ['shipping','shipped'],
    currentSubLabel: () => 'En Route to Australia',
  },
  {
    num: 3,
    title: 'Compliance & Fit-Out',
    subStages: ['arrived_processing','pop_top_install','arrived_au','compliance'],
    currentSubLabel: (key: string) =>
      ({ arrived_processing: 'Quarantine Clearance', pop_top_install: 'Pop Top Install',
         arrived_au: 'Compliance', compliance: 'Compliance' }[key] ?? key),
  },
  {
    num: 4,
    title: 'Delivery',
    subStages: ['ready_for_handover','ready_for_collection','ready'],
    currentSubLabel: () => 'Ready for Collection',
  },
]

function getMainStageIdx(stageKey: string): number {
  for (let i = 0; i < MAIN_STAGES.length; i++) {
    if (MAIN_STAGES[i].subStages.includes(stageKey)) return i
  }
  return 0
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'saved' | 'builds' | 'deposits' | 'imports'

interface SavedVanRow { id: string; listing_id: string; created_at: string; listing: Listing | null }

interface BuildRow {
  id: string; share_slug: string; listing_id: string | null
  fitout_product_id: string | null; elec_product_id: string | null; poptop_product_id: string | null
  total_aud_min: number | null; total_aud_max: number | null; created_at: string
  listing: { id: string; model_name: string; model_year: number | null; mileage_km: number | null; drive: string | null; photos: string[]; source: string; inspection_score: string | null; aud_estimate: number | null; au_price_aud: number | null } | null
}

interface DepositHoldRow {
  id: string; listing_id: string; amount_aud: number; status: string; created_at: string
  listing: { id: string; model_name: string; model_year: number | null; photos: string[]; source: string } | null
}

interface ImportOrderRow {
  id: string; listing_id: string; current_stage: string; order_type?: string
  stage_dates: Record<string, string>; admin_notes: string | null
  stage_notes?: Record<string, string>; progress_photos?: string[]
  created_at: string
  listing: { id: string; model_name: string; model_year: number | null; photos: string[] } | null
}

interface InvoiceRow {
  id: string; import_order_id: string | null; invoice_number: string
  description: string | null; amount_aud: number
  issue_date: string | null; due_date: string | null
  status: 'due' | 'paid' | 'overdue'; created_at: string
}

interface PaymentRow {
  id: string; import_order_id: string | null; amount_aud: number
  description: string | null; payment_method: string | null
  payment_date: string | null; status: string; created_at: string
}

interface Props {
  user: { id: string; email: string }
  profile: { first_name: string | null; last_name: string | null } | null
  savedVans: SavedVanRow[]
  builds: BuildRow[]
  depositHolds: DepositHoldRow[]
  importOrders: ImportOrderRow[]
  products: Product[]
  invoices: unknown[]
  payments: unknown[]
  jpyRate: number
}

const depositStatusStyle: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  refunded: 'bg-gray-100 text-gray-500',
  converted: 'bg-cream text-ocean',
}

const invoiceStatusStyle: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  due: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AccountClient({
  user, profile, savedVans: initialSaved, builds, depositHolds,
  importOrders, products, invoices: rawInvoices, payments: rawPayments, jpyRate,
}: Props) {
  const [tab, setTab]               = useState<Tab>('saved')
  const [savedVans, setSavedVans]   = useState(initialSaved)
  const [removing, setRemoving]     = useState<string | null>(null)

  const invoices = rawInvoices as InvoiceRow[]
  const payments = rawPayments as PaymentRow[]
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email
  const productById = (id: string | null) => id ? products.find(p => p.id === id) ?? null : null

  const removeVan = async (listingId: string) => {
    setRemoving(listingId)
    setSavedVans(vs => vs.filter(v => v.listing_id !== listingId))
    await fetch('/api/saved-vans', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listing_id: listingId }) })
    setRemoving(null)
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'saved',    label: 'Saved Vans',     count: savedVans.length },
    { key: 'builds',   label: 'My Builds',      count: builds.length },
    { key: 'deposits', label: 'Deposit Holds',  count: depositHolds.length },
    { key: 'imports',  label: 'Track My Order', count: importOrders.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-charcoal text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <p className="text-white/50 text-sm mb-1">My Account</p>
          <h1 className="text-3xl">{name}</h1>
          <p className="text-white/60 text-sm mt-1">{user.email}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1.5 mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 min-w-fit px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${tab === t.key ? 'bg-ocean text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
              {t.label}{t.count ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {/* ── SAVED VANS ── */}
        {tab === 'saved' && (
          savedVans.length === 0 ? (
            <EmptyState icon="🚐" title="No saved vans yet" desc="Browse our listings and tap the heart icon to save vans to your watchlist.">
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
                      {l.photos?.[0]
                        ? <img src={l.photos[0]} alt={l.model_name} className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                        : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">🚐</div>}
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 text-sm">{l.model_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {[l.model_year, l.mileage_km ? `${l.mileage_km.toLocaleString()} km` : null].filter(Boolean).join(' · ')}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Link href={`/van/${l.id}`} className="btn-primary btn-sm flex-1 text-center text-xs">View &amp; Build</Link>
                        <button onClick={() => removeVan(sv.listing_id)} disabled={removing === sv.listing_id} className="btn-secondary btn-sm text-xs disabled:opacity-50">Remove</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── MY BUILDS ── */}
        {tab === 'builds' && (
          builds.length === 0 ? (
            <EmptyState icon={<VanOutlineSvg />} title="No saved builds yet" desc='Start by browsing vans and clicking "Build This Van" to design your perfect setup.'>
              <Link href="/browse" className="btn-primary inline-block mt-4">Browse Vans</Link>
            </EmptyState>
          ) : (
            <div className="space-y-5">
              {builds.map(b => {
                const fitout = productById(b.fitout_product_id)
                const elec   = productById(b.elec_product_id)
                const poptop = productById(b.poptop_product_id)
                const l      = b.listing
                const vanAud = l ? (l.au_price_aud ?? l.aud_estimate ?? 0) : 0
                const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/build/${b.share_slug}` : `/build/${b.share_slug}`
                return (
                  <div key={b.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-20 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {l?.photos?.[0]
                            ? <img src={l.photos[0]} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                            : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🚐</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          {l ? (
                            <>
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <p className="font-semibold text-gray-900 text-sm">{l.model_name}</p>
                                <span className={`${sourceBadgeColor(l.source)} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>{sourceLabel(l.source)}</span>
                              </div>
                              <p className="text-xs text-gray-500">{[l.model_year, l.mileage_km ? `${l.mileage_km.toLocaleString()} km` : null, l.drive].filter(Boolean).join(' · ')}</p>
                              {l.inspection_score && (
                                <span className={`inline-block mt-1 score-${scoreColor(l.inspection_score as Parameters<typeof scoreColor>[0])} text-xs font-semibold px-1.5 py-0.5 rounded`}>
                                  Grade {l.inspection_score} — {scoreLabel(l.inspection_score as Parameters<typeof scoreLabel>[0])}
                                </span>
                              )}
                            </>
                          ) : <p className="text-gray-400 text-sm italic">No van selected yet</p>}
                        </div>
                        <p className="text-xs text-gray-400 shrink-0">{new Date(b.created_at).toLocaleDateString('en-AU')}</p>
                      </div>

                      <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
                        {l && vanAud > 0 && <BuildLine label="Base van" aud={vanAud} note="auction/dealer estimate" />}
                        {fitout  && <BuildLine label={`Fit-out: ${fitout.name}`}  aud={fitout.rrp_aud}  jpyRate={jpyRate} />}
                        {elec    && <BuildLine label={`Electrical: ${elec.name}`} aud={elec.rrp_aud} />}
                        {poptop  && <BuildLine label="Pop Top Conversion" aud={poptop.rrp_aud} />}
                        {!fitout && !elec && !poptop && <div className="px-4 py-3 text-sm text-gray-400 text-center italic">No fit-out or extras added</div>}
                        {(b.total_aud_min || b.total_aud_max) && (
                          <div className="bg-cream px-4 py-3 flex justify-between items-center border-t border-cream">
                            <span className="font-semibold text-charcoal text-sm">Estimated total</span>
                            <span className="text-ocean">
                              {b.total_aud_min && b.total_aud_max && b.total_aud_min !== b.total_aud_max
                                ? `${centsToAud(b.total_aud_min)} – ${centsToAud(b.total_aud_max)}`
                                : centsToAud(b.total_aud_min ?? b.total_aud_max ?? 0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mb-4">Van price is an estimate based on current auction prices. Fit-out price is fixed. Final total confirmed at consultation.</p>

                      <div className="flex flex-wrap gap-2">
                        <Link href={`/build${b.listing_id ? `?listing=${b.listing_id}` : ''}`} className="btn-primary btn-sm text-xs">Continue Building →</Link>
                        <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Shareable link copied!') }} className="btn-secondary btn-sm text-xs">Share Build</button>
                      </div>
                      <button onClick={async () => { if (!confirm('Delete this saved build?')) return; await fetch(`/api/builds/${b.id}`, { method: 'DELETE' }); window.location.reload() }}
                        className="mt-3 text-xs text-gray-400 hover:text-red-500 underline block">Delete build</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── DEPOSIT HOLDS ── */}
        {tab === 'deposits' && (
          depositHolds.length === 0 ? (
            <EmptyState icon="💰" title="No deposit holds yet" desc="Place a $3,000 refundable deposit to hold any van for up to 7 days.">
              <Link href="/browse" className="btn-primary inline-block mt-4">Browse Vans</Link>
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {depositHolds.map(d => (
                <div key={d.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {d.listing?.photos?.[0] && <img src={d.listing.photos[0]} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />} {/* eslint-disable-line @next/next/no-img-element */}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{d.listing ? `${d.listing.model_year ?? ''} ${d.listing.model_name}` : d.listing_id}</p>
                        <p className="text-xs text-gray-500 mt-0.5">${(d.amount_aud / 100).toLocaleString()} AUD · {new Date(d.created_at).toLocaleDateString('en-AU')}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 capitalize ${depositStatusStyle[d.status] ?? 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                  </div>
                  {(d.status === 'active' || d.status === 'pending') && (
                    <p className="mt-3 text-xs text-gray-500">To request a refund, email <a href="mailto:jared@dreamdrive.life" className="text-ocean hover:underline">jared@dreamdrive.life</a></p>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* ── IMPORT TRACKER ── */}
        {tab === 'imports' && (
          importOrders.length === 0 ? (
            <EmptyState icon="🚢" title="No active orders" desc="Contact us to begin your van import journey.">
              <a href="mailto:hello@dreamdrive.life" className="btn-primary inline-block mt-4">Contact Us</a>
            </EmptyState>
          ) : (
            <div className="space-y-8">
              {importOrders.map(order => {
                const stages     = getStageFlow(order)
                const currentIdx = stages.indexOf(order.current_stage)
                const resolvedIdx = currentIdx === -1 ? 0 : currentIdx
                const pct        = Math.round(((resolvedIdx + 1) / stages.length) * 100)
                const isFinal    = STAGE_META[order.current_stage]?.isFinal ?? false
                const orderInvoices = invoices.filter(inv => inv.import_order_id === order.id)
                const orderPayments = payments.filter(pay => pay.import_order_id === order.id)

                return (
                  <div key={order.id}>
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      {/* Header */}
                      <div className="bg-charcoal px-6 py-5 flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-white/10 shrink-0">
                          {order.listing?.photos?.[0]
                            ? <img src={order.listing.photos[0]} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                            : <div className="w-full h-full flex items-center justify-center text-white/30 text-xl">🚐</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-lg leading-tight">
                            {order.listing ? `${order.listing.model_year ?? ''} ${order.listing.model_name}` : 'Your Van'}
                          </p>
                          <p className="text-white/50 text-xs mt-0.5">Order started {new Date(order.created_at).toLocaleDateString('en-AU')}</p>
                        </div>
                        {isFinal && <span className="text-2xl shrink-0">🎉</span>}
                      </div>

                        {/* ── 4-stage visual ── */}
                      <div className="px-6 py-6">
                        <div className="relative flex justify-between items-start">
                          {/* Connecting line behind circles */}
                          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" style={{ margin: '0 2.5rem' }} />
                          <div
                            className="absolute top-5 left-0 h-0.5 bg-ocean z-0 transition-all duration-700"
                            style={{ margin: '0 2.5rem', width: `calc(${Math.max(0, getMainStageIdx(order.current_stage)) / (MAIN_STAGES.length - 1) * 100}% - 0px)` }}
                          />
                          {MAIN_STAGES.map((ms, mi) => {
                            const activeMainIdx = getMainStageIdx(order.current_stage)
                            const isDone   = mi < activeMainIdx
                            const isActive = mi === activeMainIdx
                            const subLabel = isActive ? ms.currentSubLabel(order.current_stage) : null
                            return (
                              <div key={ms.num} className="flex flex-col items-center z-10 flex-1 px-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all mb-2 ${
                                  isDone   ? 'bg-ocean text-white' :
                                  isActive ? 'bg-ocean text-white ring-4 ring-cream' :
                                             'bg-white border-2 border-gray-200 text-gray-300'
                                }`}>
                                  {isDone ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                  ) : isActive ? (
                                    <span className="relative flex items-center justify-center">
                                      {ms.num}
                                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sand rounded-full animate-pulse" />
                                    </span>
                                  ) : ms.num}
                                </div>
                                <p className={`text-xs font-semibold text-center leading-tight ${isActive ? 'text-charcoal' : isDone ? 'text-gray-600' : 'text-gray-300'}`}>
                                  {ms.title}
                                </p>
                                {subLabel && (
                                  <span className="mt-1 bg-cream text-ocean text-[10px] font-bold px-1.5 py-0.5 rounded-full text-center leading-tight">
                                    {subLabel}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Current stage detail */}
                        {!isFinal && (() => {
                          const meta = STAGE_META[order.current_stage]
                          return meta ? (
                            <div className="mt-6 bg-cream border border-ocean-light rounded-xl px-4 py-3">
                              <p className="text-sm font-semibold text-charcoal">{meta.label}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{meta.desc}</p>
                              {meta.next && <p className="text-xs text-ocean mt-1 font-medium">{meta.next}</p>}
                            </div>
                          ) : null
                        })()}

                        {/* Stage notes from admin */}
                        {order.stage_notes?.[order.current_stage] && (
                          <div className="mt-3 bg-cream border border-sand rounded-xl px-4 py-3 text-xs text-gray-700">
                            <span className="font-semibold">Note from Dream Drive: </span>
                            {order.stage_notes[order.current_stage]}
                          </div>
                        )}
                        {order.admin_notes && !order.stage_notes && (
                          <div className="mt-3 bg-cream border border-sand rounded-xl px-4 py-3 text-sm text-gray-700">
                            <span className="font-semibold text-gray-800">Message from Dream Drive: </span>{order.admin_notes}
                          </div>
                        )}

                        {/* Progress photos */}
                        {(order.progress_photos ?? []).length > 0 && (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {(order.progress_photos ?? []).map((ph, pi) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={pi} src={ph} alt={`Progress ${pi + 1}`} className="w-20 h-14 object-cover rounded-lg border border-gray-200" />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Handover celebration */}
                      {isFinal && (
                        <div className="mx-6 mb-6 bg-ocean rounded-xl px-5 py-5 text-center">
                          <p className="text-white text-2xl mb-1">Your adventure starts now! 🚐</p>
                          <p className="text-white/70 text-sm mb-4">Contact us to arrange your handover date and location.</p>
                          <a href="tel:0432182892" className="inline-block bg-sand text-charcoal font-semibold px-8 py-2.5 rounded-xl hover:bg-sand transition-colors text-sm">
                            Call Jared — 0432 182 892
                          </a>
                        </div>
                      )}

                      {/* Ask a Question */}
                      {!isFinal && <OrderQuestion orderId={order.id} />}
                    </div>

                    {/* Invoices & Payments */}
                    {(orderInvoices.length > 0 || orderPayments.length > 0) && (
                      <div className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-900 text-sm">Invoices &amp; Payments</h3>
                        </div>

                        {orderInvoices.length > 0 && (
                          <div className="px-6 py-4 border-b border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Invoices</p>
                            <div className="space-y-3">
                              {orderInvoices.map(inv => (
                                <div key={inv.id} className="flex items-center justify-between gap-4 py-1">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{inv.invoice_number}</p>
                                    {inv.description && <p className="text-xs text-gray-500 truncate">{inv.description}</p>}
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {inv.issue_date && `Issued ${new Date(inv.issue_date).toLocaleDateString('en-AU')}`}
                                      {inv.due_date && ` · Due ${new Date(inv.due_date).toLocaleDateString('en-AU')}`}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-semibold text-gray-900 text-sm">${(inv.amount_aud / 100).toLocaleString()} AUD</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${invoiceStatusStyle[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                                    <button onClick={() => alert('For invoice copy, contact jared@dreamdrive.life')} className="text-xs text-ocean hover:underline">Download</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {orderPayments.length > 0 && (
                          <div className="px-6 py-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Payment History</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="text-gray-400 border-b border-gray-100">
                                    <th className="pb-2 font-semibold">Date</th>
                                    <th className="pb-2 font-semibold">Description</th>
                                    <th className="pb-2 font-semibold text-right">Amount</th>
                                    <th className="pb-2 font-semibold">Method</th>
                                    <th className="pb-2 font-semibold">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {orderPayments.map(pay => (
                                    <tr key={pay.id} className="border-b border-gray-50 last:border-0">
                                      <td className="py-2 text-gray-600">{pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('en-AU') : '—'}</td>
                                      <td className="py-2 text-gray-600 max-w-[160px] truncate">{pay.description ?? '—'}</td>
                                      <td className="py-2 text-gray-900 font-semibold text-right">${(pay.amount_aud / 100).toLocaleString()}</td>
                                      <td className="py-2 text-gray-600">{pay.payment_method ?? '—'}</td>
                                      <td className="py-2"><span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-semibold capitalize">{pay.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ── Ask a Question component ─────────────────────────────────────────────────
function OrderQuestion({ orderId }: { orderId: string }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const handleSend = async () => {
    if (!text.trim()) return
    setSending(true); setErr('')
    try {
      const res = await fetch('/api/orders/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ import_order_id: orderId, message: text.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Send failed')
      setSent(true); setText('')
    } catch (e) {
      setErr(String(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-6 mb-6 border-t border-gray-100 pt-5">
      <p className="text-sm font-semibold text-gray-700 mb-2">Ask a Question</p>
      {sent ? (
        <p className="text-sm text-ocean font-medium bg-cream border border-ocean-light rounded-xl px-4 py-3">
          ✓ Question sent — we&apos;ll reply within 1 business day.
        </p>
      ) : (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Ask a question about your build..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ocean"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{text.length}/500</span>
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              className="btn-primary btn-sm text-xs disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Question'}
            </button>
          </div>
          {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
        </>
      )}
    </div>
  )
}

function BuildLine({ label, aud, jpyRate, note }: { label: string; aud: number; jpyRate?: number; note?: string }) {
  const jpy = jpyRate && aud > 0 ? Math.round(aud / 100 / jpyRate / 1000) * 1000 : null
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <span className="text-sm text-gray-700">{label}</span>
        {jpy && <span className="text-xs text-gray-400 ml-1.5">(approx. ¥{jpy.toLocaleString('en-AU')} JPY)</span>}
        {note && <span className="text-xs text-gray-400 ml-1">— {note}</span>}
      </div>
      <span className="text-sm font-semibold text-gray-900 shrink-0">{aud > 0 ? centsToAud(aud) : '—'}</span>
    </div>
  )
}

function EmptyState({ icon, title, desc, children }: { icon: string | React.ReactNode; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4">
        {typeof icon === 'string' ? <span className="text-5xl">{icon}</span> : icon}
      </div>
      <h3 className="text-xl text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">{desc}</p>
      {children}
    </div>
  )
}

function VanOutlineSvg() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
      <rect x="4" y="12" width="58" height="32" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <rect x="62" y="20" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <circle cx="16" cy="46" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <circle cx="50" cy="46" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <rect x="10" y="16" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="34" y="16" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  )
}
