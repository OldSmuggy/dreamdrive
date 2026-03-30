'use client'

import { useState } from 'react'
import { VehicleTip, VehicleTipStatus } from '@/types'

const STATUS_LABELS: Record<VehicleTipStatus, string> = {
  pending:   'Pending',
  reviewing: 'Reviewing',
  matched:   'Matched',
  paid:      'Paid ✓',
  declined:  'Declined',
}

const STATUS_COLOURS: Record<VehicleTipStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  matched:   'bg-ocean/10 text-ocean',
  paid:      'bg-green-100 text-green-800',
  declined:  'bg-gray-100 text-gray-500',
}

const ALL_STATUSES: VehicleTipStatus[] = ['pending', 'reviewing', 'matched', 'paid', 'declined']

export default function VehicleTipsClient({ tips: initial }: { tips: VehicleTip[] }) {
  const [tips, setTips] = useState(initial)
  const [filter, setFilter] = useState<VehicleTipStatus | 'all'>('all')
  const [saving, setSaving] = useState<string | null>(null)

  const filtered = filter === 'all' ? tips : tips.filter(t => t.status === filter)

  const counts = tips.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  async function updateStatus(id: string, status: VehicleTipStatus) {
    setSaving(id)
    try {
      const res = await fetch(`/api/admin/vehicle-tips/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setTips(prev => prev.map(t => t.id === id ? { ...t, status, paid_at: status === 'paid' ? new Date().toISOString() : t.paid_at } : t))
    } catch (err) {
      alert('Failed to update status. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  async function saveAdminNotes(id: string, admin_notes: string) {
    await fetch(`/api/admin/vehicle-tips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes }),
    })
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All ({tips.length})
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {STATUS_LABELS[s]} {counts[s] ? `(${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-400 text-sm py-8 text-center">No tips in this category yet.</p>
      )}

      <div className="space-y-4">
        {filtered.map(tip => (
          <TipCard
            key={tip.id}
            tip={tip}
            saving={saving === tip.id}
            onStatusChange={(status) => updateStatus(tip.id, status)}
            onNotesBlur={(notes) => saveAdminNotes(tip.id, notes)}
          />
        ))}
      </div>
    </div>
  )
}

function TipCard({
  tip,
  saving,
  onStatusChange,
  onNotesBlur,
}: {
  tip: VehicleTip
  saving: boolean
  onStatusChange: (s: VehicleTipStatus) => void
  onNotesBlur: (notes: string) => void
}) {
  const [adminNotes, setAdminNotes] = useState(tip.admin_notes ?? '')

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-charcoal">{tip.name}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLOURS[tip.status]}`}>
              {STATUS_LABELS[tip.status]}
            </span>
          </div>
          <div className="text-sm text-gray-500 flex flex-wrap gap-3">
            <a href={`mailto:${tip.email}`} className="text-ocean hover:underline">{tip.email}</a>
            {tip.phone && <span>{tip.phone}</span>}
            <span className="text-gray-300">·</span>
            <span>{new Date(tip.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Status change */}
        <div className="flex items-center gap-2">
          <select
            value={tip.status}
            disabled={saving}
            onChange={e => onStatusChange(e.target.value as VehicleTipStatus)}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean disabled:opacity-50"
          >
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          {saving && <span className="text-xs text-gray-400">Saving…</span>}
        </div>
      </div>

      {/* Vehicle URL */}
      {tip.vehicle_url && (
        <div className="mt-3">
          <a
            href={tip.vehicle_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ocean hover:underline break-all"
          >
            {tip.vehicle_url}
          </a>
        </div>
      )}

      {/* Customer notes */}
      {tip.notes && (
        <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
          &ldquo;{tip.notes}&rdquo;
        </p>
      )}

      {/* Matched listing */}
      {tip.listing && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-gray-500">Matched to:</span>
          <span className="font-medium text-charcoal">
            {tip.listing.model_year} {tip.listing.model_name}
          </span>
        </div>
      )}

      {/* Paid info */}
      {tip.paid_at && (
        <p className="mt-2 text-xs text-green-600">
          Fee paid on {new Date(tip.paid_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}

      {/* Admin notes */}
      <div className="mt-4">
        <textarea
          value={adminNotes}
          onChange={e => setAdminNotes(e.target.value)}
          onBlur={() => onNotesBlur(adminNotes)}
          rows={2}
          placeholder="Admin notes (auto-saved on blur)…"
          className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean/20 focus:border-ocean resize-none bg-gray-50"
        />
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
        <span>Fee: ${(tip.finders_fee_aud / 100).toFixed(0)} AUD</span>
        <span>·</span>
        <span>ID: {tip.id.slice(0, 8)}</span>
      </div>
    </div>
  )
}
