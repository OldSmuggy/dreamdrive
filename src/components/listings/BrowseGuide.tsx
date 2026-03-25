'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ── Scout Request Form ──────────────────────────────────────────────────────

function ScoutForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', size: '', drive: '', budget: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.email && !form.phone) { setError('Please enter your email or phone.'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'van_scout',
          lead_type: 'van_scout',
          name: form.name,
          email: form.email,
          phone: form.phone,
          source: 'browse_page_scout',
          notes: [
            form.size && `Size: ${form.size}`,
            form.drive && `Drive: ${form.drive}`,
            form.budget && `Budget: ${form.budget}`,
            form.notes && `Notes: ${form.notes}`,
          ].filter(Boolean).join(' | '),
        }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">🎉</p>
        <h3 className="text-xl font-semibold text-charcoal mb-2">We&apos;re on it!</h3>
        <p className="text-gray-600">We&apos;ll be in touch when we find a van matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
        <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sarah" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="sarah@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="04XX XXX XXX" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Budget range</label>
        <select className={inputCls} value={form.budget} onChange={e => set('budget', e.target.value)}>
          <option value="">Select...</option>
          <option value="under_30k">Under $30,000</option>
          <option value="30_50k">$30,000 – $50,000</option>
          <option value="50_70k">$50,000 – $70,000</option>
          <option value="70_100k">$70,000 – $100,000</option>
          <option value="over_100k">$100,000+</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred size</label>
        <select className={inputCls} value={form.size} onChange={e => set('size', e.target.value)}>
          <option value="">No preference</option>
          <option value="H200 LWB">H200 Long (LWB)</option>
          <option value="H200 SLWB">H200 Super Long (SLWB)</option>
          <option value="300 LWB">300 Series Long (LWB)</option>
          <option value="300 SLWB">300 Series Super Long (SLWB)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Drive</label>
        <select className={inputCls} value={form.drive} onChange={e => set('drive', e.target.value)}>
          <option value="">No preference</option>
          <option value="4WD">4WD</option>
          <option value="2WD">2WD</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Anything else we should know?</label>
        <textarea className={inputCls + ' h-20 resize-none'} value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="e.g. Must be diesel, under 50k km, need it by June..." />
      </div>
      {error && <p className="text-red-600 text-sm md:col-span-2">{error}</p>}
      <div className="md:col-span-2">
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full sm:w-auto px-8 py-3 bg-ocean text-white font-semibold rounded-lg hover:bg-ocean/90 disabled:opacity-50 transition-colors">
          {submitting ? 'Submitting...' : 'Find My Van'}
        </button>
      </div>
    </div>
  )
}

// ── Van Type Cards ──────────────────────────────────────────────────────────

const VAN_TYPES = [
  {
    name: 'H200 LWB',
    subtitle: 'Long Wheelbase',
    bestFor: 'Couples & weekend adventures',
    length: '4,840mm',
    bedSpace: 'Full-length bed for two',
    engine: 'Diesel 2.8L or Petrol 2.7L',
    drive: '2WD or 4WD',
    priceRange: 'From ~$25,000',
    image: '/images/path-source.jpg',
    browseFilter: '?model=hiace_h200&size=LWB',
    highlights: ['Easier to park & drive daily', 'Fits in standard garage', 'Great for weekenders'],
  },
  {
    name: 'H200 SLWB',
    subtitle: 'Super Long Wheelbase',
    bestFor: 'Full-timers & families',
    length: '5,380mm',
    bedSpace: 'Full-length bed + extra living space',
    engine: 'Diesel 2.8L or Petrol 2.7L',
    drive: '2WD or 4WD',
    priceRange: 'From ~$30,000',
    image: '/images/path-source.jpg',
    browseFilter: '?model=hiace_h200&size=SLWB',
    highlights: ['Most popular for camper builds', 'Extra 540mm of living space', 'Room for kitchen + bed + storage'],
  },
  {
    name: '300 Series LWB',
    subtitle: 'New Generation Long',
    bestFor: 'Modern comfort seekers',
    length: '5,265mm',
    bedSpace: 'Full-length bed for two',
    engine: 'Diesel 2.8L',
    drive: '2WD or 4WD',
    priceRange: 'From ~$35,000',
    image: '/images/path-source.jpg',
    browseFilter: '?model=hiace_300&size=LWB',
    highlights: ['Newest platform (2019+)', 'Better safety & ride comfort', 'Semi-bonneted design'],
  },
  {
    name: '300 Series SLWB',
    subtitle: 'New Generation Super Long',
    bestFor: 'The ultimate base van',
    length: '5,915mm',
    bedSpace: 'Maximum living space',
    engine: 'Diesel 2.8L',
    drive: '2WD or 4WD',
    priceRange: 'From ~$40,000',
    image: '/images/path-source.jpg',
    browseFilter: '?model=hiace_300&size=SLWB',
    highlights: ['Maximum interior space', 'Most room for a full build', 'Newest safety features'],
  },
]

