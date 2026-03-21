'use client'

import { useState } from 'react'
import { trackLead } from '@/lib/pixel-events'

const PHONE = '61432182892'

const INTEREST_OPTIONS = [
  { value: 'just_van', label: 'Just a van' },
  { value: 'diy_build', label: 'DIY build (van + parts)' },
  { value: 'turnkey', label: 'Turn-key camper' },
  { value: 'not_sure', label: 'Not sure yet' },
]

const BUDGET_OPTIONS = [
  { value: 'under_50k', label: 'Under $50k' },
  { value: '50_80k', label: '$50k – $80k' },
  { value: '80_120k', label: '$80k – $120k' },
  { value: 'over_120k', label: '$120k+' },
]

const TIMELINE_OPTIONS = [
  { value: 'now', label: 'Ready now' },
  { value: '1_3_months', label: '1–3 months' },
  { value: '3_plus', label: '3+ months' },
  { value: 'just_looking', label: 'Just looking' },
]

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [interest, setInterest] = useState('')
  const [budget, setBudget] = useState('')
  const [timeline, setTimeline] = useState('')
  const [name, setName] = useState('')

  const handleSelect = (value: string) => {
    if (step === 0) { setInterest(value); setStep(1) }
    else if (step === 1) { setBudget(value); setStep(2) }
    else if (step === 2) { setTimeline(value); setStep(3) }
  }

  const handleSubmit = () => {
    const interestLabel = INTEREST_OPTIONS.find(o => o.value === interest)?.label ?? interest
    const budgetLabel = BUDGET_OPTIONS.find(o => o.value === budget)?.label ?? budget
    const timelineLabel = TIMELINE_OPTIONS.find(o => o.value === timeline)?.label ?? timeline

    const message = [
      `Hi! I'm ${name || 'interested in a campervan'} from Bare Camper.`,
      '',
      `Looking for: ${interestLabel}`,
      `Budget: ${budgetLabel}`,
      `Timeline: ${timelineLabel}`,
    ].join('\n')

    // Save lead to database
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'consultation',
        lead_type: 'enquiry',
        name: name || null,
        source: 'whatsapp_widget',
        notes: `Interest: ${interestLabel}, Budget: ${budgetLabel}, Timeline: ${timelineLabel}`,
      }),
    }).catch(() => {})

    trackLead('whatsapp_widget')

    // Open WhatsApp
    window.open(
      `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`,
      '_blank'
    )

    // Reset
    setOpen(false)
    setStep(0)
    setInterest('')
    setBudget('')
    setTimeline('')
    setName('')
  }

  const handleClose = () => {
    setOpen(false)
    setStep(0)
    setInterest('')
    setBudget('')
    setTimeline('')
    setName('')
  }

  const questions = [
    { title: 'What are you after?', options: INTEREST_OPTIONS },
    { title: 'Budget range?', options: BUDGET_OPTIONS },
    { title: 'When are you looking to get on the road?', options: TIMELINE_OPTIONS },
  ]

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </button>

      {/* Quiz modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={handleClose}
        >
          <div
            className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#25D366] px-5 py-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <p className="text-white font-semibold text-sm">Chat with Jared</p>
                <p className="text-white/70 text-xs">Quick questions so I can help you better</p>
              </div>
              <button onClick={handleClose} className="ml-auto text-white/60 hover:text-white text-lg">✕</button>
            </div>

            {/* Body */}
            <div className="p-5">
              {step < 3 ? (
                <>
                  {/* Progress dots */}
                  <div className="flex gap-1.5 mb-4">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[#25D366]' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>

                  <p className="text-charcoal font-semibold mb-3">{questions[step].title}</p>
                  <div className="space-y-2">
                    {questions[step].options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-[#25D366] hover:bg-green-50 text-sm text-gray-700 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-charcoal font-semibold mb-3">Almost there — what&apos;s your name?</p>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your first name (optional)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#25D366] focus:outline-none text-sm mb-3"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-[#25D366] text-white font-semibold py-3 rounded-xl hover:bg-[#20bd5a] transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Open WhatsApp
                  </button>
                </>
              )}

              {step > 0 && step < 3 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="mt-3 text-xs text-gray-400 hover:text-gray-600"
                >
                  ← Back
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
