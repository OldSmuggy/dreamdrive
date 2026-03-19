'use client'

import { useState } from 'react'

interface Setting {
  key: string
  value: string | null
  label: string | null
}

export default function SettingsEditor({ initial }: { initial: Setting[] }) {
  const [settings, setSettings] = useState<Setting[]>(initial)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (s: Setting) => {
    setEditingKey(s.key)
    setDraft(s.value ?? '')
    setError(null)
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setDraft('')
    setError(null)
  }

  const handleSave = async (key: string) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: draft.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      setSettings(ss => ss.map(s => s.key === key ? { ...s, value: data.value } : s))
      setEditingKey(null)
      setSavedKey(key)
      setTimeout(() => setSavedKey(null), 3000)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent bg-white font-mono'

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {settings.map((s, i) => {
        const isEditing = editingKey === s.key
        return (
          <div
            key={s.key}
            className={`px-5 py-4 ${i > 0 ? 'border-t border-gray-100' : ''} ${isEditing ? 'bg-cream' : i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
          >
            <div className="flex gap-4 items-start">
              {/* Key + label */}
              <div className="w-56 shrink-0 pt-0.5">
                <p className="font-mono text-xs text-gray-600 font-semibold">{s.key}</p>
                {s.label && <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>}
              </div>

              {/* Value / edit */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div>
                    <input
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSave(s.key)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      autoFocus
                      className={inputClass}
                      placeholder="empty"
                    />
                    {error && (
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSave(s.key)}
                        disabled={saving}
                        className="text-xs px-3 py-1.5 bg-ocean text-white rounded-lg font-semibold hover:bg-ocean disabled:opacity-50"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-800 font-mono flex-1 truncate">
                      {s.value || <span className="text-gray-300 italic not-italic font-sans">empty</span>}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {savedKey === s.key && (
                        <span className="text-xs text-ocean font-semibold">✓ Saved</span>
                      )}
                      <button
                        onClick={() => startEdit(s)}
                        className="text-xs px-3 py-1.5 border border-ocean text-ocean rounded-lg font-semibold hover:bg-cream"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
