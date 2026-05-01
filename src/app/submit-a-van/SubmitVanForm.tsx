'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

// ─── Photo slot definitions ──────────────────────────────────────────────────
const REQUIRED_SLOTS = [
  { key: 'front',     label: 'Front' },
  { key: 'rear',      label: 'Rear' },
  { key: 'driver',    label: "Driver's Side" },
  { key: 'passenger', label: "Passenger's Side" },
  { key: 'interior1', label: 'Interior' },
]

type PhotoMap = Record<string, string>  // slot key → uploaded URL

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = ['Your details', 'Van details', 'Photos']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const n = i + 1
        const active = n === step
        const done   = n < step
        return (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${done   ? 'bg-ocean text-white' : ''}
              ${active ? 'bg-charcoal text-white' : ''}
              ${!done && !active ? 'bg-gray-100 text-gray-400' : ''}`}
            >
              {done ? '✓' : n}
            </div>
            <span className={`text-sm hidden sm:inline ${active ? 'font-semibold text-charcoal' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < steps.length - 1 && <div className="w-6 h-px bg-gray-200 mx-1" />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Photo upload slot ───────────────────────────────────────────────────────
function PhotoSlot({
  label,
  required,
  url,
  uploading,
  onFile,
  onRemove,
}: {
  label: string
  required?: boolean
  url?: string
  uploading?: boolean
  onFile: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => url ? null : inputRef.current?.click()}
        className={`relative w-full aspect-[4/3] rounded-xl border-2 overflow-hidden transition-all flex items-center justify-center
          ${url ? 'border-ocean/30 cursor-default' : 'border-dashed border-gray-200 hover:border-ocean/40 hover:bg-gray-50 cursor-pointer'}`}
      >
        {url ? (
          <>
            <Image src={url} alt={label} fill className="object-cover" sizes="200px" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80 transition-colors z-10"
            >
              ×
            </button>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-300">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs">Add photo</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
        />
      </button>
      <span className="text-xs text-center leading-tight">
        <span className={`font-medium ${url ? 'text-ocean' : 'text-charcoal'}`}>{label}</span>
        {required && !url && <span className="text-red-400 ml-0.5">*</span>}
      </span>
    </div>
  )
}

// ─── Main form ───────────────────────────────────────────────────────────────
export default function SubmitVanForm() {
  const [step, setStep]     = useState(1)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Step 1 — contact details
  const [contact, setContact] = useState({ name: '', email: '', phone: '', contact_preference: 'email' })

  // Step 2 — van details
  const [van, setVan] = useState({
    model_name: 'Toyota Hiace',
    model_year: '',
    body_type: '',
    mileage_km: '',
    transmission: '',
    asking_price_aud: '',
    location: '',
    notes: '',
  })

  // Step 3 — photos
  const [photos, setPhotos]           = useState<PhotoMap>({})
  const [extraPhotos, setExtraPhotos] = useState<string[]>([])
  const [uploading, setUploading]     = useState<Record<string, boolean>>({})
  const extraInputRef = useRef<HTMLInputElement>(null)

  // ── Upload a file to /api/upload ──────────────────────────────────────────
  async function uploadFile(file: File, key: string) {
    setUploading(u => ({ ...u, [key]: true }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      return url as string
    } finally {
      setUploading(u => ({ ...u, [key]: false }))
    }
  }

  async function handleRequiredPhoto(key: string, file: File) {
    const url = await uploadFile(file, key)
    if (url) setPhotos(p => ({ ...p, [key]: url }))
  }

  async function handleExtraPhoto(file: File) {
    const key = `extra_${Date.now()}`
    const url = await uploadFile(file, key)
    if (url) setExtraPhotos(e => [...e, url])
  }

  function removeRequired(key: string) {
    setPhotos(p => { const n = { ...p }; delete n[key]; return n })
  }

  function removeExtra(url: string) {
    setExtraPhotos(e => e.filter(u => u !== url))
  }

  const allPhotoUrls = [
    ...REQUIRED_SLOTS.map(s => photos[s.key]).filter(Boolean),
    ...extraPhotos,
  ]
  const requiredFilled = REQUIRED_SLOTS.every(s => photos[s.key])

  // ── Validate each step ────────────────────────────────────────────────────
  function canProceedStep1() {
    return contact.name.trim() && contact.email.trim() && contact.email.includes('@')
  }
  function canProceedStep2() {
    return van.model_name.trim() && van.model_year && van.location.trim()
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!requiredFilled) { setErrorMsg('Please upload all 5 required photos.'); return }
    setStatus('submitting')
    setErrorMsg('')

    try {
      const payload = {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        contact_preference: contact.contact_preference,
        model_name: van.model_name,
        model_year: van.model_year ? parseInt(van.model_year) : null,
        body_type: van.body_type || null,
        mileage_km: van.mileage_km ? parseInt(van.mileage_km) : null,
        transmission: van.transmission || null,
        asking_price_aud: van.asking_price_aud ? Math.round(parseFloat(van.asking_price_aud) * 100) : null,
        location: van.location,
        notes: van.notes || null,
        photos: allPhotoUrls,
      }
      const res = await fetch('/api/van-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
        <div className="text-5xl mb-5">🚐</div>
        <h3 className="text-2xl font-bold text-charcoal mb-3">Van submitted!</h3>
        <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">
          We&apos;ll review your listing and let you know when it&apos;s live. Interested buyers will be able to reach out to you directly.
        </p>
        <button
          onClick={() => { setStatus('idle'); setStep(1); setContact({ name: '', email: '', phone: '', contact_preference: 'email' }); setVan({ model_name: 'Toyota Hiace', model_year: '', body_type: '', mileage_km: '', transmission: '', asking_price_aud: '', location: '', notes: '' }); setPhotos({}); setExtraPhotos([]) }}
          className="mt-6 text-ocean text-sm hover:underline"
        >
          Submit another van →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8">
      <StepIndicator step={step} />

      {/* ── Step 1: Your details ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-charcoal mb-1">Your details</h2>
          <p className="text-gray-400 text-sm mb-5">So we can get in touch when your listing goes live (or when your fee is ready).</p>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Full name <span className="text-red-400">*</span></label>
              <input type="text" value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))} required
                placeholder="e.g. Luke Stafford"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Email <span className="text-red-400">*</span></label>
              <input type="email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} required
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="tel" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
              placeholder="04xx xxx xxx"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">How should interested buyers contact you?</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'email', label: 'Email only' },
                { value: 'phone', label: 'Phone only' },
                { value: 'both', label: 'Both email and phone' },
              ].map(opt => (
                <label key={opt.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors
                  ${contact.contact_preference === opt.value ? 'border-ocean bg-ocean/5 text-ocean font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <input type="radio" name="contact_preference" value={opt.value} checked={contact.contact_preference === opt.value}
                    onChange={e => setContact(c => ({ ...c, contact_preference: e.target.value }))} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <button type="button" disabled={!canProceedStep1()} onClick={() => setStep(2)}
            className="btn-primary w-full py-3.5 text-base disabled:opacity-40">
            Next — Van details →
          </button>
        </div>
      )}

      {/* ── Step 2: Van details ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-charcoal mb-1">Tell us about the van</h2>
          <p className="text-gray-400 text-sm mb-5">Basic specs help buyers know what they&apos;re looking at.</p>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Van model <span className="text-red-400">*</span></label>
              <input type="text" value={van.model_name} onChange={e => setVan(v => ({ ...v, model_name: e.target.value }))} required
                placeholder="e.g. Toyota Hiace H200"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Year <span className="text-red-400">*</span></label>
              <input type="number" value={van.model_year} onChange={e => setVan(v => ({ ...v, model_year: e.target.value }))} required
                placeholder="e.g. 2019" min={1990} max={2030}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Body type</label>
              <select value={van.body_type} onChange={e => setVan(v => ({ ...v, body_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean bg-white">
                <option value="">Select…</option>
                <option value="MWB">MWB — Mid Wheelbase</option>
                <option value="LWB">LWB — Long Wheelbase</option>
                <option value="SLWB">SLWB — Super Long Wheelbase</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Transmission</label>
              <select value={van.transmission} onChange={e => setVan(v => ({ ...v, transmission: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean bg-white">
                <option value="">Select…</option>
                <option value="AT">Automatic</option>
                <option value="MT">Manual</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Mileage (km)</label>
              <input type="number" value={van.mileage_km} onChange={e => setVan(v => ({ ...v, mileage_km: e.target.value }))}
                placeholder="e.g. 120000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Asking price (AUD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={van.asking_price_aud} onChange={e => setVan(v => ({ ...v, asking_price_aud: e.target.value }))}
                  placeholder="e.g. 35000" min={0}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Current location <span className="text-red-400">*</span></label>
            <input type="text" value={van.location} onChange={e => setVan(v => ({ ...v, location: e.target.value }))} required
              placeholder="e.g. Brisbane, QLD"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Description</label>
            <textarea value={van.notes} onChange={e => setVan(v => ({ ...v, notes: e.target.value }))} rows={5}
              placeholder="Tell buyers about your van — what's been done, the build, condition, any modifications or features…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean resize-none" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 py-3.5 text-sm border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
              ← Back
            </button>
            <button type="button" disabled={!canProceedStep2()} onClick={() => setStep(3)}
              className="flex-[2] btn-primary py-3.5 text-base disabled:opacity-40">
              Next — Upload photos →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Photos ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-charcoal mb-1">Upload photos</h2>
            <p className="text-gray-400 text-sm">5 required shots + extras if you&apos;ve got them. Higher quality photos = more buyer interest.</p>
          </div>

          {/* Required slots */}
          <div>
            <p className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">Required shots</p>
            <div className="grid grid-cols-3 gap-3">
              {REQUIRED_SLOTS.map(slot => (
                <PhotoSlot
                  key={slot.key}
                  label={slot.label}
                  required
                  url={photos[slot.key]}
                  uploading={uploading[slot.key]}
                  onFile={f => handleRequiredPhoto(slot.key, f)}
                  onRemove={() => removeRequired(slot.key)}
                />
              ))}
            </div>
          </div>

          {/* Extra photos */}
          <div>
            <p className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">
              Extra photos <span className="text-gray-400 font-normal normal-case">(optional, up to 6 more)</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {extraPhotos.map((url, i) => (
                <PhotoSlot
                  key={url}
                  label={`Extra ${i + 1}`}
                  url={url}
                  uploading={false}
                  onFile={() => {}}
                  onRemove={() => removeExtra(url)}
                />
              ))}
              {extraPhotos.length < 6 && (
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => extraInputRef.current?.click()}
                    className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 hover:border-ocean/40 hover:bg-gray-50 flex items-center justify-center cursor-pointer transition-colors">
                    <div className="flex flex-col items-center gap-1.5 text-gray-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs">Add photo</span>
                    </div>
                  </button>
                  <span className="text-xs text-gray-400">Extra</span>
                  <input ref={extraInputRef} type="file" accept="image/*" className="sr-only"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleExtraPhoto(f) }} />
                </div>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-ocean rounded-full transition-all"
                style={{ width: `${Math.round((Object.keys(photos).length / 5) * 100)}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {Object.keys(photos).length}/5 required
            </span>
          </div>

          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)}
              className="flex-1 py-3.5 text-sm border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
              ← Back
            </button>
            <button
              type="submit"
              disabled={!requiredFilled || status === 'submitting'}
              className="flex-[2] btn-primary py-3.5 text-base disabled:opacity-40"
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit van listing'}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            By submitting you confirm you have the right to share these photos and that the van details are accurate to the best of your knowledge.
          </p>
        </div>
      )}
    </form>
  )
}
