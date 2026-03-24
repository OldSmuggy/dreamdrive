'use client'

import { useState } from 'react'
import type { Listing } from '@/types'
import PhotoUploadButton from '@/components/ui/PhotoUploadButton'

type DraftState = {
  model_name: string
  grade: string
  body_colour: string
  description: string
  model_year: string
  mileage_km: string
  aud_estimate: string
  transmission: string
  drive: string
  displacement_cc: string
  chassis_code: string
  inspection_score: string
  start_price_jpy: string
  bid_no: string
  kaijo_code: string
  photos: string[]
}

function toDraftState(l: Listing): DraftState {
  return {
    model_name: l.model_name ?? '',
    grade: l.grade ?? '',
    body_colour: l.body_colour ?? '',
    description: (l as unknown as { description?: string }).description ?? '',
    model_year: l.model_year?.toString() ?? '',
    mileage_km: l.mileage_km?.toString() ?? '',
    aud_estimate: l.aud_estimate ? (l.aud_estimate / 100).toFixed(0) : '',
    transmission: l.transmission ?? '',
    drive: l.drive ?? '',
    displacement_cc: l.displacement_cc?.toString() ?? '',
    chassis_code: l.chassis_code ?? '',
    inspection_score: l.inspection_score ?? '',
    start_price_jpy: l.start_price_jpy?.toString() ?? '',
    bid_no: (l as unknown as Record<string, unknown>).bid_no as string ?? '',
    kaijo_code: (l as unknown as Record<string, unknown>).kaijo_code as string ?? '',
    photos: [...(l.photos ?? [])],
  }
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white'

function upgradeImageUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.searchParams.has('w') || u.searchParams.has('h')) {
      u.searchParams.set('w', '800')
      u.searchParams.delete('h')
      return u.toString()
    }
    return url
      .replace(/_\d+x\d+(\.(jpg|jpeg|png))/i, '$1')
      .replace(/(\/resize\/w=)\d+/i, '$1800')
  } catch {
    return url
  }
}

