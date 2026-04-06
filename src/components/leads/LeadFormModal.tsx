'use client'
import { useState } from 'react'
import { trackLead } from '@/lib/pixel-events'
import { trackEvent } from '@/lib/analytics'

const AU_STATES = ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT']

interface Props {
  /** Label shown on the trigger button */
  trigger: string
  /** Lead source identifier stored in DB */
  source: string
  /** Lead type — defaults to 'consultation' */
  leadType?: 'consultation' | 'deposit_intent' | 'enquiry' | 'pop_top_booking'
  /** If linked to a build, pass the share slug */
  buildSlug?: string
  /** Override the trigger button classes */
  className?: string
  /** Modal title override */
  title?: string
  /** Modal subtitle override */
  subtitle?: string
}

export default function LeadFormModal({
  trigger,
  source,
  leadType = 'consultation',
  buildSlug,
  className,
  title,
  subtitle,
}: Props) {
  const [open,       setOpen]       = useState(false)
  const [sent,       setSent]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name,       setName]       = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    const submittedName = fd.get('name') as string
    setName(submittedName.split(' ')[0] ?? submittedName)

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:       leadType === 'deposit_intent' ? 'interest' : 'consultation',
          lead_type:  leadType,
          name:       submittedName,
          email:      fd.get('email'),
          phone:      fd.get('phone') || null,
          state:      fd.get('state') || null,
          notes:      fd.get('message') || null,
          build_slug: buildSlug ?? null,
          source,
        }),
      })
    } catch { /* swallow — show success anyway */ }

    trackLead(source)
    trackEvent('submit_lead', { source })
    setSent(true)
    setSubmitting(false)
  }

  function handleClose() {
    setOpen(false)
    // Reset after animation completes
    setTimeout(() => { setSent(false); setName('') }, 300)
  }

  const modalTitle = title ?? (leadType === 'deposit_intent' ? 'Hold This Van' : leadType === 'pop_top_booking' ? 'Book Your Build Slot' : 'Book a Free Consultation')
  const modalSubtitle = subtitle ?? (leadType === 'deposit_intent'
    ? "We'll contact you to arrange the $2,750 refundable deposit and secure this van."
    : leadType === 'pop_top_booking'
    ? 'Get in touch and we\'ll schedule your 10-business-day build slot.'
    : 'Free 20-minute call with Jared. We\'ll talk through your build options. No obligation.')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'btn-secondary px-6 py-3'}
      >
        {trigger}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-charcoal text-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl mb-1">{modalTitle}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{modalSubtitle}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/50 hover:text-white mt-0.5 shrink-0 text-xl leading-none"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      name="name"
                      required
                      placeholder="Your name"
                      className="input-field col-span-2"
                    />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Email address"
                    className="input-field"
                  />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Phone (optional)"
                    className="input-field"
                  />
                  <select name="state" className="input-field">
                    <option value="">State / Territory (optional)</option>
                    {AU_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Any questions or notes..."
                    className="input-field resize-none"
                  />

                  {leadType === 'deposit_intent' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
                      No payment taken here. We will contact you to arrange the $2,750 refundable deposit and lock in this van.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Sending…' : 'Send →'}
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    Or email directly:{' '}
                    <a href="mailto:jared@dreamdrive.life" className="text-ocean hover:underline">
                      jared@dreamdrive.life
                    </a>
                  </p>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">✅</div>
                  <h4 className="text-2xl text-charcoal mb-2">
                    Thanks{name ? `, ${name}` : ''}!
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    We&apos;ll be in touch within 24 hours to discuss your build.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-6 text-ocean font-semibold text-sm hover:underline"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
