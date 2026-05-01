'use client'

import { useState } from 'react'

interface Props {
  title: string
  subtitle: string
  resource: 'marketing' | 'training'
  items: Array<{ icon: string; title: string; desc: string }>
}

export default function ComingSoonClient({ title, subtitle, resource, items }: Props) {
  const [notified, setNotified] = useState(false)
  const [loading, setLoading] = useState(false)

  async function notifyMe() {
    setLoading(true)
    try {
      const res = await fetch('/api/dealer/resource-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource }),
      })
      if (res.ok) setNotified(true)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <span>🚧</span> Coming Soon
        </div>
        <h1 className="text-2xl font-bold text-charcoal">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-bold text-charcoal text-sm mb-1">{item.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-charcoal text-white rounded-2xl p-6 text-center">
        <p className="text-sand text-xs font-semibold tracking-widest uppercase mb-2">Get early access</p>
        <h2 className="text-xl font-bold mb-2">Want a heads-up when this lands?</h2>
        <p className="text-white/70 text-sm mb-5 max-w-md mx-auto">
          We&apos;ll email you the moment {title.toLowerCase()} are live in your portal. Founding dealers get first access.
        </p>
        {notified ? (
          <p className="text-sand font-semibold">✓ You&apos;re on the list. We&apos;ll be in touch.</p>
        ) : (
          <button onClick={notifyMe} disabled={loading} className="bg-sand text-charcoal font-semibold px-5 py-2.5 rounded-lg hover:bg-sand-light transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Notify Me When Ready'}
          </button>
        )}
      </div>
    </div>
  )
}
