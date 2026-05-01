'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Partner {
  id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  abn: string | null
  address: string | null
  website: string | null
  commission_aud: number | null
  commission_type: string | null
  terms_notes: string | null
  status: string
  agreement_sent_at: string | null
  agreement_signed_at: string | null
  notes: string | null
  created_at: string
}

interface Props {
  initialPartners: Partner[]
  counts: Record<string, { total: number; sold: number }>
}

export default function AdminPartnersClient({ initialPartners, counts }: Props) {
  const [partners, setPartners] = useState(initialPartners)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', contact_name: '', contact_email: '', contact_phone: '',
    abn: '', address: '', website: '',
    commission_aud: 1000, commission_type: 'discount',
    terms_notes: '',
    send_agreement: true,
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const created = await res.json()
      setPartners(prev => [created, ...prev])
      setShowForm(false)
      setForm({ name: '', contact_name: '', contact_email: '', contact_phone: '', abn: '', address: '', website: '', commission_aud: 1000, commission_type: 'discount', terms_notes: '', send_agreement: true })
      if (form.send_agreement && form.contact_email) alert(`Partner saved + agreement email sent to ${form.contact_email}`)
      else alert('Partner saved')
    } catch (err) {
      alert('Failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally { setSaving(false) }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean'

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Referral Partners</h1>
          <p className="text-gray-500 text-sm mt-1">{partners.length} partner{partners.length === 1 ? '' : 's'} · Australian dealers / private sellers</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary text-sm px-4 py-2">
          {showForm ? 'Cancel' : '+ Add Partner'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-charcoal mb-2">New referral partner</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Business name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="AC Cars" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Website</label>
              <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className={inputCls} placeholder="https://www.accars.com.au" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Contact name</label>
              <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Contact email</label>
              <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className={inputCls} placeholder="sales@..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Contact phone</label>
              <input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} className={inputCls} placeholder="0440 137 474" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ABN</label>
              <input value={form.abn} onChange={e => setForm(f => ({ ...f, abn: e.target.value }))} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} placeholder="66 Raynham St, Salisbury, QLD 4107" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Per-vehicle amount (AUD)</label>
              <input type="number" value={form.commission_aud} onChange={e => setForm(f => ({ ...f, commission_aud: parseInt(e.target.value) || 0 }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
              <select value={form.commission_type} onChange={e => setForm(f => ({ ...f, commission_type: e.target.value }))} className={inputCls}>
                <option value="discount">Discount on their invoice</option>
                <option value="commission">Commission paid to us</option>
                <option value="rebate">Rebate</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Specific terms (optional)</label>
              <textarea value={form.terms_notes} onChange={e => setForm(f => ({ ...f, terms_notes: e.target.value }))} rows={3} className={inputCls} placeholder="e.g. Applies to all Hiace SLWB stock. Customer must be referred via barecamper.com.au listing." />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 bg-cream rounded-lg p-3">
              <input id="send_ag" type="checkbox" checked={form.send_agreement} onChange={e => setForm(f => ({ ...f, send_agreement: e.target.checked }))} />
              <label htmlFor="send_ag" className="text-sm text-charcoal cursor-pointer">
                Send agreement email to <strong>{form.contact_email || '(no email)'}</strong> straight away
              </label>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Partner'}
          </button>
        </form>
      )}

      {partners.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">🤝</div>
          <p className="font-semibold text-charcoal mb-1">No partners yet</p>
          <p className="text-gray-500 text-sm">Add an Australian dealer or private partner to start tracking referrals.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
          {partners.map(p => {
            const c = counts[p.id] ?? { total: 0, sold: 0 }
            return (
              <Link key={p.id} href={`/admin/partners/${p.id}`} className="block p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-charcoal">{p.name}</p>
                      {p.status !== 'active' && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{p.status}</span>}
                      {p.agreement_sent_at && !p.agreement_signed_at && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Agreement sent</span>}
                      {p.agreement_signed_at && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Signed ✓</span>}
                    </div>
                    <p className="text-xs text-gray-500">
                      {p.contact_name && `${p.contact_name} · `}{p.contact_email ?? p.contact_phone ?? 'No contact'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{c.total} listing{c.total === 1 ? '' : 's'} · {c.sold} sold</p>
                    {p.commission_aud ? <p className="font-bold text-ocean">${p.commission_aud.toLocaleString('en-AU')} {p.commission_type}</p> : null}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
