'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

const GRADES = [
  { value: '', label: 'Select minimum grade...' },
  { value: '4.5', label: 'Grade 4.5+ (Good — light scratches, great value)' },
  { value: '4', label: 'Grade 4+ (Fair — visible wear, mechanically sound)' },
  { value: '3.5', label: 'Grade 3.5+ (Average — noticeable wear, budget-friendly)' },
  { value: '5', label: 'Grade 5+ (Very Good — minimal wear)' },
]

const DRIVE_OPTIONS = [
  { value: '', label: 'Select drivetrain...' },
  { value: '2wd', label: '2WD' },
  { value: '4wd', label: '4WD' },
  { value: 'either', label: 'Either is fine' },
]

const SIZE_OPTIONS = [
  { value: '', label: 'Select size...' },
  { value: 'lwb', label: 'LWB (Long Wheelbase — 4,840mm)' },
  { value: 'slwb', label: 'SLWB (Super Long Wheelbase — 5,380mm)' },
  { value: 'either', label: 'Either is fine' },
]

interface Props {
  open: boolean
  onClose: () => void
  vanTitle?: string
  vanId?: string
}

export default function SourcingModal({ open, onClose, vanTitle, vanId }: Props) {
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    grade: '', maxKm: '', drive: '', size: '', notes: '',
  })

  if (!open) return null

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const gradeLabel = GRADES.find(g => g.value === form.grade)?.label ?? form.grade
    const driveLabel = DRIVE_OPTIONS.find(d => d.value === form.drive)?.label ?? form.drive
    const sizeLabel = SIZE_OPTIONS.find(s => s.value === form.size)?.label ?? form.size

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
          source: 'sourcing_request',
          notes: [
            vanTitle ? `Reference van: ${vanTitle}` : null,
            vanId ? `Listing ID: ${vanId}` : null,
            `Min grade: ${gradeLabel}`,
            `Max kms: ${form.maxKm || 'No preference'}`,
            `Drivetrain: ${driveLabel}`,
            `Size: ${sizeLabel}`,
            form.notes ? `Notes: ${form.notes}` : null,
          ].filter(Boolean).join('\n'),
        }),
      })
    } catch { /* fire and forget */ }

    // HubSpot
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
            { name: 'message', value: `[Sourcing Request]\nGrade: ${gradeLabel}\nMax kms: ${form.maxKm || 'No pref'}\nDrive: ${driveLabel}\nSize: ${sizeLabel}\n${vanTitle ? `Ref: ${vanTitle}` : ''}\n${form.notes}` },
          ],
          context: {
            pageUri: typeof window !== 'undefined' ? window.location.href : '',
            pageName: typeof document !== 'undefined' ? document.title : '',
          },
        }),
      })
    } catch { /* optional */ }

    trackEvent('sourcing_request', { grade: form.grade, drive: form.drive, size: form.size })
    setStep('success')
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 z-10">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* ── INFO STEP ── */}
        {step === 'info' && (
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Vehicle Sourcing</p>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">How sourcing works</h2>

            <div className="space-y-4 mb-8">
              <p className="text-stone-600 text-sm leading-relaxed">
                We source quality Toyota Hiace vans direct from Japanese auctions. You tell us what you want, we find it, and handle everything from bidding to delivery.
              </p>

              <div className="bg-stone-50 rounded-xl p-5 space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="bg-stone-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div><p className="text-sm font-semibold text-stone-900">Pay $3,000 deposit</p><p className="text-xs text-stone-500">Goes toward your vehicle purchase. Includes our $2,750 sourcing fee.</p></div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="bg-stone-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div><p className="text-sm font-semibold text-stone-900">We search for 30 days</p><p className="text-xs text-stone-500">We find vehicles matching your specs. You pick one.</p></div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="bg-stone-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div><p className="text-sm font-semibold text-stone-900">You approve the cost</p><p className="text-xs text-stone-500">We send you the full breakdown. You say yes or no.</p></div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="bg-stone-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <div><p className="text-sm font-semibold text-stone-900">We bid, buy & ship</p><p className="text-xs text-stone-500">Vehicle price + shipping paid to suppliers. We manage everything.</p></div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="bg-stone-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">5</span>
                  <div><p className="text-sm font-semibold text-stone-900">Pick up in Brisbane</p><p className="text-xs text-stone-500">Complied, registered, and ready to drive. 6–10 weeks total.</p></div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-800 font-semibold mb-1">30-day money-back guarantee</p>
                <p className="text-xs text-green-700">If we can&apos;t find a suitable vehicle within 30 days, we refund the full $3,000 minus $250. No questions asked.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('form')}
              className="w-full bg-stone-900 text-white font-semibold py-3.5 rounded-lg hover:bg-stone-800 active:scale-[0.98] transition text-sm"
            >
              Tell us what you&apos;re looking for →
            </button>
          </div>
        )}

        {/* ── FORM STEP ── */}
        {step === 'form' && (
          <div className="p-6 md:p-8">
            <button onClick={() => setStep('info')} className="text-sm text-stone-400 hover:text-stone-600 mb-4">← Back</button>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Your Requirements</p>
            <h2 className="text-2xl font-bold text-stone-900 mb-1">What are you after?</h2>
            <p className="text-stone-500 text-sm mb-6">Tell us your minimum specs and we&apos;ll find the best match at auction.</p>

            {vanTitle && (
              <div className="bg-ocean/5 border border-ocean/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-ocean font-semibold">Reference vehicle:</p>
                <p className="text-sm text-stone-900">{vanTitle}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-xs font-medium text-stone-500 mb-1">First Name *</label><input required value={form.firstName} onChange={set('firstName')} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" placeholder="First name" /></div>
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Last Name *</label><input required value={form.lastName} onChange={set('lastName')} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" placeholder="Last name" /></div>
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Email *</label><input required type="email" value={form.email} onChange={set('email')} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" placeholder="you@email.com" /></div>
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Phone *</label><input required type="tel" value={form.phone} onChange={set('phone')} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" placeholder="04XX XXX XXX" /></div>
              </div>

              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3 mt-6">Vehicle Specs</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Minimum Auction Grade *</label><select required value={form.grade} onChange={set('grade')} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-300">{GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Max Kilometres</label><input type="number" value={form.maxKm} onChange={set('maxKm')} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" placeholder="e.g. 150000" /></div>
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Drivetrain *</label><select required value={form.drive} onChange={set('drive')} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-300">{DRIVE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Size *</label><select required value={form.size} onChange={set('size')} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-300">{SIZE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-stone-500 mb-1">Anything else?</label>
                <textarea value={form.notes} onChange={set('notes')} rows={3} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none" placeholder="Budget range, colour preference, engine type, timeline..." />
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-stone-900 text-white font-semibold py-3.5 rounded-lg hover:bg-stone-800 active:scale-[0.98] transition text-sm disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Sourcing Request'}
              </button>
              <p className="text-xs text-stone-400 mt-3 text-center">We&apos;ll send you an invoice for the $3,000 deposit to get started.</p>
            </form>
          </div>
        )}

        {/* ── SUCCESS STEP ── */}
        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">We&apos;re on it!</h2>
            <p className="text-stone-500 text-sm mb-4 max-w-md mx-auto">
              Jared will review your requirements and send you an invoice for the $3,000 deposit within 24 hours. Once paid, we start searching immediately.
            </p>
            <div className="bg-stone-50 rounded-xl p-4 text-left max-w-sm mx-auto mb-6">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">What happens next</p>
              <ol className="text-sm text-stone-600 space-y-1.5">
                <li>1. We send you a deposit invoice</li>
                <li>2. You pay $3,000 via bank transfer</li>
                <li>3. We start searching Japanese auctions</li>
                <li>4. We send you options to approve</li>
              </ol>
            </div>
            <button onClick={onClose} className="bg-stone-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-stone-800 text-sm">
              Got it — close
            </button>
            <p className="text-xs text-stone-400 mt-4">
              Questions? Call Jared: <a href="tel:0432182892" className="underline">0432 182 892</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
