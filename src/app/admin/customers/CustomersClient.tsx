'use client'

import { useState } from 'react'

const IMPORT_STAGES = [
  { key: 'auction_won', label: 'Auction Won' },
  { key: 'payment_received', label: 'Payment Received' },
  { key: 'export_docs', label: 'Export Docs' },
  { key: 'shipped', label: 'Shipped from Japan' },
  { key: 'arrived_au', label: 'Arrived in AU' },
  { key: 'compliance', label: 'Quarantine & Compliance' },
  { key: 'ready', label: 'Ready for Collection' },
]

interface ImportOrder {
  id: string
  user_id: string
  listing_id: string
  current_stage: string
  stage_dates: Record<string, string>
  admin_notes: string | null
  created_at: string
  listing: { id: string; model_name: string; model_year: number | null; photos: string[] } | null
}

interface Customer {
  id: string
  email: string
  created_at: string
  first_name: string | null
  last_name: string | null
  saved_count: number
  deposit_count: number
  imports: ImportOrder[]
}

interface Props {
  customers: Customer[]
}

export default function CustomersClient({ customers }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingStage, setUpdatingStage] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [savingNotes, setSavingNotes] = useState<string | null>(null)

  const updateStage = async (orderId: string, stage: string) => {
    setUpdatingStage(orderId)
    await fetch(`/api/import-orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_stage: stage }),
    })
    setUpdatingStage(null)
    window.location.reload()
  }

  const saveNotes = async (orderId: string) => {
    setSavingNotes(orderId)
    await fetch(`/api/import-orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: notes[orderId] ?? '' }),
    })
    setSavingNotes(null)
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-forest-900 mb-6">Customers ({customers.length})</h1>

      {customers.length === 0 && (
        <p className="text-gray-400 text-sm">No customers yet.</p>
      )}

      <div className="space-y-3">
        {customers.map(c => {
          const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email
          const isOpen = expanded === c.id
          return (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(isOpen ? null : c.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-sm font-semibold shrink-0">
                    {(c.first_name?.[0] ?? c.email[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{name}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('en-AU')}</span>
                  {c.saved_count > 0 && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">♥ {c.saved_count}</span>}
                  {c.deposit_count > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">$ {c.deposit_count} hold{c.deposit_count !== 1 ? 's' : ''}</span>}
                  {c.imports.length > 0 && <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded">🚢 {c.imports.length} import{c.imports.length !== 1 ? 's' : ''}</span>}
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
                  {c.imports.length === 0 ? (
                    <p className="text-sm text-gray-400">No import orders.</p>
                  ) : (
                    <div className="space-y-5">
                      {c.imports.map(order => (
                        <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="flex items-center gap-3 mb-4">
                            {order.listing?.photos?.[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={order.listing.photos[0]} alt="" className="w-14 h-10 object-cover rounded shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {order.listing ? `${order.listing.model_year ?? ''} ${order.listing.model_name}` : order.listing_id}
                              </p>
                              <p className="text-xs text-gray-400">Started {new Date(order.created_at).toLocaleDateString('en-AU')}</p>
                            </div>
                          </div>

                          {/* Stage selector */}
                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Stage</label>
                            <select
                              value={order.current_stage}
                              disabled={updatingStage === order.id}
                              onChange={e => updateStage(order.id, e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-50"
                            >
                              {IMPORT_STAGES.map(s => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Admin notes */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Admin Notes</label>
                            <textarea
                              rows={2}
                              value={notes[order.id] ?? order.admin_notes ?? ''}
                              onChange={e => setNotes(n => ({ ...n, [order.id]: e.target.value }))}
                              placeholder="Add notes visible to customer..."
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                            />
                            <button
                              onClick={() => saveNotes(order.id)}
                              disabled={savingNotes === order.id}
                              className="mt-1.5 text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50"
                            >
                              {savingNotes === order.id ? 'Saving…' : 'Save Notes'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
