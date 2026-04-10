'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DealStatus } from '@/types'

interface DealRow {
  id: string
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

const ACTIVE_STATUSES: DealStatus[] = [
  'draft', 'deposit_pending', 'deposit_received', 'bidding',
  'won', 'shipping', 'delivered',
]

type FilterTab = 'active' | 'all' | 'completed' | 'lost'

function whatsappUrl(phone: string | null | undefined, message: string) {
  if (!phone) return null
  const clean = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

export default function DealsClient({ deals: initial }: { deals: DealRow[] }) {
  const [deals, setDeals] = useState(initial)
  const [tab, setTab] = useState<FilterTab>('active')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = deals.filter(d => {
    switch (tab) {
      case 'active':    return ACTIVE_STATUSES.includes(d.status)
      case 'completed': return d.status === 'completed'
      case 'lost':      return d.status === 'lost' || d.status === 'cancelled'
      case 'all':       return true
    }
  })

  const counts = {
    active:    deals.filter(d => ACTIVE_STATUSES.includes(d.status)).length,
    all:       deals.length,
    completed: deals.filter(d => d.status === 'completed').length,
    lost:      deals.filter(d => d.status === 'lost' || d.status === 'cancelled').length,
  }

  const updateStatus = async (dealId: string, newStatus: DealStatus) => {
    setUpdatingId(dealId)
    try {
      const res = await fetch(`/api/admin/deals/${dealId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to update status')
        return
      }
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status: newStatus } : d))
    } catch (e) {
      alert(String(e))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['active', 'all', 'completed', 'lost'] as FilterTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-ocean text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No deals found</p>
          <p className="text-sm mt-1">Start a deal from any listing&apos;s edit panel.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Van</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Buyer</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(deal => {
                const photo = deal.listing?.photos?.[0]
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

                return (
                  <tr key={deal.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/deals/${deal.id}`} className="flex items-center gap-3 group">
                        {photo ? (
                          <img
                            src={photo}
                            alt={vanTitle}
                            className="w-12 h-9 object-cover rounded-lg shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-9 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-gray-300 text-xs">
                            🚐
                          </div>
                        )}
                        <span className="text-charcoal font-medium group-hover:text-ocean transition-colors truncate max-w-[200px]">
                          {vanTitle}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <Link href={`/admin/deals/${deal.id}`} className="hover:text-ocean">
                        {customerName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {deal.buyer?.name ?? 'Unknown'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[deal.status]}`}>
                        {STATUS_LABEL[deal.status]}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(deal.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {/* Status dropdown */}
                        <select
                          value={deal.status}
                          onChange={e => updateStatus(deal.id, e.target.value as DealStatus)}
                          disabled={updatingId === deal.id}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-ocean"
                        >
                          {ALL_STATUSES.map(s => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                          ))}
                        </select>

                        {/* WhatsApp buttons */}
                        {customerWa && (
                          <a
                            href={customerWa}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp Customer"
                            className="text-green-600 hover:text-green-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          </a>
                        )}
                        {buyerWa && (
                          <a
                            href={buyerWa}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp Buyer"
                            className="text-emerald-600 hover:text-emerald-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          </a>
                        )}

                        <Link
                          href={`/admin/deals/${deal.id}`}
                          className="text-xs text-ocean hover:underline ml-1"
                        >
                          View →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
