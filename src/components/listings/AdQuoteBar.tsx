'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

export default function AdQuoteBar() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', interest: 'Just the van' })

  useEffect(() => {
    // Show for UTM-tagged traffic (ads) or referrals from social
    const utm = searchParams.get('utm_source') || searchParams.get('utm_medium') || searchParams.get('ref')
    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    const fromSocial = /facebook|instagram|fb\.com|meta\.com/i.test(referrer)
    if (utm || fromSocial) setShow(true)
  }, [searchParams])

  if (!show || submitted) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ad_quote',
          name: form.name,
          phone: form.phone,
          source: `ad_${searchParams.get('utm_source') ?? 'social'}`,
          lead_type: 'ad_quote',
          notes: `Interest: ${form.interest}\nUTM: ${searchParams.get('utm_source') ?? 'social'} / ${searchParams.get('utm_medium') ?? ''} / ${searchParams.get('utm_campaign') ?? ''}`,
        }),
      })
    } catch {}

    trackEvent('ad_quote_submit', { source: searchParams.get('utm_source') ?? 'social', interest: form.interest })
    setSubmitted(true)
  }

  if (!expanded) {
    return (
      <div className="bg-ocean text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg shrink-0">🚐</span>
            <p className="text-sm font-medium truncate">
              <span className="hidden sm:inline">Not sure where to start? </span>
              Get a free quote — we&apos;ll find the right van for your budget.
            </p>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="shrink-0 bg-white text-ocean font-bold text-sm px-5 py-2 rounded-lg hover:bg-cream transition-colors"
          >
            Get Quote
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-ocean text-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Quick quote — we&apos;ll call you back today</p>
          <button onClick={() => setExpanded(false)} className="text-white/60 hover:text-white text-xs">Close</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            required
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="flex-1 rounded-lg px-3 py-2.5 text-sm text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <input
            required
            type="tel"
            placeholder="Mobile number"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="flex-1 rounded-lg px-3 py-2.5 text-sm text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <select
            value={form.interest}
            onChange={e => setForm(f => ({ ...f, interest: e.target.value }))}
            className="flex-1 rounded-lg px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option>Just the van</option>
            <option>Van + pop top</option>
            <option>Full campervan build</option>
            <option>Not sure yet</option>
          </select>
          <button
            type="submit"
            className="shrink-0 bg-sand text-charcoal font-bold text-sm px-6 py-2.5 rounded-lg hover:brightness-95 transition-all"
          >
            Call Me Back
          </button>
        </form>
      </div>
    </div>
  )
}
