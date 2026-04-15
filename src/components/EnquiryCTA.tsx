'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { trackEvent } from '@/lib/analytics'
import { useSpamGuard } from '@/hooks/useSpamGuard'

// ── Config ──────────────────────────────────────────────────────────────────

const ACCENT = '#c45a3c'

const TABS = [
  { id: 'enquiry', label: 'Make an enquiry', image: '/images/cta/cta-enquiry.jpg' },
  { id: 'brochure', label: 'Get a brochure', image: '/images/cta/cta-brochure.jpg' },
  { id: 'finance', label: 'Need finance?', image: '/images/cta/cta-finance.jpg' },
] as const

type TabId = typeof TABS[number]['id']

const INTEREST_OPTIONS = [
  { value: '', label: 'Select your interest...' },
  { value: 'sourcing-van', label: 'Sourcing a van from Japan' },
  { value: 'roof-conversion', label: 'Pop top / hi-top roof conversion' },
  { value: 'full-build', label: 'Full campervan build (MANA / TAMA / KUMA Q)' },
  { value: 'diy-kits', label: 'DIY electrical / fitout kits' },
  { value: 'selling', label: 'Selling my van through Bare Camper' },
  { value: 'general', label: 'Just browsing / general question' },
]

const BROCHURE_OPTIONS = [
  { value: '', label: 'Select a brochure...' },
  { value: 'mana', label: 'MANA — couples pop-top' },
  { value: 'tama', label: 'TAMA — family pop-top' },
  { value: 'kuma-q', label: 'KUMA Q — SLWB touring' },
  { value: 'all', label: 'All three' },
]

const FINANCE_OPTIONS = [
  { value: '', label: 'Select financing type...' },
  { value: 'van-only', label: 'Van purchase only (~$25–45k)' },
  { value: 'van-roof', label: 'Van + roof conversion (~$38–58k)' },
  { value: 'full-build', label: 'Van + full campervan build (~$70–130k)' },
  { value: 'roof-only', label: 'Roof conversion only (~$13–25k)' },
  { value: 'not-sure', label: 'Not sure yet' },
]

const BROCHURE_LINKS: Record<string, { name: string; url: string }[]> = {
  mana: [{ name: 'MANA Spec Sheet', url: '/brochures/The_MANA_2026_Price_lists.pdf' }],
  tama: [{ name: 'TAMA Spec Sheet', url: '/brochures/Tama_2026_Price_list.pdf' }],
  'kuma-q': [{ name: 'KUMA Q Spec Sheet', url: '/brochures/English_Spec_Sheet_-_KUMA.pdf' }],
  all: [
    { name: 'MANA Spec Sheet', url: '/brochures/The_MANA_2026_Price_lists.pdf' },
    { name: 'TAMA Spec Sheet', url: '/brochures/Tama_2026_Price_list.pdf' },
    { name: 'KUMA Q Spec Sheet', url: '/brochures/English_Spec_Sheet_-_KUMA.pdf' },
  ],
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
    const val = params.get(key)
    if (val) utm[key] = val
  }
  return utm
}

const inputCls = 'w-full border-b-2 border-stone-200 bg-transparent px-0 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#c45a3c] transition'
const selectCls = 'w-full border-b-2 border-stone-200 bg-transparent px-0 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#c45a3c] transition appearance-none'
const labelCls = 'block text-xs font-medium text-stone-500 mb-1 tracking-wide'

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  vanTitle?: string
  vanId?: string
  defaultModel?: string
  defaultTab?: TabId
}

// ── Component ───────────────────────────────────────────────────────────────

