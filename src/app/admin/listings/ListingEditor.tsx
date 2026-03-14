'use client'

import { useState } from 'react'
import { centsToAud, sourceLabel } from '@/lib/utils'
import type { Listing, Source } from '@/types'

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
  size: string
  internals: string
  aud_estimate: string
  au_price_aud: string
  start_price_jpy: string
  source: string
  status: string
  au_status: string
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
    size: l.size ?? '',
    internals: l.internals ?? '',
    aud_estimate: l.aud_estimate ? (l.aud_estimate / 100).toFixed(0) : '',
    au_price_aud: l.au_price_aud ? (l.au_price_aud / 100).toFixed(0) : '',
    start_price_jpy: l.start_price_jpy?.toString() ?? '',
    source: l.source,
    status: l.status,
    au_status: l.au_status ?? '',
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

const SOURCE_OPTIONS: { value: Source; label: string }[] = [
  { value: 'auction',          label: 'Japan Auction' },
  { value: 'dealer_goonet',    label: 'Japan Dealer (Goo-net)' },
  { value: 'dealer_carsensor', label: 'Japan Dealer (Car Sensor)' },
  { value: 'au_stock',         label: 'Australia' },
]

// ---- Row component (defined outside to prevent remount on parent re-render) ----
interface RowProps {
  listing: Listing
  isEditing: boolean
  isSaved: boolean
  editState: EditState | null
  saving: boolean
  error: string | null
  newPhotoUrl: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onDelete: () => void
  onSet: (field: keyof EditState, value: string | boolean | string[]) => void
  onSetNewPhotoUrl: (v: string) => void
  onAddPhoto: () => void
  onRemovePhoto: (i: number) => void
  onMovePhoto: (from: number, to: number) => void
}

