'use client'

import { useState } from 'react'
import { centsToAud } from '@/lib/utils'
import type { Product } from '@/types'

type EditState = {
  name: string
  description: string
  rrp_dollars: string
  special_dollars: string
  special_label: string
  special_start: string
  special_end: string
  visible: boolean
  sort_order: string
}

function toEditState(p: Product): EditState {
  return {
    name: p.name,
    description: p.description ?? '',
    rrp_dollars: p.rrp_aud > 0 ? (p.rrp_aud / 100).toFixed(0) : '0',
    special_dollars: p.special_price_aud ? (p.special_price_aud / 100).toFixed(0) : '',
    special_label: p.special_label ?? '',
    special_start: p.special_start ? p.special_start.slice(0, 10) : '',
    special_end: p.special_end ? p.special_end.slice(0, 10) : '',
    visible: p.visible,
    sort_order: p.sort_order.toString(),
  }
}

export default function ProductsEditor({ initial }: { initial: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (p: Product) => {
    setEditingId(p.id)
    setEditState(toEditState(p))
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditState(null)
    setError(null)
  }

  const set = (field: keyof EditState, value: string | boolean) =>
    setEditState(s => s ? { ...s, [field]: value } : s)

  const handleSave = async (id: string) => {
    if (!editState) return
    setSaving(true)
    setError(null)

    const payload = {
      id,
      name: editState.name.trim(),
      description: editState.description.trim() || null,
      rrp_aud: Math.round(parseFloat(editState.rrp_dollars || '0') * 100),
      special_price_aud: editState.special_dollars
        ? Math.round(parseFloat(editState.special_dollars) * 100)
        : null,
      special_label: editState.special_label.trim() || null,
      special_start: editState.special_start || null,
      special_end: editState.special_end || null,
      visible: editState.visible,
      sort_order: parseInt(editState.sort_order || '0', 10),
    }

    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      setProducts(ps => ps.map(p => p.id === id ? data : p))
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

  const now = Date.now()
  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent bg-white'

  return (
    <div className="space-y-3">
      {products.map(p => {
        const isEditing = editingId === p.id
        const isSpecialActive = p.special_price_aud && p.special_start && p.special_end
          && now >= new Date(p.special_start).getTime()
          && now <= new Date(p.special_end).getTime()

        return (
          <div
            key={p.id}
            className={`bg-white border rounded-xl overflow-hidden transition-shadow ${isEditing ? 'shadow-md border-forest-300' : 'border-gray-200'} ${!p.visible ? 'opacity-60' : ''}`}
          >
            {/* ---- Header row ---- */}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-900">{p.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{p.category}</span>
                  <span className="text-xs text-gray-400 font-mono">/{p.slug}</span>
                  {!p.visible && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-semibold">Hidden</span>
                  )}
                  {isSpecialActive && p.special_label && (
                    <span className="text-xs bg-amber-400 text-amber-900 font-bold px-2 py-0.5 rounded">
                      🔥 {p.special_label}
                    </span>
                  )}
                  {savedId === p.id && (
                    <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded font-semibold">✓ Saved</span>
                  )}
                </div>
                {p.description && (
                  <p className="text-sm text-gray-500 truncate max-w-lg">{p.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {p.rrp_aud > 0 ? centsToAud(p.rrp_aud) : 'Contact'}
                  </p>
                  {isSpecialActive && p.special_price_aud && (
                    <p className="text-xs text-amber-700">Sale: {centsToAud(p.special_price_aud)}</p>
                  )}
                </div>
                <button
                  onClick={() => isEditing ? cancelEdit() : startEdit(p)}
                  className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${
                    isEditing
                      ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      : 'border-forest-600 text-forest-700 hover:bg-forest-50'
                  }`}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {/* ---- Inline edit form ---- */}
            {isEditing && editState && (
              <div className="border-t border-forest-100 bg-gray-50 p-5">
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
                    <input
                      value={editState.name}
                      onChange={e => set('name', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sort Order</label>
                    <input
                      type="number"
                      value={editState.sort_order}
                      onChange={e => set('sort_order', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                    <textarea
                      value={editState.description}
                      onChange={e => set('description', e.target.value)}
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="Short description shown in the configurator and on the product page"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">RRP Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editState.rrp_dollars}
                        onChange={e => set('rrp_dollars', e.target.value)}
                        className={`${inputClass} pl-6`}
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Enter in whole dollars — e.g. 11900 for $11,900</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Visible in configurator
                    </label>
                    <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editState.visible}
                        onChange={e => set('visible', e.target.checked)}
                        className="w-4 h-4 accent-forest-600"
                      />
                      <span className="text-sm text-gray-700">
                        {editState.visible ? 'Visible' : 'Hidden — won\'t appear to customers'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Special pricing */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-semibold text-gray-600 mb-3">
                    Special / Sale Pricing
                    <span className="font-normal text-gray-400 ml-1.5">(optional — leave blank to hide)</span>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Sale Price ($)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editState.special_dollars}
                          onChange={e => set('special_dollars', e.target.value)}
                          className={`${inputClass} pl-6`}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Label</label>
                      <input
                        value={editState.special_label}
                        onChange={e => set('special_label', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Launch Special"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={editState.special_start}
                        onChange={e => set('special_start', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Date</label>
                      <input
                        type="date"
                        value={editState.special_end}
                        onChange={e => set('special_end', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={saving}
                    className="btn-primary btn-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary btn-sm">
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
