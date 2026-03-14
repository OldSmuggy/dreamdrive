'use client'

import { useState } from 'react'
import type { Listing } from '@/types'

type DraftState = {
  model_name: string
  grade: string
  body_colour: string
  description: string
  model_year: string
  mileage_km: string
  aud_estimate: string
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
    photos: [...(l.photos ?? [])],
  }
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white'

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
    const url = newPhotoUrl.trim()
    if (!url || !draft) return
    set('photos', [...draft.photos, url])
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
            className="w-4 h-4 accent-forest-600"
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
              className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-50"
            >
              {bulkWorking ? 'Working…' : `✓ Approve & Publish (${selected.size})`}
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
        const sourceLabel = l.source === 'dealer_goonet' ? 'Goo-net' : 'Car Sensor'
        const hasDescription = !!(l as unknown as { description?: string }).description
        const isTranslating = translatingId === l.id

        return (
          <div
            key={l.id}
            className={`bg-white border rounded-xl overflow-hidden ${isEditing ? 'border-forest-300 shadow-md' : isSelected ? 'border-forest-300' : 'border-gray-200'}`}
          >
            {/* Header */}
            <div className="p-5 flex gap-3 items-start">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleOne(l.id)}
                className="w-4 h-4 mt-1 accent-forest-600 shrink-0"
              />

              {l.photos?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.photos[0]} alt="" className="w-28 h-20 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{sourceLabel}</span>
                  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded">DRAFT</span>
                  {rawData?.raw_grade && (
                    <span className="text-xs text-gray-400 font-mono">JP grade: {rawData.raw_grade}</span>
                  )}
                  {rawData?.raw_colour && (
                    <span className="text-xs text-gray-400 font-mono">JP colour: {rawData.raw_colour}</span>
                  )}
                  {rawData?.url && (
                    <a href={rawData.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline">
                      Source ↗
                    </a>
                  )}
                </div>
                <p className="font-semibold text-gray-900">{l.model_name}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {l.model_year} · {l.mileage_km?.toLocaleString()} km · {l.transmission} · {l.drive}
                  {l.grade && ` · ${l.grade}`}
                  {l.body_colour && ` · ${l.body_colour}`}
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
                        : 'border-forest-600 text-forest-700 hover:bg-forest-50'
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
                  {isTranslating ? 'Translating…' : '🌐 Re-translate'}
                </button>
              </div>
            </div>

            {/* Edit form */}
            {isEditing && draft && (
              <div className="border-t border-forest-100 bg-gray-50 p-5">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Model Name</label>
                    <input value={draft.model_name} onChange={e => set('model_name', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Grade</label>
                    <input value={draft.grade} onChange={e => set('grade', e.target.value)} className={inputClass} placeholder="e.g. Super GL" />
                    {rawData?.raw_grade && (
                      <p className="text-xs text-gray-400 mt-1">Original Japanese: <span className="font-mono">{rawData.raw_grade}</span></p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Body Colour</label>
                    <input value={draft.body_colour} onChange={e => set('body_colour', e.target.value)} className={inputClass} placeholder="e.g. Pearl White" />
                    {rawData?.raw_colour && (
                      <p className="text-xs text-gray-400 mt-1">Original Japanese: <span className="font-mono">{rawData.raw_colour}</span></p>
                    )}
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">AUD Estimate ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                      <input type="number" value={draft.aud_estimate} onChange={e => set('aud_estimate', e.target.value)} className={`${inputClass} pl-6`} placeholder="0" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                    <textarea
                      value={draft.description}
                      onChange={e => set('description', e.target.value)}
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="Write a short English description for this van..."
                    />
                  </div>
                </div>

                {/* Photos */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-3">
                    Photos <span className="text-gray-400 font-normal">({draft.photos.length} — first is cover)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {draft.photos.map((url, i) => (
                      <div key={i} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >✕</button>
                        {i === 0 && (
                          <span className="absolute bottom-0.5 left-0.5 bg-forest-600 text-white text-[9px] font-bold px-1 rounded">COVER</span>
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
                    <button onClick={addPhoto} className="px-4 py-2 bg-forest-600 text-white text-sm rounded-lg hover:bg-forest-700 shrink-0">
                      Add
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleSave(l.id, true)}
                    disabled={saving}
                    className="btn-primary btn-sm disabled:opacity-50"
                  >
                    {saving ? 'Publishing…' : '✓ Approve & Publish'}
                  </button>
                  <button
                    onClick={() => handleSave(l.id, false)}
                    disabled={saving}
                    className="btn-secondary btn-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save Draft'}
                  </button>
                  <button onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-700 px-2">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