// ── Auction Grades ──────────────────────────────────────────────────────────

const GRADES = [
  { grade: 'S',   label: 'New / As New',      desc: 'Brand new or delivery km only. Virtually flawless.', colour: 'bg-green-100 text-green-800' },
  { grade: '6',   label: 'Excellent',          desc: 'Very low km, no visible wear. Like buying new at a discount.', colour: 'bg-green-50 text-green-700' },
  { grade: '5',   label: 'Very Good',          desc: 'Minor wear consistent with age. Well maintained.', colour: 'bg-blue-50 text-blue-700' },
  { grade: '4.5', label: 'Good',               desc: 'Light scratches or marks. Normal use. Great value sweet spot.', colour: 'bg-blue-50 text-blue-700' },
  { grade: '4',   label: 'Fair',               desc: 'Visible wear, minor dents or scratches. Mechanically sound.', colour: 'bg-amber-50 text-amber-700' },
  { grade: '3.5', label: 'Average',            desc: 'Noticeable wear. May need cosmetic work. Budget-friendly.', colour: 'bg-amber-50 text-amber-700' },
  { grade: '3',   label: 'Below Average',      desc: 'Significant wear or damage. Needs work. Cheapest option.', colour: 'bg-orange-50 text-orange-700' },
  { grade: 'R',   label: 'Repaired / Accident', desc: 'Has been in an accident and repaired. Check carefully.', colour: 'bg-red-50 text-red-700' },
  { grade: 'RA',  label: 'Accident History',    desc: 'Repaired accident damage. Structural impact possible.', colour: 'bg-red-50 text-red-700' },
]

// ── Main Component ──────────────────────────────────────────────────────────

