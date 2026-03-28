'use client'

import { useState } from 'react'

export default function AskAboutVan({ listingId }: { listingId: string }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!message.trim() || sending) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/listings/${listingId}/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Something went wrong')
      }
      setSent(true)
    } catch (e) {
      setError(String(e).replace('Error: ', ''))
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-ocean/10 rounded-xl p-5 text-center">
        <div className="text-2xl mb-2">✓</div>
        <p className="font-semibold text-ocean">Message sent!</p>
        <p className="text-sm text-ocean/70 mt-1">We&apos;ll get back to you soon.</p>
      </div>
    )
  }

  return (
    <div className="bg-cream rounded-xl p-5">
      <p className="font-semibold text-charcoal mb-1 text-sm">Ask about this van</p>
      <p className="text-xs text-gray-500 mb-3">Got a question? We&apos;ll get back to you fast.</p>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) send() }}
        placeholder="e.g. Is there a RWC included? Can I book an inspection?"
        rows={3}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 resize-none bg-white"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <button
        onClick={send}
        disabled={!message.trim() || sending}
        className="mt-2 btn-primary w-full py-2.5 text-sm disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Send Message'}
      </button>
    </div>
  )
}
