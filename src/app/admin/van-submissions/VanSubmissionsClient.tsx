'use client'

import { useState } from 'react'
import Image from 'next/image'
import { VanSubmission, VanSubmissionStatus, TrustedSubmitter } from '@/types'

const STATUS_LABELS: Record<VanSubmissionStatus, string> = {
  pending_review: 'Pending Review',
  approved:       'Approved ✓',
  rejected:       'Declined',
}
const STATUS_COLOURS: Record<VanSubmissionStatus, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved:       'bg-green-100 text-green-800',
  rejected:       'bg-gray-100 text-gray-500',
}

type Filter = 'all' | VanSubmissionStatus

export default function VanSubmissionsClient({
  submissions: initial,
  trustedSubmitters: initialTrusted,
}: {
  submissions: VanSubmission[]
  trustedSubmitters: TrustedSubmitter[]
}) {
  const [submissions, setSubmissions] = useState(initial)
  const [trusted, setTrusted]         = useState(initialTrusted)
  const [filter, setFilter]           = useState<Filter>('all')
  const [loading, setLoading]         = useState<string | null>(null)

  // Trusted submitter add form
  const [newEmail, setNewEmail] = useState('')
  const [newName,  setNewName]  = useState('')
  const [addingTrusted, setAddingTrusted] = useState(false)

  const filtered = filter === 'all'
    ? submissions
    : submissions.filter(s => s.status === filter)

  const counts = submissions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // ── Approve ──────────────────────────────────────────────────────────────
  async function approve(id: string) {
    setLoading(id)
    try {
      const res = await fetch(`/api/admin/van-submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', publish: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'approved', listing_id: data.listing_id } : s))
      if (data.listing_url) {
        window.open(data.listing_url, '_blank')
      }
    } catch (err) {
      alert('Failed to approve: ' + String(err))
    } finally {
      setLoading(null)
    }
  }

  // ── Reject ───────────────────────────────────────────────────────────────
  async function reject(id: string) {
    if (!confirm('Reject this submission? The customer will receive a polite email.')) return
    setLoading(id)
    try {
      const res = await fetch(`/api/admin/van-submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s))
    } catch (err) {
      alert('Failed: ' + String(err))
    } finally {
      setLoading(null)
    }
  }

  // ── Pay fee ──────────────────────────────────────────────────────────────
  async function payFee(id: string) {
    if (!confirm('Mark fee as paid? This will email the customer their $200 finders fee notification.')) return
    setLoading(id)
    try {
      await fetch(`/api/admin/van-submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay_fee' }),
      })
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, fee_paid_at: new Date().toISOString() } : s))
    } catch {
      alert('Failed')
    } finally {
      setLoading(null)
    }
  }

  // ── Save admin notes ─────────────────────────────────────────────────────
  async function saveNotes(id: string, notes: string) {
    await fetch(`/api/admin/van-submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notes', admin_notes: notes }),
    })
  }

  // ── Add trusted submitter ────────────────────────────────────────────────
  async function addTrusted(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail) return
    setAddingTrusted(true)
    try {
      const res = await fetch('/api/admin/trusted-submitters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTrusted(prev => [data.submitter, ...prev])
      setNewEmail('')
      setNewName('')
    } catch (err) {
      alert('Failed: ' + String(err))
    } finally {
      setAddingTrusted(false)
    }
  }

  // ── Remove trusted submitter ─────────────────────────────────────────────
  async function removeTrusted(id: string) {
    if (!confirm('Remove this trusted submitter?')) return
    try {
      await fetch('/api/admin/trusted-submitters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setTrusted(prev => prev.filter(t => t.id !== id))
    } catch {
      alert('Failed to remove')
    }
  }

  return (
    <div className="space-y-8">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending_review', 'approved', 'rejected'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? `All (${submissions.length})` : `${STATUS_LABELS[f as VanSubmissionStatus]} ${counts[f] ? `(${counts[f]})` : ''}`}
          </button>
        ))}
      </div>

      {/* Submission cards */}
      {filtered.length === 0 && (
        <p className="text-gray-400 text-sm py-8 text-center">No submissions in this category yet.</p>
      )}

      <div className="space-y-5">
        {filtered.map(sub => (
          <SubmissionCard
            key={sub.id}
            sub={sub}
            loading={loading === sub.id}
            onApprove={() => approve(sub.id)}
            onReject={() => reject(sub.id)}
            onPayFee={() => payFee(sub.id)}
            onNotesBlur={(notes) => saveNotes(sub.id, notes)}
          />
        ))}
      </div>

      {/* ── Trusted Submitters ────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-lg font-bold text-charcoal mb-1">Trusted Submitters</h2>
        <p className="text-gray-500 text-sm mb-5">
          Vans submitted by these email addresses <strong>auto-publish immediately</strong> without needing your approval.
        </p>

        {/* Add form */}
        <form onSubmit={addTrusted} className="flex gap-3 mb-5 flex-wrap">
          <input
            type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder="Email address" required
            className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
          />
          <input
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Name (optional)"
            className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
          />
          <button type="submit" disabled={addingTrusted}
            className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
            {addingTrusted ? 'Adding…' : '+ Add trusted submitter'}
          </button>
        </form>

        {trusted.length === 0 ? (
          <p className="text-gray-400 text-sm">No trusted submitters yet.</p>
        ) : (
          <div className="space-y-2">
            {trusted.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div>
                  <span className="font-medium text-charcoal text-sm">{t.email}</span>
                  {t.name && <span className="text-gray-400 text-sm ml-2">— {t.name}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => removeTrusted(t.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Submission card ─────────────────────────────────────────────────────────
function SubmissionCard({
  sub, loading, onApprove, onReject, onPayFee, onNotesBlur,
}: {
  sub: VanSubmission
  loading: boolean
  onApprove: () => void
  onReject: () => void
  onPayFee: () => void
  onNotesBlur: (notes: string) => void
}) {
  const [adminNotes, setAdminNotes] = useState(sub.admin_notes ?? '')
  const [showPhotos, setShowPhotos] = useState(false)

  const vanTitle = `${sub.model_year ? `${sub.model_year} ` : ''}${sub.model_name}`

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-charcoal text-lg">{vanTitle}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLOURS[sub.status]}`}>
              {STATUS_LABELS[sub.status]}
            </span>
            {sub.auto_published && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-ocean/10 text-ocean">Auto-published</span>
            )}
          </div>
          <div className="text-sm text-gray-500 flex flex-wrap gap-3 items-center">
            <span className="font-medium text-charcoal">{sub.name}</span>
            <a href={`mailto:${sub.email}`} className="text-ocean hover:underline">{sub.email}</a>
            {sub.phone && <span>{sub.phone}</span>}
            <span className="text-gray-300">·</span>
            <span>{new Date(sub.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {sub.status === 'pending_review' && (
            <>
              <button onClick={onApprove} disabled={loading}
                className="btn-primary btn-sm px-4 py-2 text-sm disabled:opacity-50">
                {loading ? 'Approving…' : 'Approve & Publish'}
              </button>
              <button onClick={onReject} disabled={loading}
                className="text-sm border border-red-200 text-red-500 rounded-lg px-3 py-2 hover:bg-red-50 transition-colors disabled:opacity-50">
                Decline
              </button>
            </>
          )}
          {sub.status === 'approved' && (
            <div className="flex gap-2">
              {sub.listing_id && (
                <a href={`/van/${sub.listing_id}`} target="_blank"
                  className="text-sm border border-ocean text-ocean rounded-lg px-3 py-2 hover:bg-ocean/5 transition-colors">
                  View listing →
                </a>
              )}
              {!sub.fee_paid_at ? (
                <button onClick={onPayFee} disabled={loading}
                  className="text-sm border border-green-300 text-green-700 rounded-lg px-3 py-2 hover:bg-green-50 transition-colors disabled:opacity-50">
                  Mark fee paid ($200)
                </button>
              ) : (
                <span className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
                  Fee paid ✓ {new Date(sub.fee_paid_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Body', value: sub.body_type },
          { label: 'Transmission', value: sub.transmission === 'AT' ? 'Auto' : sub.transmission === 'MT' ? 'Manual' : null },
          { label: 'Mileage', value: sub.mileage_km ? `${sub.mileage_km.toLocaleString()} km` : null },
          { label: 'Location', value: sub.location },
          { label: 'Asking price', value: sub.asking_price_aud ? `$${(sub.asking_price_aud / 100).toLocaleString()} AUD` : null },
          { label: 'Finders fee', value: `$${(sub.finders_fee_aud / 100).toFixed(0)} AUD` },
        ].filter(s => s.value).map(spec => (
          <div key={spec.label} className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-400 mb-0.5">{spec.label}</p>
            <p className="text-sm font-medium text-charcoal">{spec.value}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      {sub.notes && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed mb-4">
          &ldquo;{sub.notes}&rdquo;
        </p>
      )}

      {/* Photo strip */}
      {sub.photos.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowPhotos(v => !v)}
            className="text-sm text-ocean hover:underline mb-2 block"
          >
            {showPhotos ? 'Hide photos ↑' : `Show ${sub.photos.length} photos ↓`}
          </button>
          {showPhotos && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {sub.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-[4/3] rounded-lg overflow-hidden block">
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover hover:opacity-90 transition-opacity" sizes="120px" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin notes */}
      <textarea
        value={adminNotes}
        onChange={e => setAdminNotes(e.target.value)}
        onBlur={() => onNotesBlur(adminNotes)}
        rows={2}
        placeholder="Admin notes (auto-saved)…"
        className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean/20 focus:border-ocean resize-none bg-gray-50"
      />
    </div>
  )
}