export default function BrowseGuide() {
  const [expandedVan, setExpandedVan] = useState<string | null>(null)

  return (
    <div className="bg-white">

      {/* ── Scout Request ── */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-ocean uppercase tracking-wider mb-2">Van Scout</p>
          <h2 className="text-3xl text-charcoal mb-3">Can&apos;t find what you&apos;re looking for?</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Tell us what you want and we&apos;ll find it. Our buyer in Japan attends auctions every week — we&apos;ll let you know when the right van comes up.
          </p>
        </div>
        <div className="bg-cream rounded-2xl p-6 md:p-8">
          <ScoutForm />
        </div>
      </section>

      {/* ── Van Breakdown ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-bold text-ocean uppercase tracking-wider mb-2">Know Your Van</p>
            <h2 className="text-3xl text-charcoal mb-3">Which Hiace is right for you?</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Four sizes, two generations. Here&apos;s what you need to know about each one — and what it looks like as a Bare Camper.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VAN_TYPES.map(van => (
              <div key={van.name}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setExpandedVan(expandedVan === van.name ? null : van.name)}
              >
                <div className="relative h-44 bg-gray-100">
                  <Image src={van.image} alt={van.name} fill className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-charcoal">{van.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{van.subtitle}</p>
                  <p className="text-sm text-ocean font-semibold mb-3">{van.bestFor}</p>

                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Length</span><span className="font-medium text-charcoal">{van.length}</span></div>
                    <div className="flex justify-between"><span>Engine</span><span className="font-medium text-charcoal">{van.engine}</span></div>
                    <div className="flex justify-between"><span>Drive</span><span className="font-medium text-charcoal">{van.drive}</span></div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-lg font-bold text-ocean">{van.priceRange}</p>
                    <p className="text-xs text-gray-400">Landed in Australia, before conversion</p>
                  </div>

                  {expandedVan === van.name && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1.5">Best for</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {van.highlights.map(h => <li key={h}>✓ {h}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1.5">As a Bare Camper</p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>+ Standing room: <span className="font-medium">$13,090</span></p>
                          <p>+ Starter electrical: <span className="font-medium">$5,000</span></p>
                          <p className="text-ocean font-semibold pt-1">Self-contained from ~${(parseInt(van.priceRange.replace(/[^0-9]/g, '')) + 18).toLocaleString()},090</p>
                        </div>
                      </div>
                      <Link href={`/browse${van.browseFilter}`}
                        className="block text-center py-2 bg-ocean text-white text-sm font-semibold rounded-lg hover:bg-ocean/90 transition-colors">
                        Browse {van.name} vans →
                      </Link>
                    </div>
                  )}

                  <button className="mt-3 text-xs text-ocean font-medium hover:underline">
                    {expandedVan === van.name ? 'Less ▲' : 'More details ▼'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Auction Grade Explainer ── */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-ocean uppercase tracking-wider mb-2">Auction Grades</p>
          <h2 className="text-3xl text-charcoal mb-3">What do the grades mean?</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Every van at Japanese auction gets an inspection grade. Here&apos;s what to aim for — and what to avoid.
          </p>
        </div>

        <div className="bg-cream rounded-2xl overflow-hidden">
          <div className="p-4 md:p-6 space-y-2">
            {GRADES.map(g => (
              <div key={g.grade} className="flex items-start gap-4 bg-white rounded-xl p-4">
                <span className={`text-lg font-bold w-10 h-10 flex items-center justify-center rounded-lg shrink-0 ${g.colour}`}>
                  {g.grade}
                </span>
                <div>
                  <p className="font-semibold text-charcoal">{g.label}</p>
                  <p className="text-sm text-gray-600">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-ocean/10 px-6 py-4">
            <p className="text-sm text-ocean font-semibold">
              💡 Our recommendation: Grade 4 or above is ideal for a camper build. Grade 4.5 is the sweet spot — great condition at a fair price.
            </p>
          </div>
        </div>
      </section>

      {/* ── Guide Lead Magnet ── */}
      <section className="bg-charcoal py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-sand uppercase tracking-wider mb-2">Free Guide</p>
          <h2 className="text-3xl text-white mb-3">The Camper&apos;s Guide to Buying a Hiace</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Everything you need to know before buying — why the DX beats the GL, what to look for on the auction sheet, the grades that matter, and how to turn a bare van into a camper for under $50k.
          </p>
          <GuideSignup />
        </div>
      </section>
    </div>
  )
}

// ── Guide Email Signup ──────────────────────────────────────────────────────

function GuideSignup() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!email) return
    setSubmitting(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'guide_download',
          lead_type: 'guide_download',
          email,
          source: 'browse_page_guide',
          notes: 'Requested Hiace Buying Guide PDF',
        }),
      })
      setSubmitted(true)
    } catch {
      // Silent fail — still show success
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-white">
        <p className="text-xl mb-1">📬 Check your inbox!</p>
        <p className="text-white/70 text-sm">We&apos;ll send the guide to {email} shortly.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
        className="flex-1 px-4 py-3 rounded-lg text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <button onClick={handleSubmit} disabled={submitting}
        className="px-6 py-3 bg-ocean text-white font-semibold rounded-lg hover:bg-ocean/90 disabled:opacity-50 transition-colors whitespace-nowrap">
        {submitting ? 'Sending...' : 'Send Me the Guide'}
      </button>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent'
