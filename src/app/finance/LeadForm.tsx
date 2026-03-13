'use client'

import { useState } from 'react'

const BUDGET_OPTIONS = [
  'Under $50,000',
  '$50,000 – $80,000',
  '$80,000 – $120,000',
  '$120,000 – $160,000',
  '$160,000 – $200,000',
  'Over $200,000',
]

const FINANCE_TYPES = [
  'Personal Loan',
  'Chattel Mortgage (ABN)',
  'Not sure yet',
]

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function LeadForm() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    budget: '', financeType: '', notes: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const notes = [
      form.financeType && `Finance type: ${form.financeType}`,
      form.budget && `Budget: ${form.budget}`,
      form.notes && `Notes: ${form.notes}`,
    ].filter(Boolean).join('\n')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'finance_enquiry',
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
          source: 'finance_page',
          notes,
        }),
      })
      if (!res.ok) throw new Error('Server error')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try emailing jared@dreamdrive.life directly.')
    }
  }

  if (status === 'success') {
    return (
      <div className="py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-forest-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-forest-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-3xl text-forest-900 mb-2">Enquiry received!</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          We'll be in touch within 24 hours with finance options tailored to your situation.
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">First name *</label>
        <input required value={form.firstName} onChange={e => set('firstName', e.target.value)}
          className={inputClass} placeholder="Jane" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last name *</label>
        <input required value={form.lastName} onChange={e => set('lastName', e.target.value)}
          className={inputClass} placeholder="Smith" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
        <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
          className={inputClass} placeholder="jane@example.com" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone *</label>
        <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
          className={inputClass} placeholder="04xx xxx xxx" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total budget *</label>
        <select required value={form.budget} onChange={e => set('budget', e.target.value)}
          className={`${inputClass} bg-white`}>
          <option value="">Select range…</option>
          {BUDGET_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Finance type *</label>
        <select required value={form.financeType} onChange={e => set('financeType', e.target.value)}
          className={`${inputClass} bg-white`}>
          <option value="">Select…</option>
          {FINANCE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={form.notes} onChange={e => set('notes', e.target.value)}
          rows={3} className={`${inputClass} resize-none`}
          placeholder="Any details about your situation, the van you're looking at, or build you have in mind…"
        />
      </div>

      {errorMsg && (
        <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary w-full text-base py-4 disabled:opacity-50"
        >
          {status === 'loading' ? 'Sending…' : 'Get my finance options →'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          No credit check. No commitment. We&apos;ll contact you within 24 hours.
        </p>
      </div>
    </form>
  )
}
