'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import type { MyListing } from './page'

// ─── Source category labels (private, admin + submitter only) ───────────────
const SOURCE_CATEGORY_LABELS: Record<string, string> = {
  facebook:     'Facebook Marketplace',
  gumtree:      'Gumtree',
  private_sale: 'Private Sale',
  au_dealer:    'Australian Dealer',
  goonet:       'Goo-net (Japan)',
  carsensor:    'Car Sensor (Japan)',
  yahoo_auctions: 'Yahoo Auctions Japan',
  other:        'Other',
}

// ─── Photo upload slot (same pattern as submit-a-van) ───────────────────────
const REQUIRED_SLOTS = [
  { key: 'front',     label: 'Front' },
  { key: 'rear',      label: 'Rear' },
  { key: 'driver',    label: "Driver's Side" },
  { key: 'passenger', label: "Passenger's Side" },
  { key: 'interior1', label: 'Interior 1' },
  { key: 'interior2', label: 'Interior 2' },
]

type PhotoMap = Record<string, string>

function PhotoSlot({ label, required, url, uploading, onFile, onRemove }: {
  label: string; required?: boolean; url?: string; uploading?: boolean
  onFile: (file: File) => void; onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={() => !url && inputRef.current?.click()}
        className={`relative w-full aspect-[4/3] rounded-xl border-2 overflow-hidden flex items-center justify-center transition-all
          ${url ? 'border-ocean/30 cursor-default' : 'border-dashed border-gray-200 hover:border-ocean/40 hover:bg-gray-50 cursor-pointer'}`}>
        {url ? (
          <>
            <Image src={url} alt={label} fill className="object-cover" sizes="160px" />
            <button type="button" onClick={e => { e.stopPropagation(); onRemove() }}
              className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80 z-10">×</button>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-300">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
            <span className="text-xs">Add photo</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      </button>
      <span className="text-xs text-center">
        <span className={`font-medium ${url ? 'text-ocean' : 'text-charcoal'}`}>{label}</span>
        {required && !url && <span className="text-red-400 ml-0.5">*</span>}
      </span>
    </div>
  )
}

// ─── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft:          { label: 'Draft',          cls: 'bg-gray-100 text-gray-500' },
    pending_review: { label: 'Pending Review',  cls: 'bg-yellow-100 text-yellow-700' },
    available:      { label: 'Live ✓',          cls: 'bg-green-100 text-green-700' },
    sold:           { label: 'Sold',            cls: 'bg-ocean/10 text-ocean' },
    reserved:       { label: 'Reserved',        cls: 'bg-blue-100 text-blue-700' },
  }
  const info = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${info.cls}`}>{info.label}</span>
}

// ─── Listing card ────────────────────────────────────────────────────────────
function ListingCard({ listing, onPublish, onDelete, publishing, deleting }: {
  listing: MyListing
  onPublish: () => void
  onDelete: () => void
  publishing: boolean
  deleting: boolean
}) {
  const title = `${listing.model_year ? `${listing.model_year} ` : ''}${listing.model_name}`
  const thumb = listing.photos?.[0]

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex gap-0">
      {/* Photo */}
      <div className="relative w-28 sm:w-36 flex-shrink-0">
        {thumb ? (
          <Image src={thumb} alt={title} fill className="object-cover" sizes="140px" />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center min-h-[100px]">
            <span className="text-3xl">🚐</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
          <div>
            <h3 className="font-bold text-charcoal text-sm">{title}</h3>
            {listing.grade && <p className="text-xs text-gray-400">{listing.grade}</p>}
          </div>
          <StatusBadge status={listing.status} />
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
          {listing.mileage_km && <span>{listing.mileage_km.toLocaleString()} km</span>}
          {listing.transmission && <span>{listing.transmission === 'AT' ? 'Auto' : 'Manual'}</span>}
          {listing.body_colour && <span>{listing.body_colour}</span>}
          {listing.au_price_aud && <span className="font-semibold text-charcoal">${(listing.au_price_aud / 100).toLocaleString()}</span>}
        </div>

        {/* Private source info — only the submitter sees this */}
        {(listing.source_category || listing.source_url) && (
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            <span>🔒</span>
            <span className="font-medium text-gray-500">{SOURCE_CATEGORY_LABELS[listing.source_category ?? ''] ?? listing.source_category}</span>
            {listing.source_url && (
              <>
                <span className="text-gray-300">·</span>
                <a href={listing.source_url} target="_blank" rel="noopener noreferrer"
                  className="text-ocean hover:underline truncate max-w-[180px]">
                  View original →
                </a>
              </>
            )}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {listing.status === 'draft' && (
            <>
              <button onClick={onPublish} disabled={publishing}
                className="btn-primary btn-sm px-3 py-1.5 text-xs disabled:opacity-50">
                {publishing ? 'Requesting…' : 'Make Live →'}
              </button>
              <button onClick={onDelete} disabled={deleting}
                className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
          {listing.status === 'pending_review' && (
            <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-1.5">
              Awaiting Bare Camper review — we&apos;ll publish it shortly.
            </p>
          )}
          {listing.status === 'available' && (
            <a href={`/van/${listing.id}`} target="_blank"
              className="text-xs text-ocean border border-ocean/30 rounded-lg px-3 py-1.5 hover:bg-ocean/5 transition-colors">
              View listing →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Add Listing Form ────────────────────────────────────────────────────────
function AddListingForm({ onCreated }: { onCreated: (listing: MyListing) => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [photos, setPhotos] = useState<PhotoMap>({})
  const [extraPhotos, setExtraPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const extraRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    model_name: 'Toyota Hiace',
    model_year: '',
    body_type: '',
    body_colour: '',
    mileage_km: '',
    transmission: '',
    drive: '2WD',
    au_price_aud: '',
    notes: '',
    source_category: '',
    source_url: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function uploadFile(file: File, key: string): Promise<string | null> {
    setUploading(u => ({ ...u, [key]: true }))
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      return url
    } catch { return null }
    finally { setUploading(u => ({ ...u, [key]: false })) }
  }

  async function handleSlot(key: string, file: File) {
    const url = await uploadFile(file, key)
    if (url) setPhotos(p => ({ ...p, [key]: url }))
  }
  async function handleExtra(file: File) {
    const key = `extra_${Date.now()}`
    const url = await uploadFile(file, key)
    if (url) setExtraPhotos(e => [...e, url])
  }

  const allPhotos = [
    ...REQUIRED_SLOTS.map(s => photos[s.key]).filter(Boolean),
    ...extraPhotos,
  ]
  const requiredFilled = REQUIRED_SLOTS.every(s => photos[s.key])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!requiredFilled) { setErrorMsg('Please upload all 6 required photos.'); return }
    setSaving(true); setErrorMsg('')
    try {
      const res = await fetch('/api/customer/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photos: allPhotos }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const data = await res.json()
      // Build a minimal MyListing to show in list immediately
      const newListing: MyListing = {
        id: data.id,
        model_name: form.model_name,
        model_year: form.model_year ? parseInt(form.model_year) : null,
        grade: form.body_type || null,
        body_colour: form.body_colour || null,
        mileage_km: form.mileage_km ? parseInt(form.mileage_km) : null,
        transmission: form.transmission || null,
        au_price_aud: form.au_price_aud ? Math.round(parseFloat(form.au_price_aud) * 100) : null,
        photos: allPhotos,
        status: data.status,
        is_community_find: true,
        created_at: new Date().toISOString(),
        description: form.notes || null,
        source_url: form.source_url || null,
        source_category: form.source_category || null,
      }
      onCreated(newListing)
      // Reset
      setOpen(false)
      setForm({ model_name: 'Toyota Hiace', model_year: '', body_type: '', body_colour: '', mileage_km: '', transmission: '', drive: '2WD', au_price_aud: '', notes: '', source_category: '', source_url: '' })
      setPhotos({}); setExtraPhotos([])
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean bg-white'

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 rounded-2xl">
        <span className="text-xl">+</span> Add a Van Listing
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-charcoal">New Listing</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-charcoal text-sm">Cancel ×</button>
      </div>

      {/* Van details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Van model <span className="text-red-400">*</span></label>
          <input type="text" value={form.model_name} onChange={e => set('model_name', e.target.value)} required className={inputCls} placeholder="e.g. Toyota Hiace H200" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Year</label>
          <input type="number" value={form.model_year} onChange={e => set('model_year', e.target.value)} className={inputCls} placeholder="e.g. 2019" min={1990} max={2030} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Body type</label>
          <select value={form.body_type} onChange={e => set('body_type', e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            <option value="MWB">MWB — Mid Wheelbase</option>
            <option value="LWB">LWB — Long Wheelbase</option>
            <option value="SLWB">SLWB — Super Long Wheelbase</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Colour</label>
          <input type="text" value={form.body_colour} onChange={e => set('body_colour', e.target.value)} className={inputCls} placeholder="e.g. White, Pearl" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Mileage (km)</label>
          <input type="number" value={form.mileage_km} onChange={e => set('mileage_km', e.target.value)} className={inputCls} placeholder="e.g. 120000" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Transmission</label>
          <select value={form.transmission} onChange={e => set('transmission', e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            <option value="AT">Automatic</option>
            <option value="MT">Manual</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Drive</label>
          <select value={form.drive} onChange={e => set('drive', e.target.value)} className={inputCls}>
            <option value="2WD">2WD</option>
            <option value="4WD">4WD / 4x4</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1.5">Asking price (AUD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input type="number" value={form.au_price_aud} onChange={e => set('au_price_aud', e.target.value)} className={inputCls + ' pl-8'} placeholder="e.g. 35000" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1.5">Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Condition, features, history, why it's a good buy…" />
      </div>

      {/* Source listing — private, admin + submitter only */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-sm font-semibold text-charcoal mb-0.5">
          Source listing <span className="text-red-400">*</span>
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Where did you find this van? This is <strong>private</strong> — only visible to you and Bare Camper admin.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={form.source_category}
              onChange={e => set('source_category', e.target.value)}
              required
              className={inputCls}
            >
              <option value="">Where is this van listed?</option>
              <option value="facebook">Facebook Marketplace</option>
              <option value="gumtree">Gumtree</option>
              <option value="private_sale">Private Sale (no listing)</option>
              <option value="au_dealer">Australian Dealer</option>
              <option value="goonet">Japan Dealer — Goo-net</option>
              <option value="carsensor">Japan Dealer — Car Sensor</option>
              <option value="yahoo_auctions">Yahoo Auctions Japan</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1.5">Link to listing</label>
            <input
              type="url"
              value={form.source_url}
              onChange={e => set('source_url', e.target.value)}
              className={inputCls}
              placeholder="https://www.facebook.com/marketplace/…"
            />
            <p className="text-xs text-gray-400 mt-1">Paste the URL if it&apos;s listed online.</p>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div>
        <p className="text-sm font-semibold text-charcoal mb-1">Photos <span className="text-red-400">*</span></p>
        <p className="text-xs text-gray-400 mb-3">Upload all 6 required shots before you can submit.</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {REQUIRED_SLOTS.map(slot => (
            <PhotoSlot key={slot.key} label={slot.label} required url={photos[slot.key]} uploading={uploading[slot.key]}
              onFile={f => handleSlot(slot.key, f)} onRemove={() => setPhotos(p => { const n = { ...p }; delete n[slot.key]; return n })} />
          ))}
        </div>

        {/* Extra photos */}
        {(extraPhotos.length > 0 || true) && (
          <div className="grid grid-cols-3 gap-3">
            {extraPhotos.map((url, i) => (
              <PhotoSlot key={url} label={`Extra ${i + 1}`} url={url} uploading={false}
                onFile={() => {}} onRemove={() => setExtraPhotos(e => e.filter(u => u !== url))} />
            ))}
            {extraPhotos.length < 6 && (
              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={() => extraRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 hover:border-ocean/40 flex items-center justify-center cursor-pointer transition-colors">
                  <div className="flex flex-col items-center gap-1.5 text-gray-300">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    <span className="text-xs">Extra</span>
                  </div>
                </button>
                <span className="text-xs text-gray-400">Optional</span>
                <input ref={extraRef} type="file" accept="image/*" className="sr-only"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleExtra(f) }} />
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-1.5 bg-ocean rounded-full transition-all" style={{ width: `${Math.round((Object.keys(photos).length / 6) * 100)}%` }} />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">{Object.keys(photos).length}/6 required</span>
        </div>
      </div>

      {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

      <button type="submit" disabled={!requiredFilled || saving || !form.model_name}
        className="btn-primary w-full py-3.5 text-base disabled:opacity-40">
        {saving ? 'Saving…' : 'Save as Draft'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Your listing saves as a draft. You&apos;ll need to click <strong>Make Live</strong> to publish it for buyers to see.
      </p>
    </form>
  )
}

// ─── Main client component ───────────────────────────────────────────────────
export default function MyListingsClient({
  isTrusted,
  initialListings,
}: {
  userId: string
  userEmail: string
  isTrusted: boolean
  initialListings: MyListing[]
}) {
  const [listings, setListings]   = useState(initialListings)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  function handleCreated(listing: MyListing) {
    setListings(prev => [listing, ...prev])
  }

  async function publish(id: string) {
    setPublishing(id)
    try {
      const res = await fetch(`/api/customer/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: data.status } : l))
    } catch (err) {
      alert('Failed: ' + String(err))
    } finally {
      setPublishing(null)
    }
  }

  async function deleteListing(id: string) {
    if (!confirm('Delete this draft listing?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/customer/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      })
      if (!res.ok) throw new Error('Failed')
      setListings(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      alert('Failed: ' + String(err))
    } finally {
      setDeleting(null)
    }
  }

  const drafts = listings.filter(l => l.status === 'draft' || l.status === 'pending_review')
  const live   = listings.filter(l => l.status !== 'draft' && l.status !== 'pending_review')

  return (
    <div className="space-y-8">
      {/* Add listing form */}
      <AddListingForm onCreated={handleCreated} />

      {/* Draft listings */}
      {drafts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-4">
            Drafts &amp; Pending ({drafts.length})
          </h2>
          <div className="space-y-3">
            {drafts.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onPublish={() => publish(listing.id)}
                onDelete={() => deleteListing(listing.id)}
                publishing={publishing === listing.id}
                deleting={deleting === listing.id}
              />
            ))}
          </div>
          {!isTrusted && drafts.some(l => l.status === 'pending_review') && (
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Listings marked <strong>Pending Review</strong> will be published by the Bare Camper team shortly.
            </p>
          )}
        </div>
      )}

      {/* Live listings */}
      {live.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-4">
            Live Listings ({live.length})
          </h2>
          <div className="space-y-3">
            {live.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onPublish={() => {}}
                onDelete={() => {}}
                publishing={false}
                deleting={false}
              />
            ))}
          </div>
        </div>
      )}

      {listings.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🚐</div>
          <p>No listings yet. Add your first van above.</p>
        </div>
      )}

      {/* Finders fee reminder */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 text-sm text-gray-500 leading-relaxed">
        <p className="font-semibold text-charcoal mb-1">About the finders fee</p>
        <p className="mb-2">
          You earn a <strong className="text-charcoal">$200 AUD finders fee</strong> when:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>A <strong className="text-charcoal">Japanese-sourced van</strong> you&apos;ve listed is purchased by a Bare Camper customer</li>
          <li>An <strong className="text-charcoal">Australian-sourced van</strong> you&apos;ve listed leads to the buyer getting a Bare Camper conversion (pop top, hi-top, or full fit-out)</li>
        </ul>
        <p className="mt-2">We&apos;ll email you when a sale is confirmed and arrange the bank transfer.</p>
      </div>
    </div>
  )
}