function ListingRow({
  listing: l, isEditing, isSaved, editState, saving, error,
  newPhotoUrl, onStartEdit, onCancelEdit, onSave, onDelete, onSet,
  onSetNewPhotoUrl, onAddPhoto, onRemovePhoto, onMovePhoto,
}: RowProps) {
  const price = l.source === 'au_stock' && l.au_price_aud
    ? centsToAud(l.au_price_aud)
    : l.aud_estimate ? `~${centsToAud(l.aud_estimate)}`
    : l.start_price_jpy ? `¥${l.start_price_jpy.toLocaleString()}`
    : '—'

  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${isEditing ? 'border-forest-300 shadow-md' : 'border-gray-200'}`}>
      {/* Row summary */}
      <div className="flex items-center gap-3 px-4 py-3 text-sm">
        {l.photos?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.photos[0]} alt="" className="w-16 h-11 object-cover rounded shrink-0" />
        )}
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded text-white ${
          l.source === 'au_stock' ? 'bg-forest-600' : l.source === 'auction' ? 'bg-amber-500' : 'bg-blue-600'
        }`}>
          {sourceLabel(l.source)}
        </span>
        <span className="flex-1 font-medium text-gray-800 truncate">
          {l.model_name}{l.grade ? ` — ${l.grade}` : ''}
        </span>
        {(l.raw_data as Record<string, string> | null)?.url && (
          <a
            href={(l.raw_data as Record<string, string>).url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline shrink-0"
            onClick={e => e.stopPropagation()}
          >
            Source ↗
          </a>
        )}
        <span className="text-gray-400 shrink-0 text-xs">{l.model_year ?? '—'}</span>
        <span className="text-gray-400 shrink-0 text-xs">{l.mileage_km?.toLocaleString() ?? '—'} km</span>
        <span className="text-forest-700 font-semibold shrink-0 text-xs">{price}</span>
        <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
          l.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>{l.status}</span>
        {isSaved && <span className="text-xs text-forest-700 font-semibold shrink-0">✓ Saved</span>}
        <button
          onClick={() => isEditing ? onCancelEdit() : onStartEdit()}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${
            isEditing
              ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
              : 'border-forest-600 text-forest-700 hover:bg-forest-50'
          }`}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
        {!isEditing && (
          <button
            onClick={onDelete}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {/* Edit form */}
      {isEditing && editState && (
        <div className="border-t border-forest-100 bg-gray-50 p-5">
          <div className="grid md:grid-cols-3 gap-4 mb-5">

            {/* Left — main fields */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Model Name</label>
                <input
                  value={editState.model_name}
                  onChange={e => onSet('model_name', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Grade</label>
                  <input value={editState.grade} onChange={e => onSet('grade', e.target.value)} className={inputClass} placeholder="e.g. Super GL" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Body Colour</label>
                  <input value={editState.body_colour} onChange={e => onSet('body_colour', e.target.value)} className={inputClass} placeholder="e.g. Pearl White" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Year</label>
                  <input type="number" value={editState.model_year} onChange={e => onSet('model_year', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mileage (km)</label>
                  <input type="number" value={editState.mileage_km} onChange={e => onSet('mileage_km', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Transmission</label>
                  <select value={editState.transmission} onChange={e => onSet('transmission', e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    <option value="AT">AT</option>
                    <option value="IA">IA / CVT</option>
                    <option value="MT">MT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Drive</label>
                  <select value={editState.drive} onChange={e => onSet('drive', e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    <option value="2WD">2WD</option>
                    <option value="4WD">4WD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Engine (cc)</label>
                  <input type="number" value={editState.displacement_cc} onChange={e => onSet('displacement_cc', e.target.value)} className={inputClass} placeholder="2700" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Size</label>
                  <select value={editState.size} onChange={e => onSet('size', e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    <option value="MWB">MWB — Medium Wheel Base</option>
                    <option value="LWB">LWB — Long Wheel Base</option>
                    <option value="SLWB">SLWB — Super Long Wheel Base</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Internals</label>
                  <select value={editState.internals} onChange={e => onSet('internals', e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    <option value="empty">Empty</option>
                    <option value="seats">Seats</option>
                    <option value="campervan">Campervan Fit Out</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">AU Status</label>
                  <select value={editState.au_status} onChange={e => onSet('au_status', e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    <option value="import_pending">Import Pending</option>
                    <option value="import_approved">Import Approved</option>
                    <option value="en_route">En Route to Port</option>
                    <option value="on_ship">On Ship to Brisbane</option>
                    <option value="at_dock">At Dock</option>
                    <option value="in_transit_au">In Transit AU</option>
                    <option value="available_now">Available Now</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Source</label>
                  <select value={editState.source} onChange={e => onSet('source', e.target.value)} className={inputClass}>
                    {SOURCE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                  <select value={editState.status} onChange={e => onSet('status', e.target.value)} className={inputClass}>
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
                  onChange={e => onSet('description', e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Short listing description..."
                />
              </div>
            </div>

            {/* Right — pricing + flags */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">AUD Estimate ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                  <input type="number" value={editState.aud_estimate} onChange={e => onSet('aud_estimate', e.target.value)} className={`${inputClass} pl-6`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">AU Price ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                  <input type="number" value={editState.au_price_aud} onChange={e => onSet('au_price_aud', e.target.value)} className={`${inputClass} pl-6`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Japan Price (¥)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-400">¥</span>
                  <input type="number" value={editState.start_price_jpy} onChange={e => onSet('start_price_jpy', e.target.value)} className={`${inputClass} pl-6`} />
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
                      onChange={e => onSet(field, e.target.checked)}
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
                      <button onClick={() => onMovePhoto(i, i - 1)} className="text-white text-xs bg-black/60 rounded px-1 py-0.5">←</button>
                    )}
                    <button onClick={() => onRemovePhoto(i)} className="text-white text-xs bg-red-600/80 rounded px-1.5 py-0.5">✕</button>
                    {i < editState.photos.length - 1 && (
                      <button onClick={() => onMovePhoto(i, i + 1)} className="text-white text-xs bg-black/60 rounded px-1 py-0.5">→</button>
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
                onChange={e => onSetNewPhotoUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onAddPhoto()}
                placeholder="Paste image URL and press Enter or click Add"
                className={`${inputClass} flex-1`}
              />
              <button onClick={onAddPhoto} className="px-4 py-2 bg-forest-600 text-white text-sm rounded-lg hover:bg-forest-700 shrink-0">
                Add
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
          )}

          <div className="flex gap-3">
            <button onClick={onSave} disabled={saving} className="btn-primary btn-sm disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={onCancelEdit} className="btn-secondary btn-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Main editor ----
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
        size: editState.size || null,
        internals: editState.internals || null,
        aud_estimate: editState.aud_estimate ? Math.round(parseFloat(editState.aud_estimate) * 100) : null,
        au_price_aud: editState.au_price_aud ? Math.round(parseFloat(editState.au_price_aud) * 100) : null,
        start_price_jpy: editState.start_price_jpy ? parseInt(editState.start_price_jpy) : null,
        source: editState.source,
        status: editState.status,
        au_status: editState.au_status || null,
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' })
    if (res.ok) setListings(ls => ls.filter(l => l.id !== id))
  }

  const auStock = listings.filter(l => l.source === 'au_stock')
  const auction = listings.filter(l => l.source === 'auction')
  const dealer  = listings.filter(l => l.source.startsWith('dealer'))

  const renderGroup = (title: string, items: Listing[]) => {
    if (items.length === 0) return null
    return (
      <section className="mb-8">
        <h2 className="font-display text-xl text-forest-800 mb-3">{title} ({items.length})</h2>
        <div className="space-y-2">
          {items.map(l => (
            <ListingRow
              key={l.id}
              listing={l}
              isEditing={editingId === l.id}
              isSaved={savedId === l.id}
              editState={editingId === l.id ? editState : null}
              saving={saving}
              error={editingId === l.id ? error : null}
              newPhotoUrl={newPhotoUrl}
              onStartEdit={() => startEdit(l)}
              onCancelEdit={cancelEdit}
              onSave={() => handleSave(l.id)}
              onDelete={() => handleDelete(l.id)}
              onSet={set}
              onSetNewPhotoUrl={setNewPhotoUrl}
              onAddPhoto={addPhoto}
              onRemovePhoto={removePhoto}
              onMovePhoto={movePhoto}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div>
      {renderGroup('AU Stock', auStock)}
      {renderGroup('Japan Auction', auction)}
      {renderGroup('Japan Dealers', dealer)}
      {listings.length === 0 && <p className="text-gray-400 text-sm">No listings found.</p>}
    </div>
  )
}
