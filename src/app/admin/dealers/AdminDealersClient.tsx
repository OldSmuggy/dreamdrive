'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCentsAud } from '@/lib/funds'

interface Dealer {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  dealer_company_name: string | null
  dealer_abn: string | null
  dealer_territory: string | null
  dealer_signed_at: string | null
  dealer_invited_at: string | null
  dealer_active: boolean | null
  created_at: string
}

interface Props {
  initialDealers: Dealer[]
  stats: Record<string, { count: number; total: number }>
}

export default function AdminDealersClient({ initialDealers, stats }: Props) {
  const [dealers, setDealers] = useState(initialDealers)
  const [showInvite, setShowInvite] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    dealer_company_name: '',
    dealer_abn: '',
    dealer_territory: '',
  })

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.dealer_company_name) {
      alert('Email and company name required')
      return
    }
    setInviting(true)
    try {
      const res = await fetch('/api/admin/dealers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const newDealer: Dealer = {
        id: (await res.json()).user_id,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        phone: form.phone || null,
        dealer_company_name: form.dealer_company_name,
        dealer_abn: form.dealer_abn || null,
        dealer_territory: form.dealer_territory || null,
        dealer_signed_at: null,
        dealer_invited_at: new Date().toISOString(),
        dealer_active: true,
        created_at: new Date().toISOString(),
      }
      setDealers(prev => [newDealer, ...prev])
      setShowInvite(false)
      setForm({ email: '', first_name: '', last_name: '', phone: '', dealer_company_name: '', dealer_abn: '', dealer_territory: '' })
      alert(`Invite sent to ${form.email}`)
    } catch (err) {
      alert('Failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setInviting(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Dealers</h1>
          <p className="text-gray-500 text-sm mt-1">{dealers.length} dealer{dealers.length === 1 ? '' : 's'} · Founding programme</p>
        </div>
        <button onClick={() => setShowInvite(s => !s)} className="btn-primary text-sm px-4 py-2">
          {showInvite ? 'Cancel' : '+ Invite Dealer'}
        </button>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-charcoal mb-2">Invite a new dealer</h2>
          <p className="text-xs text-gray-500 mb-3">Sends them a Supabase magic-link sign-in email plus our welcome email.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Company name</label>
              <input required value={form.dealer_company_name} onChange={e => setForm(f => ({ ...f, dealer_company_name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">First name</label>
              <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last name</label>
              <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Territory</label>
              <input value={form.dealer_territory} onChange={e => setForm(f => ({ ...f, dealer_territory: e.target.value }))} placeholder="e.g. QLD, NSW Northern" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">ABN (optional)</label>
              <input value={form.dealer_abn} onChange={e => setForm(f => ({ ...f, dealer_abn: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <button type="submit" disabled={inviting} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
            {inviting ? 'Sending invite…' : 'Send Invite'}
          </button>
        </form>
      )}

      {dealers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">🤝</div>
          <p className="font-semibold text-charcoal mb-1">No dealers yet</p>
          <p className="text-gray-500 text-sm">Invite your first founding dealer above.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {dealers.map(d => {
              const stat = stats[d.id] ?? { count: 0, total: 0 }
              const name = [d.first_name, d.last_name].filter(Boolean).join(' ')
              return (
                <Link key={d.id} href={`/admin/dealers/${d.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-charcoal">{d.dealer_company_name ?? 'Unnamed dealer'}</p>
                        {d.dealer_active === false && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                        {!d.dealer_signed_at && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Invited</span>}
                      </div>
                      <p className="text-xs text-gray-500">
                        {name && `${name} · `}{d.dealer_territory ?? 'No territory'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{stat.count} order{stat.count === 1 ? '' : 's'}</p>
                      <p className="font-bold text-charcoal">{formatCentsAud(stat.total)}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
