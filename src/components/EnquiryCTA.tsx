'use client'

import { useState } from 'react'
import Image from 'next/image'
import { trackEvent } from '@/lib/analytics'

const TABS = [
  { id: 'enquiry', label: 'Make an Enquiry', image: '/images/kuma/interior-dining.jpg' },
  { id: 'brochure', label: 'Request a Brochure', image: '/images/kuma/exterior-side.jpg' },
  { id: 'finance', label: 'Need Finance?', image: '/images/kuma/exterior-front.jpg' },
] as const

type TabId = typeof TABS[number]['id']

const MODELS = [
  { value: '', label: 'Select a model...' },
  { value: 'mana', label: 'MANA — Compact Adventurer' },
  { value: 'tama', label: 'TAMA — Family Campervan' },
  { value: 'kuma-q', label: 'KUMA-Q — SLWB Full Build' },
  { value: 'van-only', label: 'Just the Van (no conversion)' },
  { value: 'roof-only', label: 'Van + Roof Conversion Only' },
  { value: 'other', label: 'Not sure yet' },
]

interface Props {
  /** Pre-select a model (e.g. on product pages) */
  defaultModel?: string
  /** Image to show beside the form */
  image?: string
}

export default function EnquiryCTA({ defaultModel, image }: Props) {
  const [tab, setTab] = useState<TabId>('enquiry')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    model: defaultModel ?? '',
    message: '',
    budget: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const source = tab === 'brochure' ? 'brochure_request' : tab === 'finance' ? 'finance_enquiry' : 'model_enquiry'

    // Submit to Supabase leads
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone || null,
          source,
          notes: [
            `Model: ${form.model || 'Not specified'}`,
            tab === 'finance' && form.budget ? `Budget: ${form.budget}` : null,
            form.message ? `Message: ${form.message}` : null,
            `Tab: ${tab}`,
          ].filter(Boolean).join('\n'),
        }),
      })
    } catch { /* show success anyway */ }

    // Submit to HubSpot
    try {
      await fetch('https://api.hsforms.com/submissions/v3/integration/submit/8672029/a370fa84-ae00-4d8b-8d4d-dd6b1fd16641', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: [
            { name: 'firstname', value: form.firstName },
            { name: 'lastname', value: form.lastName },
            { name: 'email', value: form.email },
            { name: 'phone', value: form.phone },
            { name: 'message', value: [
              `[${tab === 'brochure' ? 'Brochure Request' : tab === 'finance' ? 'Finance Enquiry' : 'Enquiry'}]`,
              `Model: ${form.model || 'Not specified'}`,
              tab === 'finance' && form.budget ? `Budget: ${form.budget}` : '',
              form.message || '',
            ].filter(Boolean).join('\n') },
          ],
          context: {
            pageUri: typeof window !== 'undefined' ? window.location.href : '',
            pageName: typeof document !== 'undefined' ? document.title : '',
          },
        }),
      })
    } catch { /* HubSpot optional */ }

    trackEvent('submit_lead', { source, model: form.model, tab })
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <section className="bg-stone-50 rounded-2xl overflow-hidden border border-stone-200">
        <div className="p-12 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-stone-900 mb-2">
            {tab === 'brochure' ? 'Brochure on its way!' : tab === 'finance' ? 'Finance enquiry received!' : 'We\'ll be in touch!'}
          </h3>
          <p className="text-stone-500 max-w-md mx-auto">
            {tab === 'brochure'
              ? 'Check your email for the full spec sheet and pricing. If you have questions, call us on 0432 182 892.'
              : 'Jared or Andrew will get back to you within 24 hours. If it\'s urgent, call us direct on 0432 182 892.'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-stone-50 rounded-2xl overflow-hidden border border-stone-200">
      {/* Tabs */}
      <div className="border-b border-stone-200">
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-4 text-sm font-semibold text-center transition-all ${
                tab === t.id
                  ? 'bg-white text-stone-900 border-b-2 border-stone-900'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3 p-6 md:p-8">
          <h3 className="text-xl font-bold text-stone-900 mb-1">
            {tab === 'brochure' ? 'Get the Full Spec Sheet' : tab === 'finance' ? 'Explore Finance Options' : 'Interested in This Model?'}
          </h3>
          <p className="text-stone-500 text-sm mb-6">
            {tab === 'brochure'
              ? 'We\'ll email you the brochure with full specs, layouts, and pricing.'
              : tab === 'finance'
              ? 'Stratton Finance can help with campervan loans. Tell us your budget and we\'ll get you a quote.'
              : 'Tell us a few details and we\'ll help you take the next step, whether that\'s getting a quote or booking a viewing.'}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">First Name *</label>
                <input required value={form.firstName} onChange={set('firstName')} className="w-full border-b-2 border-stone-200 bg-transparent px-0 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" placeholder="First name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Last Name *</label>
                <input required value={form.lastName} onChange={set('lastName')} className="w-full border-b-2 border-stone-200 bg-transparent px-0 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" placeholder="Last name" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Email Address *</label>
                <input required type="email" value={form.email} onChange={set('email')} className="w-full border-b-2 border-stone-200 bg-transparent px-0 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" placeholder="you@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Mobile Number</label>
                <input type="tel" value={form.phone} onChange={set('phone')} className="w-full border-b-2 border-stone-200 bg-transparent px-0 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" placeholder="04XX XXX XXX" />
              </div>
            </div>

            <div className={`grid ${tab === 'finance' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-4`}>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Select Your Preferred Model *</label>
                <select required value={form.model} onChange={set('model')} className="w-full border-b-2 border-stone-200 bg-transparent px-0 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition">
                  {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {tab === 'finance' && (
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1.5">Budget Range</label>
                  <select value={form.budget} onChange={set('budget')} className="w-full border-b-2 border-stone-200 bg-transparent px-0 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition">
                    <option value="">Select budget...</option>
                    <option value="under-50k">Under $50,000</option>
                    <option value="50-75k">$50,000 – $75,000</option>
                    <option value="75-100k">$75,000 – $100,000</option>
                    <option value="100-130k">$100,000 – $130,000</option>
                    <option value="over-130k">Over $130,000</option>
                  </select>
                </div>
              )}
            </div>

            {tab !== 'brochure' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Message</label>
                <textarea value={form.message} onChange={set('message')} rows={3} className="w-full border-b-2 border-stone-200 bg-transparent px-0 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition resize-none" placeholder="Tell us what you're looking for..." />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-stone-900 text-white font-semibold py-3.5 rounded-lg hover:bg-stone-800 active:scale-[0.98] transition text-sm disabled:opacity-50"
            >
              {submitting ? 'Sending...' : tab === 'brochure' ? 'Send Me the Brochure' : tab === 'finance' ? 'Get a Finance Quote' : 'Submit Enquiry'}
            </button>

            <p className="text-xs text-stone-400 mt-3 text-center">
              Or call us direct: <a href="tel:0432182892" className="text-stone-600 underline">0432 182 892</a>
            </p>
          </form>
        </div>

        {/* Image — changes per tab */}
        <div className="hidden lg:block lg:col-span-2 relative">
          {TABS.map(t => (
            <Image
              key={t.id}
              src={image || t.image}
              alt={`Bare Camper — ${t.label}`}
              fill
              className={`object-cover transition-opacity duration-500 ${tab === t.id ? 'opacity-100' : 'opacity-0'}`}
              sizes="400px"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
