'use client'

import { useState } from 'react'

interface Props {
  listingId: string
}

export default function InterestForm({ listingId }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (status === 'success') {
    return (
      <div className="bg-cream border border-ocean/20 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-3">✉️</div>
        <h3 className="text-lg font-bold text-charcoal mb-2">Interest sent!</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Your details have been sent to the seller. They&apos;ll be in touch.
        </p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary w-full text-center text-base py-4 block"
      >
        I&apos;m Interested — Contact Seller
      </button>
    )
  }

  const canSubmit = form.name.trim() && form.email.trim() && form.email.includes('@')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/listings/${listingId}/interest`, {
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

  const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean'

  return (
    <form onSubmit={handleSubmit} className="bg-cream border border-ocean/20 rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-charcoal mb-1">Interested in this van?</h3>
        <p className="text-gray-500 text-sm">We&apos;ll send your details to the seller so they can get in touch.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Name <span className="text-red-400">*</span></label>
          <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Your name" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Email <span className="text-red-400">*</span></label>
          <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="04xx xxx xxx" className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1.5">Message <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3}
          placeholder="Tell the seller what you'd like to know…"
          className={`${inputClass} resize-none`} />
      </div>

      {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={() => setOpen(false)}
          className="flex-1 py-3 text-sm border border-gray-200 rounded-xl text-gray-500 hover:bg-white transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={!canSubmit || status === 'submitting'}
          className="flex-[2] btn-primary py-3 text-base disabled:opacity-40">
          {status === 'submitting' ? 'Sending…' : 'Send to Seller'}
        </button>
      </div>
    </form>
  )
}
