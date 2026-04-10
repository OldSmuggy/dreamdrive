'use client'

import { useState } from 'react'

export default function VanTipForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    vehicle_url: '',
    notes: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/vehicle-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🤞</div>
        <h3 className="text-2xl font-bold text-charcoal mb-3">Tip received — fingers crossed!</h3>
        <p className="text-gray-500 leading-relaxed">
          We&apos;ll check it out and let you know if it becomes a match. You&apos;ll get an email if a customer buys it and your $200 is on its way.
        </p>
        <button
          onClick={() => { setStatus('idle'); setForm({ name: '', email: '', phone: '', vehicle_url: '', notes: '' }) }}
          className="mt-6 text-ocean text-sm hover:underline"
        >
          Submit another tip →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Your name <span className="text-red-400">*</span></label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Luke"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Email <span className="text-red-400">*</span></label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="04xx xxx xxx"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1.5">Link to the van</label>
        <input
          type="url"
          name="vehicle_url"
          value={form.vehicle_url}
          onChange={handleChange}
          placeholder="https://www.goo-net.com/..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
        />
        <p className="text-xs text-gray-400 mt-1">Paste the URL from Goo-net, Car Sensor, Yahoo Auctions, Facebook, Gumtree, etc.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1.5">Any extra details? <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Year, mileage, why you think it's a good one, anything else..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-500 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending...' : 'Submit tip'}
      </button>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        By submitting you agree that the finders fee is only payable when the exact van you submitted is purchased by a Bare Camper customer. No fee is payable for tips that don&apos;t result in a sale.
      </p>
    </form>
  )
}
