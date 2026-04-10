'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DealStatus } from '@/types'

interface DealDetail {
  id: string
  listing_id: string
  customer_id: string
  buyer_id: string
  customer_vehicle_id: string | null
  status: DealStatus
  notes: string | null
  admin_notes: string | null
  purchase_price_jpy: number | null
  purchase_price_aud: number | null
  created_at: string
  updated_at: string
  listing: {
    id: string
    model_name: string
    model_year: number | null
    grade: string | null
    mileage_km: number | null
    photos: string[]
    status: string
    transmission: string | null
    drive: string | null
    displacement_cc: number | null
    body_colour: string | null
    inspection_score: string | null
    start_price_jpy: number | null
    kaijo_code: string | null
    auction_date: string | null
  } | null
  customer: {
    id: string
    first_name: string
    last_name: string | null
    email: string | null
    phone: string | null
    state: string | null
  } | null
  buyer: {
    id: string
    name: string
    email: string
    phone: string | null
    whatsapp_number: string | null
    company: string | null
    region: string | null
    is_active: boolean
  } | null
}

const STATUS_BADGE: Record<DealStatus, string> = {
  draft:             'bg-gray-100 text-gray-600',
  deposit_pending:   'bg-amber-100 text-amber-700',
  deposit_received:  'bg-amber-100 text-amber-700',
  bidding:           'bg-blue-100 text-blue-700',
  won:               'bg-emerald-100 text-emerald-700',
  lost:              'bg-red-100 text-red-700',
  shipping:          'bg-cyan-100 text-cyan-700',
  delivered:         'bg-green-100 text-green-700',
  completed:         'bg-green-100 text-green-700',
  cancelled:         'bg-gray-100 text-gray-500',
}

const STATUS_LABEL: Record<DealStatus, string> = {
  draft:             'Draft',
  deposit_pending:   'Deposit Pending',
  deposit_received:  'Deposit Received',
  bidding:           'Bidding',
  won:               'Won',
  lost:              'Lost',
  shipping:          'Shipping',
  delivered:         'Delivered',
  completed:         'Completed',
  cancelled:         'Cancelled',
}

const ALL_STATUSES: DealStatus[] = [
  'draft', 'deposit_pending', 'deposit_received', 'bidding',
  'won', 'lost', 'shipping', 'delivered', 'completed', 'cancelled',
]

// Timeline stages in order
const TIMELINE_STAGES: { status: DealStatus; label: string; icon: string }[] = [
  { status: 'draft',             label: 'Deal Created',     icon: '📝' },
  { status: 'deposit_pending',   label: 'Deposit Pending',  icon: '💳' },
  { status: 'deposit_received',  label: 'Deposit Received', icon: '✅' },
  { status: 'bidding',           label: 'Bidding',          icon: '🏷️' },
  { status: 'won',               label: 'Won at Auction',   icon: '🎉' },
  { status: 'shipping',          label: 'Shipping',         icon: '🚢' },
  { status: 'delivered',         label: 'Delivered',        icon: '📦' },
  { status: 'completed',         label: 'Completed',        icon: '🏁' },
]

