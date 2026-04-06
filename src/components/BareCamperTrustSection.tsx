'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

// ============================================================
// Bare Camper — Trust & Conversion Section
// Covers:
//   1. Request a Callback form
//   2. Visit Our Workshop (Capalaba) CTA
//   3. Downloadable Brochures (MANA, TAMA/KUMA)
// ============================================================

// --- Callback Form ---
function CallbackForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: 'mana', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone,
          source: `callback_${form.interest}`,
          notes: `Interest: ${form.interest}${form.message ? `\n${form.message}` : ''}`,
        }),
      })
    } catch { /* show success anyway */ }

    trackEvent('submit_lead', { source: 'callback_form', interest: form.interest })
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
        <div className="text-3xl mb-3">✅</div>
        <h3 className="text-xl font-semibold text-stone-900 mb-2">We&apos;ll be in touch</h3>
        <p className="text-stone-500 text-sm">
          Jared or Andrew will call you back within 24 hours. If it&apos;s urgent, call us direct on{' '}
          <a href="tel:0432182892" className="text-stone-900 underline">0432 182 892</a>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8">
      <h3 className="text-lg font-semibold text-stone-900 mb-1">Request a callback</h3>
      <p className="text-stone-500 text-sm mb-6">
        No pressure, no scripts. Just a chat with the people who build the vans.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 transition"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Phone</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 transition"
            placeholder="04XX XXX XXX"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 transition"
          placeholder="you@email.com (optional)"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
          I&apos;m interested in
        </label>
        <select
          value={form.interest}
          onChange={(e) => setForm({ ...form, interest: e.target.value })}
          className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300 transition"
        >
          <option value="just-van">Just the van (import only)</option>
          <option value="van-roof">Van + roof conversion</option>
          <option value="mana">MANA — liveable compact (couples)</option>
          <option value="tama">TAMA — pop-top family</option>
          <option value="kuma">KUMA Q — 4x4 SLWB</option>
          <option value="diy">DIY build — need parts/advice</option>
          <option value="other">Something else</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
          Anything else? <span className="text-stone-400">(optional)</span>
        </label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={3}
          className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 transition resize-none"
          placeholder="Budget, timeline, questions..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-stone-900 text-white font-medium py-3 rounded-lg hover:bg-stone-800 active:scale-[0.98] transition text-sm disabled:opacity-50"
      >
        {submitting ? 'Sending...' : 'Request callback'}
      </button>

      <p className="text-xs text-stone-400 mt-3 text-center">
        Or call us direct:{' '}
        <a href="tel:0432182892" className="text-stone-600 underline">0432 182 892</a>
      </p>
    </form>
  )
}

// --- Visit Workshop CTA ---
function WorkshopCTA() {
  return (
    <div className="bg-stone-900 text-white rounded-2xl overflow-hidden">
      {/* Map placeholder */}
      <div className="h-48 bg-stone-800 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2 opacity-60">📍</div>
            <p className="text-stone-400 text-xs uppercase tracking-widest">Capalaba, Brisbane</p>
          </div>
        </div>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="p-6 md:p-8">
        <p className="text-stone-400 text-xs uppercase tracking-widest mb-2">Visit our workshop</p>
        <h3 className="text-xl font-semibold mb-3">See the builds in person</h3>
        <p className="text-stone-300 text-sm leading-relaxed mb-6">
          DIY RV Solutions, Capalaba — where every Bare Camper roof and fit-out is made.
          25+ years of fiberglass experience. Walk through finished vans, see builds in progress,
          and talk direct with Andrew and the team. No appointment needed, but it helps.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-stone-500 text-sm mt-0.5">📌</span>
            <div>
              <p className="text-sm font-medium">DIY RV Solutions</p>
              <p className="text-stone-400 text-sm">Capalaba QLD 4157</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-stone-500 text-sm mt-0.5">📞</span>
            <div>
              <p className="text-sm">
                <a href="tel:0432182892" className="text-white hover:underline">0432 182 892</a>
                <span className="text-stone-500 ml-2">Jared</span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-stone-500 text-sm mt-0.5">🕐</span>
            <p className="text-stone-400 text-sm">Mon–Fri 8am–4pm · Sat by appointment</p>
          </div>
        </div>

        <a
          href="https://maps.google.com/?q=DIY+RV+Solutions+Capalaba+QLD"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('workshop_directions', { source: 'trust_section' })}
          className="inline-flex items-center gap-2 bg-white text-stone-900 font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-stone-100 active:scale-[0.98] transition"
        >
          Get directions
          <span className="text-xs">↗</span>
        </a>
      </div>
    </div>
  )
}

// --- Brochure Downloads ---
function BrochureDownloads() {
  const brochures = [
    {
      name: 'MANA',
      subtitle: 'Liveable compact campervan',
      specs: 'Pop-top · 2 berth · SWB · From $105K',
      color: 'bg-emerald-50 border-emerald-200',
      accent: 'text-emerald-700',
      href: '/brochures/The_MANA_2026_Price_lists.pdf',
    },
    {
      name: 'TAMA',
      subtitle: 'Pop-top family campervan',
      specs: 'Pop-top · 2–5 berth · SWB · From $106K',
      color: 'bg-amber-50 border-amber-200',
      accent: 'text-amber-700',
      href: '/brochures/Tama_2026_Price_list.pdf',
    },
    {
      name: 'KUMA Q',
      subtitle: '4x4 adventure campervan',
      specs: 'Hi-roof · 2–4 berth · SLWB · From $120K',
      color: 'bg-sky-50 border-sky-200',
      accent: 'text-sky-700',
      href: '/brochures/English_Spec_Sheet_-_KUMA.pdf',
    },
  ]

  return (
    <div>
      <p className="text-stone-500 text-xs uppercase tracking-widest mb-2">Download brochures</p>
      <h3 className="text-lg font-semibold text-stone-900 mb-1">Take it home. Share it around.</h3>
      <p className="text-stone-500 text-sm mb-6">
        Full spec sheets with pricing, layouts, and options. PDF — works offline.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {brochures.map((b) => (
          <a
            key={b.name}
            href={b.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('download_brochure', { model: b.name })}
            className={`block border rounded-xl p-5 hover:shadow-md transition group ${b.color}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xl font-bold ${b.accent}`}>{b.name}</span>
              <span className="text-stone-400 group-hover:text-stone-600 transition text-lg">⬇</span>
            </div>
            <p className="text-stone-700 text-sm font-medium mb-1">{b.subtitle}</p>
            <p className="text-stone-500 text-xs">{b.specs}</p>
            <p className="text-xs text-stone-400 mt-3">PDF · Full spec sheet &amp; pricing</p>
          </a>
        ))}
      </div>

      <p className="text-xs text-stone-400 mt-4">
        * Pricing based on new vehicle. Final price varies with vehicle age, condition, and options selected.
        Contact us for a personalised quote.
      </p>
    </div>
  )
}

// --- Main Section Export ---
export default function BareCamperTrustSection() {
  return (
    <section className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-12">
        <p className="text-stone-500 text-xs uppercase tracking-widest mb-2">Get started</p>
        <h2 className="text-2xl md:text-3xl font-semibold text-stone-900 mb-3">
          Ready when you are.
        </h2>
        <p className="text-stone-500 max-w-lg mx-auto text-sm leading-relaxed">
          Download a brochure, request a callback, or come see the builds in person
          at our Capalaba workshop. No commitment, no pressure.
        </p>
      </div>

      {/* Top row: Callback + Workshop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <CallbackForm />
        <WorkshopCTA />
      </div>

      {/* Brochure downloads */}
      <BrochureDownloads />
    </section>
  )
}
