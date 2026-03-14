'use client'

import { useState } from 'react'

const IMPORT_STAGES = [
  { key: 'auction_won', label: 'Auction Won' },
  { key: 'payment_received', label: 'Payment Received' },
  { key: 'export_docs', label: 'Export Docs' },
  { key: 'shipped', label: 'Shipped from Japan' },
  { key: 'arrived_au', label: 'Arrived in AU' },
  { key: 'compliance', label: 'Quarantine & Compliance' },
  { key: 'fitout_in_progress', label: 'Fit-Out In Progress' },
  { key: 'ready', label: 'Ready for Collection' },
  { key: 'handed_over', label: 'Handed Over' },
]

interface ImportOrder {
  id: string
  user_id: string
  listing_id: string
  current_stage: string
  stage_dates: Record<string, string>
  admin_notes: string | null
  created_at: string
  order_type: string | null
  listing: { id: string; model_name: string; model_year: number | null; photos: string[] } | null
}

interface Invoice {
  id: string
  import_order_id: string
  invoice_number: string
  description: string | null
  amount_aud: number
  issue_date: string | null
  due_date: string | null
  status: string
}

interface Payment {
  id: string
  import_order_id: string
  amount_aud: number
  description: string | null
  payment_method: string | null
  payment_date: string | null
  status: string
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
  invoices: unknown[]
  payments: unknown[]
}

