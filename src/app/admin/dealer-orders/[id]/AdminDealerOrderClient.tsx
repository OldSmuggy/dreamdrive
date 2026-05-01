'use client'

import { useState } from 'react'
import { formatCentsAud, FUNDS_STATUS_STYLES, FUNDS_ENTRY_LABELS, type FundsLedgerEntry } from '@/lib/funds'
import { DEALER_TIMELINE_STAGES, calculatePaymentSplit, tierLabel, gradeLabel } from '@/lib/dealer-pricing'

interface Order {
  id: string
  order_number: string
  tier: string
  vehicle_grade: string
  wholesale_price_cents: number
  retail_price_cents: number | null
  dealer_margin_cents: number | null
  status: string
  notes: string | null
  admin_notes: string | null
  source_listing_id: string | null
  estimated_delivery: string | null
  created_at: string
  signed_at: string | null
  delivered_at: string | null
  dealer_user_id: string
  profiles: { first_name: string | null; last_name: string | null; dealer_company_name: string | null; dealer_territory: string | null; phone: string | null } | null
}

interface Stage {
  id: string
  order_id: string
  stage_key: string
  stage_index: number
  status: string
  entered_at: string | null
  completed_at: string | null
  planned_date: string | null
  notes: string | null
  photos: string[] | null
}

const ORDER_STATUSES = ['pending_deposit', 'sourcing', 'sourced', 'shipping', 'building', 'ready', 'delivered', 'cancelled']

export default function AdminDealerOrderClient({ order: initialOrder, stages: initialStages, funds: initialFunds }: { order: Order; stages: Stage[]; funds: FundsLedgerEntry[] }) {
  const [order, setOrder] = useState(initialOrder)
  const [stages, setStages] = useState(initialStages)
  const [funds] = useState(initialFunds)
  const [savingStatus, setSavingStatus] = useState(false)
  const [adminNotes, setAdminNotes] = useState(order.admin_notes ?? '')
  const [estDelivery, setEstDelivery] = useState(order.estimated_delivery ?? '')
  const [sourceListingId, setSourceListingId] = useState(order.source_listing_id ?? '')

  const split = calculatePaymentSplit(order.wholesale_price_cents)
  const heldTotal = funds.filter(f => f.status === 'held').reduce((s, f) => s + f.amount_cents, 0)
  const dealerName = order.profiles?.dealer_company_name ?? 'Unknown dealer'

  async function patchOrder(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/dealer-orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('Failed')
    return res.json()
  }

  async function changeStatus(status: string) {
    setSavingStatus(true)
    try {
      const updated = await patchOrder({ status })
      setOrder(o => ({ ...o, ...updated }))
    } catch (err) { alert(String(err)) }
    finally { setSavingStatus(false) }
  }

  async function saveAdminFields() {
    try {
      const updated = await patchOrder({
        admin_notes: adminNotes,
        estimated_delivery: estDelivery || null,
        source_listing_id: sourceListingId || null,
      })
      setOrder(o => ({ ...o, ...updated }))
      alert('Saved')
    } catch (err) { alert(String(err)) }
  }

  async function moveStage(stage: Stage, status: 'upcoming' | 'current' | 'completed') {
    const res = await fetch(`/api/admin/dealer-orders/${order.id}/stages/${stage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { alert('Failed'); return }
    const updated = await res.json()
    setStages(prev => prev.map(s => s.id === stage.id ? updated : s))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">{order.order_number}</h1>
            <p className="text-gray-500 text-sm">{dealerName}{order.profiles?.dealer_territory && ` · ${order.profiles.dealer_territory}`}</p>
            <p className="text-xs text-gray-400 mt-1">Placed {new Date(order.created_at).toLocaleDateString('en-AU')}</p>
          </div>
          <select value={order.status} onChange={e => changeStatus(e.target.value)} disabled={savingStatus}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-cream rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Tier</p>
            <p className="font-bold text-charcoal">{tierLabel(order.tier as 'shell')}</p>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Vehicle grade</p>
            <p className="font-bold text-charcoal">{gradeLabel(order.vehicle_grade as 'mid')}</p>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Wholesale</p>
            <p className="font-bold text-charcoal">{formatCentsAud(order.wholesale_price_cents)}</p>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Held funds</p>
            <p className="font-bold text-ocean">{formatCentsAud(heldTotal)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-charcoal mb-4">Payment schedule (3 stages)</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Deposit · 20%</p>
            <p className="font-bold text-charcoal">{formatCentsAud(split.deposit)}</p>
            <p className="text-xs text-gray-400 mt-1">On signing</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Progress · 35%</p>
            <p className="font-bold text-charcoal">{formatCentsAud(split.progress)}</p>
            <p className="text-xs text-gray-400 mt-1">Vehicle arrives</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Final · 45%</p>
            <p className="font-bold text-charcoal">{formatCentsAud(split.final)}</p>
            <p className="text-xs text-gray-400 mt-1">Before delivery</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">Log payments in the <a href="/admin/funds" className="text-ocean hover:underline">Funds Ledger</a> with reference type &quot;dealer_order&quot; and this order ID.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-charcoal mb-4">Timeline</h2>
        <div className="space-y-3">
          {DEALER_TIMELINE_STAGES.map(meta => {
            const stage = stages.find(s => s.stage_key === meta.key)
            if (!stage) return null
            const statusCls = stage.status === 'completed' ? 'bg-green-100 text-green-700'
              : stage.status === 'current' ? 'bg-ocean text-white'
              : 'bg-gray-100 text-gray-500'
            return (
              <div key={stage.id} className="flex gap-4 border border-gray-200 rounded-xl p-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${statusCls}`}>{meta.index}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-semibold text-charcoal">{meta.label}</p>
                    <p className="text-xs text-gray-400">{meta.timing}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <button disabled={stage.status === 'upcoming'} onClick={() => moveStage(stage, 'upcoming')} className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30">Upcoming</button>
                    <button disabled={stage.status === 'current'} onClick={() => moveStage(stage, 'current')} className="text-xs px-2 py-1 border border-ocean/30 text-ocean rounded hover:bg-ocean/5 disabled:opacity-30">Current</button>
                    <button disabled={stage.status === 'completed'} onClick={() => moveStage(stage, 'completed')} className="text-xs px-2 py-1 border border-green-300 text-green-700 rounded hover:bg-green-50 disabled:opacity-30">Done ✓</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-charcoal">Admin fields</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Source listing ID (link to a listing once sourced)</label>
          <input value={sourceListingId} onChange={e => setSourceListingId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="UUID" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Estimated delivery</label>
          <input type="date" value={estDelivery} onChange={e => setEstDelivery(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Admin notes (private)</label>
          <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={saveAdminFields} className="btn-primary text-sm px-4 py-2">Save</button>
      </div>

      {order.notes && (
        <div className="bg-cream border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">Dealer notes</p>
          <p className="text-sm text-charcoal whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      <div>
        <h2 className="font-bold text-charcoal mb-3">Funds ledger entries for this order</h2>
        {funds.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-sm">No payments logged for this order yet.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {funds.map(e => {
              const status = FUNDS_STATUS_STYLES[e.status]
              return (
                <div key={e.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-charcoal text-sm">{e.description}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(e.created_at).toLocaleDateString('en-AU')} · {FUNDS_ENTRY_LABELS[e.entry_type]}</p>
                  </div>
                  <p className="font-bold text-charcoal whitespace-nowrap">{formatCentsAud(e.amount_cents)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
