'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Partner {
  id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  abn: string | null
  address: string | null
  website: string | null
  commission_aud: number | null
  commission_type: string | null
  terms_notes: string | null
  status: string
  agreement_sent_at: string | null
  agreement_signed_at: string | null
  notes: string | null
  created_at: string
}

interface Listing {
  id: string
  model_name: string
  model_year: number | null
  mileage_km: number | null
  photos: string[] | null
  status: string
  au_price_aud: number | null
  source_url: string | null
  created_at: string
}

export default function AdminPartnerDetailClient({ partner: initial, listings }: { partner: Partner; listings: Listing[] }) {
  const [partner, setPartner] = useState(initial)
  const [sendingAgreement, setSendingAgreement] = useState(false)
  const [notifyingFor, setNotifyingFor] = useState<string | null>(null)

  async function sendAgreement() {
    if (!partner.contact_email) { alert('No contact email on partner'); return }
    if (!confirm(`Send the agreement email to ${partner.contact_email}?`)) return
    setSendingAgreement(true)
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_agreement' }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const updated = await res.json()
      setPartner(updated)
      alert(`Agreement sent to ${partner.contact_email}`)
    } catch (err) { alert('Failed: ' + String(err)) }
    finally { setSendingAgreement(false) }
  }

  async function markSigned() {
    const updated = await fetch(`/api/admin/partners/${partner.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agreement_signed_at: new Date().toISOString() }),
    }).then(r => r.json())
    setPartner(updated)
  }

  async function notifyPartnerForListing(listingId: string) {
    const customerName = prompt('Customer name (optional, sent to partner):') ?? ''
    setNotifyingFor(listingId)
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}/sale-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, customer_name: customerName }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      alert(`Sale notification sent to ${partner.contact_email}`)
    } catch (err) { alert('Failed: ' + String(err)) }
    finally { setNotifyingFor(null) }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">{partner.name}</h1>
            {partner.address && <p className="text-sm text-gray-500">{partner.address}</p>}
            {partner.website && <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-xs text-ocean hover:underline">{partner.website} →</a>}
          </div>
          <div className="flex gap-2">
            {!partner.agreement_sent_at && (
              <button onClick={sendAgreement} disabled={sendingAgreement || !partner.contact_email} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50">
                {sendingAgreement ? 'Sending…' : '✉️ Send Agreement Email'}
              </button>
            )}
            {partner.agreement_sent_at && !partner.agreement_signed_at && (
              <>
                <button onClick={sendAgreement} disabled={sendingAgreement} className="text-xs border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">
                  Resend
                </button>
                <button onClick={markSigned} className="text-xs border border-green-300 text-green-700 px-3 py-1.5 rounded hover:bg-green-50">
                  Mark as Signed
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-cream rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Contact</p>
            <p className="text-sm font-semibold text-charcoal">{partner.contact_name ?? '—'}</p>
            <p className="text-xs text-gray-500">{partner.contact_email ?? ''}</p>
            <p className="text-xs text-gray-500">{partner.contact_phone ?? ''}</p>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Per-vehicle</p>
            <p className="text-2xl font-bold text-ocean">${(partner.commission_aud ?? 0).toLocaleString('en-AU')}</p>
            <p className="text-xs text-gray-500">{partner.commission_type ?? 'discount'}</p>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Status</p>
            <p className="text-sm font-semibold text-charcoal capitalize">{partner.status}</p>
            {partner.agreement_signed_at && <p className="text-xs text-green-700">Signed ✓ {new Date(partner.agreement_signed_at).toLocaleDateString('en-AU')}</p>}
            {partner.agreement_sent_at && !partner.agreement_signed_at && <p className="text-xs text-amber-700">Agreement sent {new Date(partner.agreement_sent_at).toLocaleDateString('en-AU')}</p>}
          </div>
        </div>

        {partner.terms_notes && (
          <div className="bg-cream border-l-4 border-sand rounded p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Terms</p>
            <p className="text-sm text-charcoal whitespace-pre-wrap">{partner.terms_notes}</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-bold text-charcoal">Listings from this partner</h2>
          <Link href={`/admin/partners/${partner.id}/add-listing`} className="text-sm text-ocean hover:underline font-medium">+ Add listing</Link>
        </div>
        {listings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
            No listings yet. <Link href={`/admin/partners/${partner.id}/add-listing`} className="text-ocean hover:underline">Add one →</Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {listings.map(l => (
              <div key={l.id} className="p-4 flex items-center gap-4">
                {l.photos?.[0] ? (
                  <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    <Image src={l.photos[0]} alt="" fill className="object-cover" sizes="80px" />
                  </div>
                ) : (
                  <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl shrink-0">🚐</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal text-sm">{l.model_year} {l.model_name}</p>
                  <p className="text-xs text-gray-500">
                    {l.mileage_km && `${l.mileage_km.toLocaleString()} km · `}
                    <span className="capitalize">{l.status.replace('_', ' ')}</span>
                  </p>
                  {l.au_price_aud && <p className="text-sm font-bold text-charcoal">${(l.au_price_aud / 100).toLocaleString('en-AU')}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/listings?id=${l.id}`} className="text-xs text-ocean hover:underline">Edit</Link>
                  <button onClick={() => notifyPartnerForListing(l.id)} disabled={notifyingFor === l.id || !partner.contact_email}
                    className="text-xs border border-ocean/30 text-ocean px-2 py-1 rounded hover:bg-ocean/5 disabled:opacity-50">
                    {notifyingFor === l.id ? 'Sending…' : '✉️ Notify Sale'}
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