function whatsappUrl(phone: string | null | undefined, message: string) {
  if (!phone) return null
  const clean = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

function formatJpy(val: number | null) {
  if (!val) return '—'
  return `¥${val.toLocaleString('en-AU')}`
}

function formatAud(val: number | null) {
  if (!val) return '—'
  return `$${(val / 100).toLocaleString('en-AU', { minimumFractionDigits: 0 })}`
}

export default function DealDetailClient({ deal: initial }: { deal: DealDetail }) {
  const [deal, setDeal] = useState(initial)
  const [newStatus, setNewStatus] = useState<DealStatus>(deal.status)
  const [statusNotes, setStatusNotes] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [notes, setNotes] = useState(deal.notes ?? '')
  const [adminNotes, setAdminNotes] = useState(deal.admin_notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [priceJpy, setPriceJpy] = useState(deal.purchase_price_jpy?.toString() ?? '')
  const [priceAud, setPriceAud] = useState(deal.purchase_price_aud ? (deal.purchase_price_aud / 100).toString() : '')
  const [savingPrices, setSavingPrices] = useState(false)

  const vanTitle = deal.listing
    ? `${deal.listing.model_year ?? ''} ${deal.listing.model_name}${deal.listing.grade ? ` ${deal.listing.grade}` : ''}`
    : 'Unknown Van'

  const customerName = deal.customer
    ? `${deal.customer.first_name} ${deal.customer.last_name ?? ''}`.trim()
    : 'Unknown'

  const customerWa = whatsappUrl(
    deal.customer?.phone,
    `G'day ${deal.customer?.first_name ?? ''}! Quick update on your ${deal.listing?.model_name ?? 'van'}...`
  )

  const buyerWa = whatsappUrl(
    deal.buyer?.whatsapp_number || deal.buyer?.phone,
    `Hi ${deal.buyer?.name?.split(' ')[0] ?? ''}, update on ${deal.listing?.model_name ?? 'the van'} for customer ${deal.customer?.first_name ?? ''}...`
  )

  // Determine timeline progress
  const currentIdx = TIMELINE_STAGES.findIndex(s => s.status === deal.status)
  const isTerminal = deal.status === 'lost' || deal.status === 'cancelled'

  const handleStatusUpdate = async () => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/deals/${deal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: statusNotes || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to update')
        return
      }
      setDeal(prev => ({ ...prev, status: newStatus }))
      setStatusNotes('')
    } catch (e) {
      alert(String(e))
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/admin/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, admin_notes: adminNotes }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to save')
        return
      }
      setDeal(prev => ({ ...prev, notes, admin_notes: adminNotes }))
    } catch (e) {
      alert(String(e))
    } finally {
      setSavingNotes(false)
    }
  }

  const handleSavePrices = async () => {
    setSavingPrices(true)
    try {
      const res = await fetch(`/api/admin/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase_price_jpy: priceJpy ? parseInt(priceJpy) : null,
          purchase_price_aud: priceAud ? Math.round(parseFloat(priceAud) * 100) : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to save')
        return
      }
    } catch (e) {
      alert(String(e))
    } finally {
      setSavingPrices(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/deals" className="text-gray-400 hover:text-charcoal text-sm">
          ← Deals
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl text-charcoal">{vanTitle}</h1>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[deal.status]}`}>
          {STATUS_LABEL[deal.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Van card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Vehicle</h2>
            <div className="flex gap-4">
              {deal.listing?.photos?.[0] ? (
                <img
                  src={deal.listing.photos[0]}
                  alt={vanTitle}
                  className="w-32 h-24 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="w-32 h-24 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-gray-300 text-2xl">
                  🚐
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-charcoal text-lg">{vanTitle}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
                  {deal.listing?.mileage_km && (
                    <p className="text-gray-500">
                      <span className="text-gray-400">Mileage:</span> {deal.listing.mileage_km.toLocaleString()} km
                    </p>
                  )}
                  {deal.listing?.transmission && (
                    <p className="text-gray-500">
                      <span className="text-gray-400">Trans:</span> {deal.listing.transmission}
                    </p>
                  )}
                  {deal.listing?.inspection_score && (
                    <p className="text-gray-500">
                      <span className="text-gray-400">Score:</span> {deal.listing.inspection_score}
                    </p>
                  )}
                  {deal.listing?.body_colour && (
                    <p className="text-gray-500">
                      <span className="text-gray-400">Colour:</span> {deal.listing.body_colour}
                    </p>
                  )}
                  {deal.listing?.kaijo_code && (
                    <p className="text-gray-500">
                      <span className="text-gray-400">Auction:</span> {deal.listing.kaijo_code}
                    </p>
                  )}
                  {deal.listing?.start_price_jpy && (
                    <p className="text-gray-500">
                      <span className="text-gray-400">Start:</span> {formatJpy(deal.listing.start_price_jpy)}
                    </p>
                  )}
                </div>
                {deal.listing && (
                  <Link
                    href={`/admin/listings`}
                    className="text-ocean text-xs hover:underline mt-2 inline-block"
                  >
                    View listing →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Customer + Buyer cards side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</h2>
              <p className="font-semibold text-charcoal">{customerName}</p>
              {deal.customer?.email && (
                <p className="text-sm text-gray-500 mt-1">{deal.customer.email}</p>
              )}
              {deal.customer?.phone && (
                <p className="text-sm text-gray-500">{deal.customer.phone}</p>
              )}
              {deal.customer?.state && (
                <p className="text-sm text-gray-400 mt-1">{deal.customer.state}</p>
              )}
              {customerWa && (
                <a
                  href={customerWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>

            {/* Buyer card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Buyer</h2>
              <p className="font-semibold text-charcoal">{deal.buyer?.name ?? 'Unknown'}</p>
              {deal.buyer?.company && (
                <p className="text-sm text-gray-500 mt-1">{deal.buyer.company}</p>
              )}
              {deal.buyer?.email && (
                <p className="text-sm text-gray-500">{deal.buyer.email}</p>
              )}
              {deal.buyer?.phone && (
                <p className="text-sm text-gray-500">{deal.buyer.phone}</p>
              )}
              {buyerWa && (
                <a
                  href={buyerWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Deal Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Deal Progress</h2>
            {isTerminal ? (
              <div className="text-center py-4">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${STATUS_BADGE[deal.status]}`}>
                  {deal.status === 'lost' ? '❌ Lost' : '🚫 Cancelled'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isComplete = idx <= currentIdx
                  const isCurrent = idx === currentIdx
                  return (
                    <div key={stage.status} className="flex items-center shrink-0">
                      <div className={`flex flex-col items-center ${isCurrent ? 'scale-110' : ''}`}>
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                            isComplete
                              ? isCurrent
                                ? 'bg-ocean text-white ring-2 ring-ocean/30'
                                : 'bg-ocean/20 text-ocean'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {stage.icon}
                        </div>
                        <span className={`text-[10px] mt-1 text-center leading-tight max-w-[60px] ${
                          isCurrent ? 'text-ocean font-semibold' : isComplete ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {stage.label}
                        </span>
                      </div>
                      {idx < TIMELINE_STAGES.length - 1 && (
                        <div className={`w-6 h-0.5 mx-0.5 mt-[-14px] ${
                          idx < currentIdx ? 'bg-ocean/40' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Notes section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Public Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes visible in deal context..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Internal Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Private admin notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white resize-none"
                />
              </div>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-5 py-2 bg-ocean text-white text-sm font-semibold rounded-lg hover:bg-ocean/90 disabled:opacity-50"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column — status + prices */}
        <div className="space-y-6">
          {/* Update Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Update Status</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as DealStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status Notes (optional)</label>
                <textarea
                  value={statusNotes}
                  onChange={e => setStatusNotes(e.target.value)}
                  placeholder="Reason for status change..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white resize-none"
                />
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={updatingStatus || newStatus === deal.status}
                className="w-full px-5 py-2 bg-ocean text-white text-sm font-semibold rounded-lg hover:bg-ocean/90 disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>

          {/* Prices */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Pricing</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Purchase Price (JPY)</label>
                <input
                  type="number"
                  value={priceJpy}
                  onChange={e => setPriceJpy(e.target.value)}
                  placeholder="e.g. 2500000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Purchase Price (AUD)</label>
                <input
                  type="number"
                  value={priceAud}
                  onChange={e => setPriceAud(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white"
                />
              </div>
              <button
                onClick={handleSavePrices}
                disabled={savingPrices}
                className="w-full px-5 py-2 bg-ocean text-white text-sm font-semibold rounded-lg hover:bg-ocean/90 disabled:opacity-50"
              >
                {savingPrices ? 'Saving...' : 'Save Prices'}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {customerWa && (
                <a
                  href={customerWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp Customer
                </a>
              )}
              {buyerWa && (
                <a
                  href={buyerWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp Buyer
                </a>
              )}
            </div>
          </div>

          {/* Deal metadata */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-xs text-gray-400 space-y-1">
            <p>Deal ID: {deal.id}</p>
            <p>Created: {new Date(deal.created_at).toLocaleString('en-AU')}</p>
            <p>Updated: {new Date(deal.updated_at).toLocaleString('en-AU')}</p>
            {deal.customer_vehicle_id && <p>Vehicle ID: {deal.customer_vehicle_id}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
