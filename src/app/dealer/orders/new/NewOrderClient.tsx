'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DEALER_TIERS, DEALER_GRADES, DEALER_WHOLESALE, DEALER_RETAIL, DEALER_MARGIN, calculatePaymentSplit, type DealerTier, type DealerGrade } from '@/lib/dealer-pricing'
import { formatCentsAud } from '@/lib/funds'

const TIER_COLORS: Record<DealerTier, string> = {
  shell: 'border-green-700',
  nest:  'border-amber-500',
  mana:  'border-orange-600',
}

export default function NewOrderClient() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [tier, setTier] = useState<DealerTier | null>(null)
  const [grade, setGrade] = useState<DealerGrade | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const wholesaleDollars = tier && grade ? DEALER_WHOLESALE[tier][grade] : 0
  const retailDollars = tier && grade ? DEALER_RETAIL[tier][grade] : 0
  const marginDollars = tier && grade ? DEALER_MARGIN[tier][grade] : 0
  const split = calculatePaymentSplit(wholesaleDollars * 100)

  async function submit() {
    if (!tier || !grade) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/dealer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, vehicle_grade: grade, notes: notes || null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const { order } = await res.json()
      router.push(`/dealer/orders/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Place a New Order</h1>
        <p className="text-gray-500 text-sm mt-1">Step {step} of 4</p>
      </div>

      {/* Step 1 — Tier */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-charcoal">1. Pick a tier</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(Object.keys(DEALER_TIERS) as DealerTier[]).map(t => (
              <button
                key={t}
                onClick={() => { setTier(t); setStep(2) }}
                className={`text-left bg-white border-2 rounded-2xl p-5 hover:shadow-md transition-shadow ${tier === t ? TIER_COLORS[t] : 'border-gray-200'}`}
              >
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{DEALER_TIERS[t].tagline}</p>
                <h3 className="text-2xl font-bold text-charcoal mb-2">{DEALER_TIERS[t].label}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{DEALER_TIERS[t].description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Grade */}
      {step === 2 && tier && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-charcoal">← Change tier</button>
          <h2 className="font-semibold text-charcoal">2. Pick a vehicle grade</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(Object.keys(DEALER_GRADES) as DealerGrade[]).map(g => (
              <button
                key={g}
                onClick={() => { setGrade(g); setStep(3) }}
                className={`text-left bg-white border-2 rounded-2xl p-5 hover:shadow-md transition-shadow ${grade === g ? 'border-ocean' : 'border-gray-200'}`}
              >
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{g === 'mid' ? '⭐ Most popular' : 'Vehicle grade'}</p>
                <h3 className="text-xl font-bold text-charcoal mb-2">{DEALER_GRADES[g].label}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{DEALER_GRADES[g].description}</p>
                <p className="text-sm font-semibold text-ocean">${DEALER_WHOLESALE[tier][g].toLocaleString('en-AU')} wholesale</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Notes */}
      {step === 3 && tier && grade && (
        <div className="space-y-4">
          <button onClick={() => setStep(2)} className="text-sm text-gray-400 hover:text-charcoal">← Change grade</button>
          <h2 className="font-semibold text-charcoal">3. Any preferences?</h2>
          <p className="text-sm text-gray-500">Optional — note anything specific about the vehicle (colour, drivetrain, season, demo van, custom feature, etc.). We&apos;ll do our best.</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={6}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
            placeholder="e.g. White only, 4WD diesel preferred, lower km if possible…"
          />
          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="btn-primary text-sm px-5 py-2.5">Review →</button>
          </div>
        </div>
      )}

      {/* Step 4 — Review + submit */}
      {step === 4 && tier && grade && (
        <div className="space-y-4">
          <button onClick={() => setStep(3)} className="text-sm text-gray-400 hover:text-charcoal">← Edit notes</button>
          <h2 className="font-semibold text-charcoal">4. Review & confirm</h2>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-charcoal text-lg">{DEALER_TIERS[tier].label} · {DEALER_GRADES[grade].label}</h3>

            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <div className="bg-cream rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Wholesale</p>
                <p className="text-2xl font-bold text-charcoal">${wholesaleDollars.toLocaleString('en-AU')}</p>
              </div>
              <div className="bg-cream rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recommended retail</p>
                <p className="text-2xl font-bold text-charcoal">${retailDollars.toLocaleString('en-AU')}</p>
              </div>
              <div className="bg-cream rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your margin</p>
                <p className="text-2xl font-bold text-ocean">${marginDollars.toLocaleString('en-AU')}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Payment schedule</p>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div><span className="text-gray-500">Deposit (20%):</span> <strong className="text-charcoal">{formatCentsAud(split.deposit)}</strong></div>
                <div><span className="text-gray-500">Progress (35%):</span> <strong className="text-charcoal">{formatCentsAud(split.progress)}</strong></div>
                <div><span className="text-gray-500">Final (45%):</span> <strong className="text-charcoal">{formatCentsAud(split.final)}</strong></div>
              </div>
            </div>

            {notes && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your notes</p>
                <p className="text-sm text-charcoal whitespace-pre-wrap">{notes}</p>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button onClick={submit} disabled={submitting} className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50">
              {submitting ? 'Placing order…' : 'Confirm Order'}
            </button>
            <button onClick={() => setStep(3)} className="border border-gray-300 text-charcoal text-sm px-5 py-2.5 rounded-lg hover:bg-gray-50">
              Back
            </button>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Once confirmed, we&apos;ll send a one-page heads of terms and the deposit invoice. Your build slot is locked when the deposit clears.
          </p>
        </div>
      )}
    </div>
  )
}