export default function EnquiryCTA({ vanTitle, vanId, defaultModel, defaultTab }: Props) {
  const [tab, setTab] = useState<TabId>(defaultTab ?? 'enquiry')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<TabId | null>(null)
  const [utmParams, setUtmParams] = useState<Record<string, string>>({})
  const { honeypotProps, isSpam, markSubmitted } = useSpamGuard()

  // Enquiry form
  const [eq, setEq] = useState({ firstName: '', lastName: '', email: '', phone: '', interest: defaultModel ? 'full-build' : '', message: '' })
  // Brochure form
  const [br, setBr] = useState({ firstName: '', email: '', brochure: defaultModel ?? '' })
  // Finance form
  const [fi, setFi] = useState({ firstName: '', lastName: '', email: '', phone: '', financing: '', budget: '' })

  useEffect(() => { setUtmParams(getUtmParams()) }, [])

  const submitToSupabase = async (source: string, data: Record<string, string | null>) => {
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source }),
      })
    } catch { /* fire and forget */ }
  }

  const submitToHubSpot = async (fields: { name: string; value: string }[]) => {
    // Add UTM + page context as hidden fields
    const allFields = [
      ...fields,
      ...Object.entries(utmParams).map(([name, value]) => ({ name, value })),
      { name: 'hs_lead_status', value: 'NEW' },
    ]
    if (vanTitle) allFields.push({ name: 'message', value: `[Van: ${vanTitle}${vanId ? ` (${vanId})` : ''}]\n${fields.find(f => f.name === 'message')?.value || ''}` })

    try {
      await fetch('https://api.hsforms.com/submissions/v3/integration/submit/8672029/a370fa84-ae00-4d8b-8d4d-dd6b1fd16641', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: allFields,
          context: {
            pageUri: typeof window !== 'undefined' ? window.location.href : '',
            pageName: typeof document !== 'undefined' ? document.title : '',
          },
        }),
      })
    } catch { /* HubSpot optional */ }
  }

  // ── Submit handlers ───────────────────────────────────────────────────

  const submitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSpam()) { setSubmitted('enquiry'); return }
    setSubmitting(true)
    const interest = INTEREST_OPTIONS.find(o => o.value === eq.interest)?.label ?? eq.interest

    await submitToSupabase('enquiry_form', {
      name: `${eq.firstName} ${eq.lastName}`.trim(),
      email: eq.email,
      phone: eq.phone || null,
      notes: `Interest: ${interest}\n${eq.message}${vanTitle ? `\nVan: ${vanTitle}` : ''}`,
    })

    await submitToHubSpot([
      { name: 'firstname', value: eq.firstName },
      { name: 'lastname', value: eq.lastName },
      { name: 'email', value: eq.email },
      { name: 'phone', value: eq.phone },
      { name: 'message', value: `[Enquiry] Interest: ${interest}\n${eq.message}` },
    ])

    trackEvent('submit_lead', { source: 'enquiry_form', interest: eq.interest })
    setSubmitted('enquiry')
    setSubmitting(false)
  }

  const submitBrochure = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSpam()) { setSubmitted('brochure'); return }
    setSubmitting(true)
    const brochureName = BROCHURE_OPTIONS.find(o => o.value === br.brochure)?.label ?? br.brochure

    await submitToSupabase('brochure_request', {
      name: br.firstName,
      email: br.email,
      phone: null,
      notes: `Brochure: ${brochureName}`,
    })

    await submitToHubSpot([
      { name: 'firstname', value: br.firstName },
      { name: 'email', value: br.email },
      { name: 'message', value: `[Brochure Request] ${brochureName}` },
    ])

    trackEvent('download_brochure', { model: br.brochure })
    setSubmitted('brochure')
    setSubmitting(false)
  }

  const submitFinance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSpam()) { setSubmitted('finance'); return }
    setSubmitting(true)
    const financingLabel = FINANCE_OPTIONS.find(o => o.value === fi.financing)?.label ?? fi.financing

    await submitToSupabase('finance_enquiry', {
      name: `${fi.firstName} ${fi.lastName}`.trim(),
      email: fi.email,
      phone: fi.phone,
      notes: `Finance: ${financingLabel}\nBudget: ${fi.budget || 'Not specified'}`,
    })

    await submitToHubSpot([
      { name: 'firstname', value: fi.firstName },
      { name: 'lastname', value: fi.lastName },
      { name: 'email', value: fi.email },
      { name: 'phone', value: fi.phone },
      { name: 'message', value: `[Finance Enquiry] ${financingLabel}\nBudget: ${fi.budget || 'Not specified'}` },
    ])

    trackEvent('submit_lead', { source: 'finance_enquiry', financing: fi.financing })
    setSubmitted('finance')
    setSubmitting(false)
  }

  // ── Success states ────────────────────────────────────────────────────

  if (submitted === 'brochure') {
    const links = BROCHURE_LINKS[br.brochure] ?? BROCHURE_LINKS.all
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center">
        <div className="text-4xl mb-3">📄</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Your brochure is ready!</h3>
        <p className="text-stone-500 text-sm mb-6">Download below or check your email.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          {links?.map(l => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition" style={{ background: ACCENT }}>
              ⬇ {l.name}
            </a>
          ))}
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">
          {submitted === 'finance' ? 'Finance enquiry received!' : 'Thanks — we\'ll be in touch!'}
        </h3>
        <p className="text-stone-500 text-sm">
          {submitted === 'finance'
            ? 'Stratton Finance will contact you within 24 hours with a quote. Questions? Call Jared on 0432 182 892.'
            : 'Jared or Andrew will get back to you within 24 hours. Call us direct on 0432 182 892 if it\'s urgent.'}
        </p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Tab bar */}
      <div className="flex border-b border-stone-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-4 text-sm font-semibold text-center transition-all relative ${
              tab === t.id ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: ACCENT }} />}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Mobile photo */}
        <div className="lg:hidden relative h-48 w-full">
          {TABS.map(t => (
            <Image key={t.id} src={t.image} alt="" fill className={`object-cover transition-opacity duration-500 ${tab === t.id ? 'opacity-100' : 'opacity-0'}`} sizes="100vw" />
          ))}
        </div>

        {/* Form area — 60% */}
        <div className="flex-1 lg:w-[60%] p-6 md:p-8 lg:p-10">

          {/* ── TAB 1: ENQUIRY ─────────────────────── */}
          {tab === 'enquiry' && (
            <form onSubmit={submitEnquiry}>
              <input {...honeypotProps} />
              <h3 className="text-xl font-bold text-stone-900 mb-1">Interested in this van?</h3>
              <p className="text-stone-500 text-sm mb-6">Tell us a few details and we&apos;ll help you take the next step — whether that&apos;s getting a quote, booking a walkthrough, or just asking a question.</p>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                <div><label className={labelCls}>First Name *</label><input required value={eq.firstName} onChange={e => setEq(f => ({ ...f, firstName: e.target.value }))} className={inputCls} placeholder="First name" /></div>
                <div><label className={labelCls}>Last Name *</label><input required value={eq.lastName} onChange={e => setEq(f => ({ ...f, lastName: e.target.value }))} className={inputCls} placeholder="Last name" /></div>
                <div><label className={labelCls}>Email Address *</label><input required type="email" value={eq.email} onChange={e => setEq(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="you@email.com" /></div>
                <div><label className={labelCls}>Mobile Number</label><input type="tel" value={eq.phone} onChange={e => setEq(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="04XX XXX XXX" /></div>
              </div>
              <div className="mb-4"><label className={labelCls}>Select Your Interest *</label><select required value={eq.interest} onChange={e => setEq(f => ({ ...f, interest: e.target.value }))} className={selectCls}>{INTEREST_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              <div className="mb-6"><label className={labelCls}>Message</label><textarea value={eq.message} onChange={e => setEq(f => ({ ...f, message: e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="Tell us what you're looking for..." /></div>

              <button type="submit" disabled={submitting} className="w-full text-white font-semibold py-3.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition text-sm disabled:opacity-50" style={{ background: ACCENT }}>
                {submitting ? 'Sending...' : 'Send enquiry'}
              </button>
              <p className="text-xs text-stone-400 mt-3 text-center">Or call Jared: <a href="tel:0432182892" className="text-stone-600 underline">0432 182 892</a></p>
            </form>
          )}

          {/* ── TAB 2: BROCHURE ────────────────────── */}
          {tab === 'brochure' && (
            <form onSubmit={submitBrochure}>
              <input {...honeypotProps} />
              <h3 className="text-xl font-bold text-stone-900 mb-1">Download a spec sheet</h3>
              <p className="text-stone-500 text-sm mb-6">Get the full spec sheet and pricing for any of our campervan models. PDF sent straight to your inbox.</p>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                <div><label className={labelCls}>First Name *</label><input required value={br.firstName} onChange={e => setBr(f => ({ ...f, firstName: e.target.value }))} className={inputCls} placeholder="First name" /></div>
                <div><label className={labelCls}>Email Address *</label><input required type="email" value={br.email} onChange={e => setBr(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="you@email.com" /></div>
              </div>
              <div className="mb-6"><label className={labelCls}>Which Brochure? *</label><select required value={br.brochure} onChange={e => setBr(f => ({ ...f, brochure: e.target.value }))} className={selectCls}>{BROCHURE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>

              <button type="submit" disabled={submitting} className="w-full text-white font-semibold py-3.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition text-sm disabled:opacity-50" style={{ background: ACCENT }}>
                {submitting ? 'Sending...' : 'Send me the PDF'}
              </button>
            </form>
          )}

          {/* ── TAB 3: FINANCE ─────────────────────── */}
          {tab === 'finance' && (
            <form onSubmit={submitFinance}>
              <input {...honeypotProps} />
              <h3 className="text-xl font-bold text-stone-900 mb-1">Get a finance quote</h3>
              <p className="text-stone-500 text-sm mb-6">We partner with Stratton Finance to get you competitive rates. Fill in the basics and they&apos;ll be in touch within 24 hours.</p>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                <div><label className={labelCls}>First Name *</label><input required value={fi.firstName} onChange={e => setFi(f => ({ ...f, firstName: e.target.value }))} className={inputCls} placeholder="First name" /></div>
                <div><label className={labelCls}>Last Name *</label><input required value={fi.lastName} onChange={e => setFi(f => ({ ...f, lastName: e.target.value }))} className={inputCls} placeholder="Last name" /></div>
                <div><label className={labelCls}>Email Address *</label><input required type="email" value={fi.email} onChange={e => setFi(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="you@email.com" /></div>
                <div><label className={labelCls}>Mobile Number *</label><input required type="tel" value={fi.phone} onChange={e => setFi(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="04XX XXX XXX" /></div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
                <div><label className={labelCls}>What Are You Financing? *</label><select required value={fi.financing} onChange={e => setFi(f => ({ ...f, financing: e.target.value }))} className={selectCls}>{FINANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                <div><label className={labelCls}>Approx. Budget</label><input value={fi.budget} onChange={e => setFi(f => ({ ...f, budget: e.target.value }))} className={inputCls} placeholder="e.g. $80,000" /></div>
              </div>

              <button type="submit" disabled={submitting} className="w-full text-white font-semibold py-3.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition text-sm disabled:opacity-50" style={{ background: ACCENT }}>
                {submitting ? 'Sending...' : 'Get a finance quote'}
              </button>
              <p className="text-xs text-stone-400 mt-3 text-center">Powered by <span className="font-semibold text-stone-500">Stratton Finance</span></p>
            </form>
          )}
        </div>

        {/* Desktop photo — 40% */}
        <div className="hidden lg:block lg:w-[40%] relative min-h-[500px]">
          {TABS.map(t => (
            <Image key={t.id} src={t.image} alt="" fill className={`object-cover transition-opacity duration-500 ${tab === t.id ? 'opacity-100' : 'opacity-0'}`} sizes="40vw" />
          ))}
        </div>
      </div>
    </div>
  )
}
