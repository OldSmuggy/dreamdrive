'use client'

import { useState } from 'react'
import { centsToAud, sourceLabel } from '@/lib/utils'
import type { Listing } from '@/types'

type EditState = {
  model_name: string
  grade: string
  body_colour: string
  description: string
  model_year: string
  mileage_km: string
  transmission: string
  drive: string
  displacement_cc: string
  aud_estimate: string
  au_price_aud: string
  start_price_jpy: string
  status: string
  featured: boolean
  has_nav: boolean
  has_leather: boolean
  has_sunroof: boolean
  has_alloys: boolean
  photos: string[]
}

function toEditState(l: Listing): EditState {
  return {
    model_name: l.model_name ?? '',
    grade: l.grade ?? '',
    body_colour: l.body_colour ?? '',
    description: l.description ?? '',
    model_year: l.model_year?.toString() ?? '',
    mileage_km: l.mileage_km?.toString() ?? '',
    transmission: l.transmission ?? '',
    drive: l.drive ?? '',
    displacement_cc: l.displacement_cc?.toString() ?? '',
    aud_estimate: l.aud_estimate ? (l.aud_estimate / 100).toFixed(0) : '',
    au_price_aud: l.au_price_aud ? (l.au_price_aud / 100).toFixed(0) : '',
    start_price_jpy: l.start_price_jpy?.toString() ?? '',
    status: l.status,
    featured: l.featured,
    has_nav: l.has_nav,
    has_leather: l.has_leather,
    has_sunroof: l.has_sunroof,
    has_alloys: l.has_alloys,
    photos: [...(l.photos ?? [])],
  }
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white'

const sourceBadgeColor: Record<string, string> = {
  au_stock: 'bg-forest-600',
  auction: 'bg-amber-500',
}

export default function ListingEditor({ initial }: { initial: Listing[] }) {
  const [listings, setListings] = useState<Listing[]>(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')

  const startEdit = (l: Listing) => {
    setEditingId(l.id)
    setEditState(toEditState(l))
    setError(null)
    setNewPhotoUrl('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditState(null)
    setError(null)
  }

  const set = (field: keyof EditState, value: string | boolean | string[]) =>
    setEditState(s => s ? { ...s, [field]: value } : s)

  const addPhoto = () => {
    const url = newPhotoUrl.trim()
    if (!url || !editState) return
    set('photos', [...editState.photos, url])
    setNewPhotoUrl('')
  }

  const removePhoto = (index: number) => {
    if (!editState) return
    set('photos', editState.photos.filter((_, i) => i !== index))
  }

  const movePhoto = (from: number, to: number) => {
    if (!editState) return
    const photos = [...editState.photos]
    const [item] = photos.splice(from, 1)
    photos.splice(to, 0, item)
    set('photos', photos)
  }

  const handleSave = async (id: string) => {
    if (!editState) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        model_name: editState.model_name.trim(),
        grade: editState.grade.trim() || null,
        body_colour: editState.body_colour.trim() || null,
        description: editState.description.trim() || null,
        model_year: editState.model_year ? parseInt(editState.model_year) : null,
        mileage_km: editState.mileage_km ? parseInt(editState.mileage_km) : null,
        transmission: editState.transmission || null,
        drive: editState.drive || null,
        displacement_cc: editState.displacement_cc ? parseInt(editState.displacement_cc) : null,
        aud_estimate: editState.aud_estimate ? Math.round(parseFloat(editState.aud_estimate) * 100) : null,
        au_price_aud: editState.au_price_aud ? Math.round(parseFloat(editState.au_price_aud) * 100) : null,
        start_price_jpy: editState.start_price_jpy ? parseInt(editState.start_price_jpy) : null,
        status: editState.status,
        featured: editState.featured,
        has_nav: editState.has_nav,
        has_leather: editState.has_leather,
        has_sunroof: editState.has_sunroof,
        has_alloys: editState.has_alloys,
        photos: editState.photos,
      }

      const res = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      setListings(ls => ls.map(l => l.id === id ? { ...l, ...data } : l))
      setEditingId(null)
      setEditState(null)
      setSavedId(id)
      setTimeout(() => setSavedId(null), 3000)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  // Group by source
  const auStock  = listings.filter(l => l.source === 'au_stock')
  const auction  = listings.filter(l => l.source === 'auction')
  const dealer   = listings.filter(l => l.source.startsWith('dealer'))

  const renderGroup = (title: string, items: Listing[]) => {
    if (items.length === 0) return null
    return (
      <section className="mb-8">
        <h2 className="font-display text-xl text-forest-800 mb-3">{title} ({items.length})</h2>
        <div className="space-y-2">
          {items.map(l => <ListingRow key={l.id} listing={l} />)}
        </div>
      </section>
    )
  }

  const ListingRow = ({ listing: l }: { listing: Listing }) => {
    const isEditing = editingId === l.id
    const price = l.source === 'au_stock' && l.au_price_aud
      ? centsToAud(l.au_price_aud)
      : l.aud_estimate ? `~${centsToAud(l.aud_estimate)}`
      : l.start_price_jpy ? `¥${l.start_price_jpy.toLocaleString()}`
      : '—'

    return (
      <div className={`bg-white border rounded-xl overflow-hidden ${isEditing ? 'border-forest-300 shadow-md' : 'border-gray-200'}`}>
        {/* Row */}
        <div className="flex items-center gap-3 px-4 py-3 text-sm">
          {l.photos?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.photos[0]} alt="" className="w-16 h-11 object-cover rounded shrink-0" />
          )}
          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded text-white ${sourceBadgeColor[l.source] ?? 'bg-blue-600'}`}>
            {sourceLabel(l.source)}
          </span>
          <span className="flex-1 font-medium text-gray-800 truncate">{l.model_name}{l.grade ? ` — ${l.grade}` : ''}</span>
          <span className="text-gray-400 shrink-0 text-xs">{l.model_year ?? '—'}</span>
          <span className="text-gray-400 shrink-0 text-xs">{l.mileage_km?.toLocaleString() ?? '—'} km</span>
          <span className="text-forest-700 font-semibold shrink-0 text-xs">{price}</span>
          <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
            l.status === 'available' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-500'
          }`}>{l.status}</span>
          {savedId === l.id && <span className="text-xs text-forest-700 font-semibold shrink-0">✓ Saved</span>}
          <button
            onClick={() => isEditing ? cancelEdit() : startEdit(l)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${
              isEditing
                ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                : 'border-forest-600 text-forest-700 hover:bg-forest-50'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Edit form */}
        {isEditing && editState && (
          <div className="border-t border-forest-100 bg-gray-50 p-5">
            <div className="grid md:grid-cols-3 gap-4 mb-5">
              {/* Col 1 */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Model Name</label>
                  <input value={editState.model_name} onChange={e => set('model_name', e.target.value)} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Grade</label>
                    <input value={editState.grade} onChange={e => set('grade', e.target.value)} className={inputClass} placeholder="e.g. Super GL" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Body Colour</label>
                    <input value={editState.body_colour} onChange={e => set('body_colour', e.target.value)} className={inputClass} placeholder="e.g. Pearl White" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Year</label>
                    <input type="number" value={editState.model_year} onChange={e => set('model_year', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mileage (km)</label>
                    <input type="number" value={editState.mileage_km} onChange={e => set('mileage_km', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Transmission</label>
                    <select value={editState.transmission} onChange={e => set('transmission', e.target.value)} className={inputClass}>
                      <option value="">—</option>
                      <option value="AT">AT</option>
                      <option value="IA">IA / CVT</option>
                      <option value="MT">MT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Drive</label>
                    <select value={editState.drive} onChange={e => set('drive', e.target.value)} className={inputClass}>
                      <option value="">—</option>
                      <option value="2WD">2WD</option>
                      <option value="4WD">4WD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Engine (cc)</label>
                    <input type="number" value={editState.displacement_cc} onChange={e => set('displacement_cc', e.target.value)} className={inputClass} placeholder="2700" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                    <select value={editState.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                      <option value="available">available</option>
                      <option value="draft">draft</option>
                      <option value="reserved">reserved</option>
                      <option value="sold">sold</option>
                      <option value="auction_ended">auction_ended</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                  <textarea
                    value={editState.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="Short listing description shown on the van page..."
                  />
                </div>
              </div>

              {/* Col 2 — Pricing + flags */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">AUD Estimate ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                    <input type="number" value={editState.aud_estimate} onChange={e => set('aud_estimate', e.target.value)} className={`${inputClass} pl-6`} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">AU Price ($) — AU stock only</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                    <input type="number" value={editState.au_price_aud} onChange={e => set('au_price_aud', e.target.value)} className={`${inputClass} pl-6`} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Japan Price (¥)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-400">¥</span>
                    <input type="number" value={editState.start_price_jpy} onChange={e => set('start_price_jpy', e.target.value)} className={`${inputClass} pl-6`} />
                  </div>
                </div>

                <div className="pt-1 space-y-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Features & Flags</label>
                  {([
                    ['featured',    '⭐ Featured on homepage'],
                    ['has_nav',     '🗺 Navigation'],
                    ['has_leather', '🪑 Leather seats'],
                    ['has_sunroof', '☀️ Sunroof'],
                    ['has_alloys',  '🔘 Alloy wheels'],
                  ] as [keyof EditState, string][]).map(([field, label]) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editState[field] as boolean}
                        onChange={e => set(field, e.target.checked)}
                        className="w-4 h-4 accent-forest-600"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-3">
                Photos <span className="text-gray-400 font-normal">({editState.photos.length} — first image is the cover)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {editState.photos.map((url, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      {i > 0 && (
                        <button
                          onClick={() => movePhoto(i, i - 1)}
                          className="text-white text-xs bg-black/60 rounded px-1 py-0.5"
                          title="Move left"
                        >←</button>
                      )}
                      <button
                        onClick={() => removePhoto(i)}
                        className="text-white text-xs bg-red-600/80 rounded px-1.5 py-0.5"
                        title="Remove"
                      >✕</button>
                      {i < editState.photos.length - 1 && (
                        <button
                          onClick={() => movePhoto(i, i + 1)}
                          className="text-white text-xs bg-black/60 rounded px-1 py-0.5"
                          title="Move right"
                        >→</button>
                      )}
                    </div>
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-forest-600 text-white text-[10px] font-bold px-1 rounded">COVER</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPhoto()}
                  placeholder="Paste image URL and press Enter or click Add"
                  className={`${inputClass} flex-1`}
                />
                <button
                  onClick={addPhoto}
                  className="px-4 py-2 bg-forest-600 text-white text-sm rounded-lg hover:bg-forest-700 shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleSave(l.id)}
                disabled={saving}
                className="btn-primary btn-sm disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={cancelEdit} className="btn-secondary btn-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {renderGroup('AU Stock', auStock)}
      {renderGroup('Japan Auction', auction)}
      {renderGroup('Japan Dealers', dealer)}
      {listings.length === 0 && (
        <p className="text-gray-400 text-sm">No listings found.</p>
      )}
    </div>
  )
}