export default function DraftEditor({ initial }: { initial: Listing[] }) {
  const [listings, setListings] = useState<Listing[]>(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const [translatingId, setTranslatingId] = useState<string | null>(null)

  const allSelected = listings.length > 0 && listings.every(l => selected.has(l.id))
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(listings.map(l => l.id)))
  const toggleOne = (id: string) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const startEdit = (l: Listing) => {
    setEditingId(l.id)
    setDraft(toDraftState(l))
    setError(null)
    setNewPhotoUrl('')
  }
  const cancelEdit = () => { setEditingId(null); setDraft(null); setError(null) }
  const set = (field: keyof DraftState, value: string | string[]) =>
    setDraft(s => s ? { ...s, [field]: value } : s)

  const addPhoto = () => {
    const raw = newPhotoUrl.trim()
    if (!raw || !draft) return
    set('photos', [...draft.photos, upgradeImageUrl(raw)])
    setNewPhotoUrl('')
  }
  const removePhoto = (i: number) => {
    if (!draft) return
    set('photos', draft.photos.filter((_, idx) => idx !== i))
  }

  const handleSave = async (id: string, approve = false) => {
    if (!draft) return
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        model_name: draft.model_name.trim(),
        grade: draft.grade.trim() || null,
        body_colour: draft.body_colour.trim() || null,
        description: draft.description.trim() || null,
        model_year: draft.model_year ? parseInt(draft.model_year) : null,
        mileage_km: draft.mileage_km ? parseInt(draft.mileage_km) : null,
        aud_estimate: draft.aud_estimate ? Math.round(parseFloat(draft.aud_estimate) * 100) : null,
        transmission: draft.transmission || null,
        drive: draft.drive || null,
        displacement_cc: draft.displacement_cc ? parseInt(draft.displacement_cc) : null,
        chassis_code: draft.chassis_code || null,
        inspection_score: draft.inspection_score || null,
        start_price_jpy: draft.start_price_jpy ? parseInt(draft.start_price_jpy) : null,
        bid_no: draft.bid_no || null,
        kaijo_code: draft.kaijo_code || null,
        photos: draft.photos,
      }
      if (approve) payload.status = 'available'

      const res = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      if (approve) {
        setListings(ls => ls.filter(l => l.id !== id))
        setSelected(s => { const n = new Set(s); n.delete(id); return n })
      } else {
        setListings(ls => ls.map(l => l.id === id ? { ...l, ...data } : l))
      }
      setEditingId(null)
      setDraft(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft listing?')) return
    const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setListings(ls => ls.filter(l => l.id !== id))
      setSelected(s => { const n = new Set(s); n.delete(id); return n })
    }
  }

  const handleRetranslate = async (id: string) => {
    setTranslatingId(id)
    try {
      const res = await fetch(`/api/listings/${id}/retranslate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Translation failed')
      setListings(ls => ls.map(l => l.id === id ? { ...l, ...data.listing } : l))
      if (editingId === id) setDraft(toDraftState(data.listing))
    } catch (e) {
      alert(String(e))
    } finally {
      setTranslatingId(null)
    }
  }

  const bulkApprove = async () => {
    if (!confirm(`Approve & publish ${selected.size} listing${selected.size !== 1 ? 's' : ''}?`)) return
    setBulkWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'available' }),
      })
    ))
    setListings(ls => ls.filter(l => !selected.has(l.id)))
    setSelected(new Set())
    setBulkWorking(false)
  }

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} listing${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/listings/${id}`, { method: 'DELETE' })
    ))
    setListings(ls => ls.filter(l => !selected.has(l.id)))
    setSelected(new Set())
    setBulkWorking(false)
  }

  if (listings.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400">
        <p className="text-4xl mb-3">🎉</p>
        <p className="font-semibold text-gray-600">No draft listings</p>
        <p className="text-sm mt-1">All imported listings have been reviewed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="w-4 h-4 accent-ocean"
          />
          <span className="text-sm text-gray-600">
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </span>
        </label>

        {selected.size > 0 && (
          <>
            <div className="h-4 w-px bg-gray-200" />
            <button
              onClick={bulkApprove}
              disabled={bulkWorking}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-ocean text-white hover:bg-ocean disabled:opacity-50"
            >
              {bulkWorking ? 'Working\u2026' : `\u2713 Approve & Publish (${selected.size})`}
            </button>
            <button
              onClick={bulkDelete}
              disabled={bulkWorking}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete ({selected.size})
            </button>
          </>
        )}
      </div>

      {listings.map(l => {
        const isEditing = editingId === l.id
        const isSelected = selected.has(l.id)
        const rawData = l.raw_data as Record<string, string> | null
        const sourceLabel = l.source === 'auction' ? 'Auction' : l.source === 'dealer_goonet' ? 'Goo-net' : 'Car Sensor'
        const hasDescription = !!(l as unknown as { description?: string }).description
        const isTranslating = translatingId === l.id
        const pdfUrl = l.inspection_sheet

        return (
          <div
            key={l.id}
            className={`bg-white border rounded-xl overflow-hidden ${isEditing ? 'border-ocean shadow-md' : isSelected ? 'border-ocean' : 'border-gray-200'}`}
          >
            {/* Header */}
            <div className="p-5 flex gap-3 items-start">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleOne(l.id)}
                className="w-4 h-4 mt-1 accent-ocean shrink-0"
              />

              {l.photos?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.photos[0]} alt="" className="w-28 h-20 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{sourceLabel}</span>
                  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded">DRAFT</span>
                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-ocean hover:underline font-medium">
                      View PDF
                    </a>
                  )}
                  {rawData?.raw_grade && (
                    <span className="text-xs text-gray-400 font-mono">JP grade: {rawData.raw_grade}</span>
                  )}
                  {rawData?.raw_colour && (
                    <span className="text-xs text-gray-400 font-mono">JP colour: {rawData.raw_colour}</span>
                  )}
                  {rawData?.url && (
                    <a href={rawData.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline">
                      Source
                    </a>
                  )}
                </div>
                <p className="font-semibold text-gray-900">{l.model_name}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {l.model_year} \u00B7 {l.mileage_km?.toLocaleString()} km \u00B7 {l.transmission} \u00B7 {l.drive}
                  {l.grade && ` \u00B7 ${l.grade}`}
                  {l.body_colour && ` \u00B7 ${l.body_colour}`}
                </p>
                {hasDescription && (
                  <p className="text-sm text-gray-600 mt-1 italic">
                    &ldquo;{(l as unknown as { description: string }).description}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0 items-end">
                <div className="flex gap-2">
                  <button
                    onClick={() => isEditing ? cancelEdit() : startEdit(l)}
                    className={`text-sm font-semibold px-3 py-1.5 rounded-lg border ${
                      isEditing
                        ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        : 'border-ocean text-ocean hover:bg-cream'
                    }`}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
                <button
                  onClick={() => handleRetranslate(l.id)}
                  disabled={isTranslating}
                  className="text-xs px-3 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                >
                  {isTranslating ? 'Translating\u2026' : 'Re-translate'}
                </button>
              </div>
            </div>

            {/* Edit form with side-by-side PDF viewer */}
            {isEditing && draft && (
              <div className="border-t border-cream bg-gray-50 p-5">
                <div className="grid lg:grid-cols-2 gap-6">

                  {/* Left: PDF Viewer */}
                  <div className="min-h-0">
                    {pdfUrl ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-600">Auction Sheet</p>
                          <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-ocean hover:underline">
                            Open in new tab
                          </a>
                        </div>
                        <iframe
                          src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                          className="w-full rounded-xl border border-gray-200 bg-white"
                          style={{ height: 700 }}
                          title="Auction sheet PDF"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100 rounded-xl border border-gray-200 text-gray-400 text-sm p-10 text-center">
                        <div>
                          <p className="text-3xl mb-2">📄</p>
                          <p className="font-medium">No auction sheet PDF</p>
                          <p className="text-xs mt-1">Upload a PDF via the auction sheet upload page to view it here.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Edit Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Model Name</label>
                      <input value={draft.model_name} onChange={e => set('model_name', e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Grade</label>
                        <input value={draft.grade} onChange={e => set('grade', e.target.value)} className={inputClass} placeholder="e.g. Super GL" />
                        {rawData?.raw_grade && (
                          <p className="text-xs text-gray-400 mt-1">JP: <span className="font-mono">{rawData.raw_grade}</span></p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Body Colour</label>
                        <input value={draft.body_colour} onChange={e => set('body_colour', e.target.value)} className={inputClass} placeholder="e.g. Pearl White" />
                        {rawData?.raw_colour && (
                          <p className="text-xs text-gray-400 mt-1">JP: <span className="font-mono">{rawData.raw_colour}</span></p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Chassis Code</label>
                        <input value={draft.chassis_code} onChange={e => set('chassis_code', e.target.value)} className={inputClass} placeholder="e.g. GDH211K" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Inspection Score</label>
                        <select value={draft.inspection_score} onChange={e => set('inspection_score', e.target.value)} className={inputClass}>
                          <option value="">--</option>
                          {['S','6','5.5','5','4.5','4','3.5','3','R','RA','X'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Year</label>
                        <input type="number" value={draft.model_year} onChange={e => set('model_year', e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mileage (km)</label>
                        <input type="number" value={draft.mileage_km} onChange={e => set('mileage_km', e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Transmission</label>
                        <select value={draft.transmission} onChange={e => set('transmission', e.target.value)} className={inputClass}>
                          <option value="">--</option>
                          <option value="IA">Automatic (IA)</option>
                          <option value="AT">Automatic (AT)</option>
                          <option value="MT">Manual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Drive</label>
                        <select value={draft.drive} onChange={e => set('drive', e.target.value)} className={inputClass}>
                          <option value="">--</option>
                          <option value="2WD">2WD</option>
                          <option value="4WD">4WD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Engine (cc)</label>
                        <input type="number" value={draft.displacement_cc} onChange={e => set('displacement_cc', e.target.value)} className={inputClass} placeholder="2800" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Price (JPY)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm text-gray-400">\u00A5</span>
                          <input type="number" value={draft.start_price_jpy} onChange={e => set('start_price_jpy', e.target.value)} className={`${inputClass} pl-6`} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">AUD Estimate ($)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                          <input type="number" value={draft.aud_estimate} onChange={e => set('aud_estimate', e.target.value)} className={`${inputClass} pl-6`} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Auction Site</label>
                        <input value={draft.kaijo_code} onChange={e => set('kaijo_code', e.target.value)} className={inputClass} placeholder="e.g. Tokyo" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bid Number</label>
                        <input value={draft.bid_no} onChange={e => set('bid_no', e.target.value)} className={inputClass} placeholder="e.g. 402" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                      <textarea
                        value={draft.description}
                        onChange={e => set('description', e.target.value)}
                        rows={3}
                        className={`${inputClass} resize-none`}
                        placeholder="Write a short English description for this van..."
                      />
                    </div>

                    {/* Photos */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-semibold text-gray-600">
                          Photos <span className="text-gray-400 font-normal">({draft.photos.length})</span>
                        </label>
                        {draft.photos.length > 0 && (
                          <button
                            onClick={() => set('photos', [])}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {draft.photos.map((url, i) => (
                          <div key={i} className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="w-20 h-14 object-cover rounded-lg border border-gray-200" />
                            <button
                              onClick={() => removePhoto(i)}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >\u2715</button>
                            {i === 0 && (
                              <span className="absolute bottom-0.5 left-0.5 bg-ocean text-white text-[9px] font-bold px-1 rounded">COVER</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={newPhotoUrl}
                          onChange={e => setNewPhotoUrl(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addPhoto()}
                          placeholder="Paste image URL"
                          className={`${inputClass} flex-1`}
                        />
                        <button onClick={addPhoto} className="px-3 py-2 bg-ocean text-white text-sm rounded-lg hover:bg-ocean shrink-0">
                          Add
                        </button>
                        <PhotoUploadButton onUploaded={url => setDraft(s => s ? { ...s, photos: [...s.photos, url] } : s)} />
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleSave(l.id, true)}
                        disabled={saving}
                        className="btn-primary btn-sm disabled:opacity-50"
                      >
                        {saving ? 'Publishing\u2026' : '\u2713 Approve & Publish'}
                      </button>
                      <button
                        onClick={() => handleSave(l.id, false)}
                        disabled={saving}
                        className="btn-secondary btn-sm disabled:opacity-50"
                      >
                        {saving ? 'Saving\u2026' : 'Save Draft'}
                      </button>
                      <button onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-700 px-2">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