export default function CustomersClient({ customers, invoices: rawInvoices, payments: rawPayments }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingStage, setUpdatingStage] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [savingNotes, setSavingNotes] = useState<string | null>(null)
  const [invoiceForm, setInvoiceForm] = useState<string | null>(null)
  const [paymentForm, setPaymentForm] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const invoices = rawInvoices as Invoice[]
  const payments = rawPayments as Payment[]

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

  const createInvoice = async (e: React.FormEvent<HTMLFormElement>, orderId: string, userId: string) => {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        import_order_id: orderId,
        user_id: userId,
        invoice_number: fd.get('invoice_number'),
        description: fd.get('description') || null,
        amount_aud: Math.round(parseFloat(fd.get('amount_aud') as string) * 100),
        issue_date: fd.get('issue_date') || null,
        due_date: fd.get('due_date') || null,
        status: fd.get('status') ?? 'due',
      }),
    })
    setSubmitting(false)
    setInvoiceForm(null)
    window.location.reload()
  }

  const markPayment = async (e: React.FormEvent<HTMLFormElement>, orderId: string, userId: string) => {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        import_order_id: orderId,
        user_id: userId,
        amount_aud: Math.round(parseFloat(fd.get('amount_aud') as string) * 100),
        description: fd.get('description') || null,
        payment_method: fd.get('payment_method') || null,
        payment_date: fd.get('payment_date') || null,
        status: 'confirmed',
      }),
    })
    setSubmitting(false)
    setPaymentForm(null)
    window.location.reload()
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      due: 'bg-amber-100 text-amber-700',
      overdue: 'bg-red-100 text-red-700',
    }
    return map[status] ?? 'bg-gray-100 text-gray-600'
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
                      {c.imports.map(order => {
                        const orderInvoices = invoices.filter(i => i.import_order_id === order.id)
                        const orderPayments = payments.filter(p => p.import_order_id === order.id)
                        return (
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

                            {/* Stage date inputs */}
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-gray-600 mb-2">Stage Dates</p>
                              <div className="grid grid-cols-2 gap-2">
                                {IMPORT_STAGES.map(s => (
                                  <div key={s.key} className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 w-28 shrink-0">{s.label}</label>
                                    <input
                                      type="date"
                                      defaultValue={order.stage_dates?.[s.key] ?? ''}
                                      onBlur={async e => {
                                        const val = e.target.value
                                        if (val) {
                                          await fetch(`/api/import-orders/${order.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ stage_dates: { ...order.stage_dates, [s.key]: val } }),
                                          })
                                        }
                                      }}
                                      className="border border-gray-200 rounded px-2 py-1 text-xs flex-1 min-w-0"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Admin notes */}
                            <div className="mb-4">
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

                            {/* Invoices */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-600">Invoices ({orderInvoices.length})</p>
                                <button
                                  onClick={() => setInvoiceForm(invoiceForm === order.id ? null : order.id)}
                                  className="text-xs text-forest-600 hover:underline font-medium"
                                >
                                  + Add Invoice
                                </button>
                              </div>
                              {orderInvoices.length > 0 && (
                                <div className="space-y-1.5 mb-2">
                                  {orderInvoices.map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                                      <div>
                                        <span className="font-medium text-gray-800">{inv.invoice_number}</span>
                                        {inv.description && <span className="text-gray-500 ml-2">{inv.description}</span>}
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <span className="font-medium">${(inv.amount_aud / 100).toLocaleString('en-AU')}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold uppercase ${statusBadge(inv.status)}`}>
                                          {inv.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {invoiceForm === order.id && (
                                <form onSubmit={e => createInvoice(e, order.id, order.user_id)} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
                                  <div className="grid grid-cols-2 gap-2">
                                    <input name="invoice_number" required placeholder="Invoice #" className="border border-gray-300 rounded px-2 py-1.5 text-xs" />
                                    <input name="amount_aud" required type="number" step="0.01" placeholder="Amount AUD" className="border border-gray-300 rounded px-2 py-1.5 text-xs" />
                                  </div>
                                  <input name="description" placeholder="Description (optional)" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs" />
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-xs text-gray-500">Issue Date</label>
                                      <input name="issue_date" type="date" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs mt-0.5" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500">Due Date</label>
                                      <input name="due_date" type="date" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs mt-0.5" />
                                    </div>
                                  </div>
                                  <select name="status" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white">
                                    <option value="due">Due</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                  </select>
                                  <div className="flex gap-2">
                                    <button type="submit" disabled={submitting} className="text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50">
                                      {submitting ? 'Creating…' : 'Create Invoice'}
                                    </button>
                                    <button type="button" onClick={() => setInvoiceForm(null)} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100">
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>

                            {/* Payments */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-600">Payments ({orderPayments.length})</p>
                                <button
                                  onClick={() => setPaymentForm(paymentForm === order.id ? null : order.id)}
                                  className="text-xs text-forest-600 hover:underline font-medium"
                                >
                                  + Mark Payment
                                </button>
                              </div>
                              {orderPayments.length > 0 && (
                                <div className="space-y-1.5 mb-2">
                                  {orderPayments.map(pay => (
                                    <div key={pay.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                                      <div>
                                        <span className="font-medium text-gray-800">${(pay.amount_aud / 100).toLocaleString('en-AU')}</span>
                                        {pay.description && <span className="text-gray-500 ml-2">{pay.description}</span>}
                                        {pay.payment_method && <span className="text-gray-400 ml-2">via {pay.payment_method}</span>}
                                      </div>
                                      <div className="shrink-0 ml-3 text-gray-400">
                                        {pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('en-AU') : '—'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {paymentForm === order.id && (
                                <form onSubmit={e => markPayment(e, order.id, order.user_id)} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
                                  <div className="grid grid-cols-2 gap-2">
                                    <input name="amount_aud" required type="number" step="0.01" placeholder="Amount AUD" className="border border-gray-300 rounded px-2 py-1.5 text-xs" />
                                    <input name="payment_date" type="date" placeholder="Payment Date" className="border border-gray-300 rounded px-2 py-1.5 text-xs" />
                                  </div>
                                  <input name="description" placeholder="Description (optional)" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs" />
                                  <select name="payment_method" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white">
                                    <option value="">Payment method (optional)</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="credit_card">Credit Card</option>
                                    <option value="cash">Cash</option>
                                    <option value="other">Other</option>
                                  </select>
                                  <div className="flex gap-2">
                                    <button type="submit" disabled={submitting} className="text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50">
                                      {submitting ? 'Saving…' : 'Record Payment'}
                                    </button>
                                    <button type="button" onClick={() => setPaymentForm(null)} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100">
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          </div>
                        )
                      })}
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
