'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

interface FormState {
  first_name: string; last_name: string; email: string; phone: string
  state: string; notes: string; hubspot_contact_id: string; status: string
}

export default function EditCustomerPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [form, setForm]       = useState<FormState>({ first_name: '', last_name: '', email: '', phone: '', state: '', notes: '', hubspot_contact_id: '', status: 'active' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          first_name:         data.first_name         ?? '',
          last_name:          data.last_name          ?? '',
          email:              data.email              ?? '',
          phone:              data.phone              ?? '',
          state:              data.state              ?? '',
          notes:              data.notes              ?? '',
          hubspot_contact_id: data.hubspot_contact_id ?? '',
          status:             data.status             ?? 'active',
        })
        setLoading(false)
      })
  }, [id])

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res  = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
    router.push(`/admin/customers/${id}`)
  }

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/customers/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl text-charcoal">Edit Customer</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">First Name *</label>
            <input required value={form.first_name} onChange={set('first_name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Name *</label>
            <input required value={form.last_name} onChange={set('last_name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={set('email')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={set('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">State</label>
            <select value={form.state} onChange={set('state')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ocean">
              <option value="">— Select —</option>
              {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
          <select value={form.status} onChange={set('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ocean">
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ocean" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            HubSpot Contact ID <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input value={form.hubspot_contact_id} onChange={set('hubspot_contact_id')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean" />
          <p className="text-xs text-gray-400 mt-1">Will be used for CRM integration in a future update.</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href={`/admin/customers/${id}`} className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
