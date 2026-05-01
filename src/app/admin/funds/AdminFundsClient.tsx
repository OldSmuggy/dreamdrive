'use client'

import { useState } from 'react'
import { formatCentsAud, FUNDS_ENTRY_LABELS, FUNDS_STATUS_STYLES, type FundsLedgerEntry, type FundsEntryType } from '@/lib/funds'

interface UserOption {
  id: string
  first_name: string | null
  last_name: string | null
  dealer_company_name: string | null
  role: string
}

interface Props {
  initialEntries: FundsLedgerEntry[]
  users: UserOption[]
  userMap: Record<string, { name: string; role: string }>
}

const ENTRY_TYPES: FundsEntryType[] = ['sourcing_fee', 'auction_deposit', 'deposit', 'progress', 'final', 'release', 'refund', 'other']

export default function AdminFundsClient({ initialEntries, users, userMap }: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    user_id: '',
    amount_dollars: '',
    entry_type: 'sourcing_fee' as FundsEntryType,
    description: '',
    payment_method: 'bank_transfer',
    payment_ref: '',
    notes: '',
    reference_type: '',
    reference_id: '',
  })

  const filtered = entries.filter(e => {
    if (!filter) return true
    const u = userMap[e.user_id]?.name?.toLowerCase() ?? ''
    const f = filter.toLowerCase()
    return u.includes(f) || e.description.toLowerCase().includes(f) || e.entry_type.includes(f)
  })

  const totalHeld = entries.filter(e => e.status === 'held').reduce((s, e) => s + e.amount_cents, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.user_id || !form.amount_dollars || !form.description) {
      alert('User, amount, and description are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/funds-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: form.user_id,
          amount_cents: Math.round(parseFloat(form.amount_dollars) * 100),
          entry_type: form.entry_type,
          description: form.description,
          payment_method: form.payment_method || null,
          payment_ref: form.payment_ref || null,
          notes: form.notes || null,
          reference_type: form.reference_type || null,
          reference_id: form.reference_id || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const newEntry = await res.json()
      setEntries(prev => [newEntry, ...prev])
      setShowForm(false)
      setForm({ user_id: '', amount_dollars: '', entry_type: 'sourcing_fee', description: '', payment_method: 'bank_transfer', payment_ref: '', notes: '', reference_type: '', reference_id: '' })
    } catch (err) {
      alert('Failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  async function action(entry: FundsLedgerEntry, act: 'release' | 'refund' | 'reset' | 'delete') {
    if (act === 'delete' && !confirm('Delete this entry?')) return
    try {
      const res = await fetch(`/api/admin/funds-ledger/${entry.id}`, {
        method: act === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: act === 'delete' ? undefined : JSON.stringify({ action: act }),
      })
      if (!res.ok) throw new Error('Failed')
      if (act === 'delete') {
        setEntries(prev => prev.filter(e => e.id !== entry.id))
      } else {
        const updated = await res.json()
        setEntries(prev => prev.map(e => e.id === entry.id ? updated : e))
      }
    } catch (err) {
      alert(String(err))
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Funds Ledger</h1>
          <p className="text-gray-500 text-sm mt-1">{formatCentsAud(totalHeld)} currently held across all users</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary text-sm px-4 py-2">
          {showForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-charcoal mb-2">New Funds Entry</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">User</label>
              <select required value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} className={inputCls}>
                <option value="">Select a user…</option>
                {users.map(u => {
                  const name = u.dealer_company_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.id.slice(0, 8)
                  return <option key={u.id} value={u.id}>{name}{u.role !== 'customer' ? ` (${u.role})` : ''}</option>
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (AUD)</label>
              <input type="number" step="0.01" required value={form.amount_dollars} onChange={e => setForm(f => ({ ...f, amount_dollars: e.target.value }))} className={inputCls} placeholder="2750.00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Entry type</label>
              <select value={form.entry_type} onChange={e => setForm(f => ({ ...f, entry_type: e.target.value as FundsEntryType }))} className={inputCls}>
                {ENTRY_TYPES.map(t => <option key={t} value={t}>{FUNDS_ENTRY_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Payment method</label>
              <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className={inputCls}>
                <option value="bank_transfer">Bank transfer</option>
                <option value="stripe">Stripe</option>
                <option value="cash">Cash</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="e.g. Sourcing fee for 2019 Hiace LWB" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Payment ref (optional)</label>
              <input value={form.payment_ref} onChange={e => setForm(f => ({ ...f, payment_ref: e.target.value }))} className={inputCls} placeholder="Bank ref / Stripe ID" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Reference (optional)</label>
              <div className="flex gap-2">
                <select value={form.reference_type} onChange={e => setForm(f => ({ ...f, reference_type: e.target.value }))} className={inputCls + ' max-w-[140px]'}>
                  <option value="">— none —</option>
                  <option value="listing">Listing</option>
                  <option value="dealer_order">Dealer order</option>
                  <option value="sourcing">Sourcing</option>
                </select>
                <input value={form.reference_id} onChange={e => setForm(f => ({ ...f, reference_id: e.target.value }))} className={inputCls} placeholder="ID" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional, internal)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </form>
      )}

      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter by user, description, type…"
        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
      />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-10 text-center text-gray-400 text-sm">No entries.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(e => {
              const status = FUNDS_STATUS_STYLES[e.status]
              const userName = userMap[e.user_id]?.name ?? e.user_id.slice(0, 8)
              return (
                <div key={e.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-charcoal text-sm truncate">{e.description}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-charcoal">{userName}</span> · {new Date(e.created_at).toLocaleDateString('en-AU')} · {FUNDS_ENTRY_LABELS[e.entry_type]}
                      {e.payment_ref && ` · Ref ${e.payment_ref}`}
                    </p>
                  </div>
                  <p className="text-charcoal font-bold whitespace-nowrap">{formatCentsAud(e.amount_cents)}</p>
                  <div className="flex items-center gap-1">
                    {e.status === 'held' && (
                      <>
                        <button onClick={() => action(e, 'release')} className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">Release</button>
                        <button onClick={() => action(e, 'refund')} className="text-xs px-2 py-1 border border-amber-200 text-amber-700 rounded hover:bg-amber-50">Refund</button>
                      </>
                    )}
                    {e.status !== 'held' && (
                      <button onClick={() => action(e, 'reset')} className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-500">Undo</button>
                    )}
                    <button onClick={() => action(e, 'delete')} className="text-xs px-2 py-1 text-red-400 hover:text-red-600">×</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
