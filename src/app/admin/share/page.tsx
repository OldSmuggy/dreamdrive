'use client'

import { useState } from 'react'

const PAGES = [
  { label: 'Homepage', path: '/' },
  { label: 'Browse Vans', path: '/browse' },
  { label: 'Full Build', path: '/full-build' },
  { label: 'TAMA', path: '/tama' },
  { label: 'KUMA-Q', path: '/kuma-q' },
  { label: 'MANA', path: '/mana' },
  { label: 'Roof Conversion', path: '/pop-top' },
  { label: 'Pricing', path: '/import-costs' },
  { label: 'Sell / Tip a Van', path: '/sell' },
  { label: '3D Configurator (TAMA)', path: 'https://configure.barecamper.com.au/?model=tama' },
  { label: '3D Configurator (KUMA-Q)', path: 'https://configure.barecamper.com.au/?model=kuma-q' },
  { label: '3D Configurator (MANA)', path: 'https://configure.barecamper.com.au/?model=mana' },
]

const SOURCES = [
  { label: 'Instagram', value: 'instagram', icon: '📸' },
  { label: 'Facebook', value: 'facebook', icon: '👤' },
  { label: 'Email', value: 'email', icon: '📧' },
  { label: 'WhatsApp', value: 'whatsapp', icon: '💬' },
  { label: 'LinkedIn', value: 'linkedin', icon: '💼' },
  { label: 'TikTok', value: 'tiktok', icon: '🎵' },
  { label: 'Google Ads', value: 'google', icon: '🔍' },
  { label: 'Facebook Ads', value: 'facebook_ads', icon: '📢' },
  { label: 'Flyer / Print', value: 'print', icon: '📄' },
  { label: 'Other', value: 'other', icon: '🔗' },
]

const MEDIUMS: Record<string, string> = {
  instagram: 'social',
  facebook: 'social',
  email: 'email',
  whatsapp: 'referral',
  linkedin: 'social',
  tiktok: 'social',
  google: 'cpc',
  facebook_ads: 'cpc',
  print: 'offline',
  other: 'referral',
}

export default function ShareLinksPage() {
  const [page, setPage] = useState(PAGES[0].path)
  const [source, setSource] = useState('instagram')
  const [campaign, setCampaign] = useState('')
  const [copied, setCopied] = useState(false)

  const medium = MEDIUMS[source] ?? 'referral'
  const isExternal = page.startsWith('http')
  const base = isExternal ? page : `https://barecamper.com.au${page}`

  const url = new URL(base)
  url.searchParams.set('utm_source', source)
  url.searchParams.set('utm_medium', medium)
  if (campaign.trim()) url.searchParams.set('utm_campaign', campaign.trim().toLowerCase().replace(/\s+/g, '-'))

  const finalUrl = url.toString()

  const copy = () => {
    navigator.clipboard.writeText(finalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Share Links</h1>
      <p className="text-gray-500 text-sm mb-8">Generate tracked links for social media, email, and ads. Every click is tracked in Google Analytics so you can see which channels drive traffic.</p>

      <div className="space-y-6">
        {/* Page */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Page to share</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PAGES.map(p => (
              <button
                key={p.path}
                onClick={() => setPage(p.path)}
                className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                  page === p.path
                    ? 'bg-ocean text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Where are you posting?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SOURCES.map(s => (
              <button
                key={s.value}
                onClick={() => setSource(s.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                  source === s.value
                    ? 'bg-ocean text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign (optional) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Campaign name <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={campaign}
            onChange={e => setCampaign(e.target.value)}
            placeholder="e.g. launch-week, spring-sale, 4x4-promo"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
          />
          <p className="text-xs text-gray-400 mt-1">Use the same name across channels to group posts in analytics.</p>
        </div>

        {/* Result */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your tracked link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={finalUrl}
              readOnly
              className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-mono"
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={copy}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                copied ? 'bg-green-500 text-white' : 'bg-ocean text-white hover:bg-ocean-dark'
              }`}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Quick reference */}
        <details className="bg-cream rounded-xl p-5">
          <summary className="text-sm font-semibold text-gray-700 cursor-pointer">How does this work?</summary>
          <div className="mt-3 text-sm text-gray-500 space-y-2">
            <p>UTM parameters are tags added to your URL that Google Analytics reads automatically. When someone clicks your tracked link, GA4 records:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Source</strong> — where the click came from (Instagram, Facebook, email, etc.)</li>
              <li><strong>Medium</strong> — the type of channel (social, email, cpc, etc.)</li>
              <li><strong>Campaign</strong> — your campaign name (optional, groups related posts)</li>
            </ul>
            <p>You can then see in GA4 → Acquisition → Traffic Acquisition which channels drive the most visits, leads, and reservations.</p>
            <p className="text-xs text-gray-400 mt-2">Tip: Always use this tool instead of copying the bare URL. Even if you forget the campaign name, the source and medium will still track.</p>
          </div>
        </details>
      </div>
    </div>
  )
}
