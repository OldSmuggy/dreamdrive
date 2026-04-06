'use client'

import { useState, useRef } from 'react'
import { centsToAud, sourceLabel } from '@/lib/utils'
import { getAuMarketPrice } from '@/lib/au-market-price'
import { estimateLandedAud, listingDisplayPrice } from '@/lib/pricing'
import type { Listing, Source } from '@/types'
import PhotoUploadButton from '@/components/ui/PhotoUploadButton'

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
  market_comparison_aud: string
  source: string
  status: string
  au_status: string
  location_status: string
  fit_out_level: string
  vehicle_model: string
  conversion_video_url: string
  spin_video: string
  featured: boolean
  has_nav: boolean
  has_leather: boolean
  has_sunroof: boolean
  has_alloys: boolean
  has_fitout: boolean
  fitout_grade: string
  power_system: string
  image_focal_point: string
  photos: string[]
  internal_photos: string[]
  show_interior_gallery: boolean
  contact_phone: string
  condition_notes: string
  engine: string
  chassis_code: string
  inspection_score: string
  kaijo_code: string
  auction_date: string
  bid_no: string
  auction_count: string
  has_power_steering: boolean
  has_power_windows: boolean
  has_rear_ac: boolean
  auction_time: string
  auction_result: string
  sold_price_jpy: string
  top_bid_jpy: string
  curation_badge: string
  pipeline_stage: string
  pipeline_eta: string
  au_market_price_low: string
  au_market_price_high: string
  au_market_source: string
  au_market_note: string
  notes: Array<{ id: string; author: string; date: string; sentiment: string; type: string; content: string }>
  inspiration_title: string
  inspiration_description: string
  inspiration_link: string
  inspiration_link_text: string
  price_aud: string
  price_type: string
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
    market_comparison_aud: l.market_comparison_aud ? (l.market_comparison_aud / 100).toFixed(0) : '',
    source: l.source,
    status: l.status,
    au_status: l.au_status ?? '',
    location_status: l.location_status ?? '',
    fit_out_level: l.fit_out_level ?? '',
    vehicle_model: l.vehicle_model ?? '',
    conversion_video_url: l.conversion_video_url ?? '',
    spin_video: l.spin_video ?? '',
    featured: l.featured,
    has_nav: l.has_nav,
    has_leather: l.has_leather,
    has_sunroof: l.has_sunroof,
    has_alloys: l.has_alloys,
    has_fitout: l.has_fitout ?? false,
    fitout_grade: l.fitout_grade ?? '',
    power_system: l.power_system ?? '',
    image_focal_point: l.image_focal_point ?? '50% 50%',
    photos: [...(l.photos ?? [])],
    internal_photos: [...(l.internal_photos ?? [])],
    show_interior_gallery: l.show_interior_gallery ?? false,
    contact_phone: l.contact_phone ?? '',
    condition_notes: l.condition_notes ?? '',
    engine: (l as any).engine ?? '',
    chassis_code: l.chassis_code ?? '',
    inspection_score: l.inspection_score ?? '',
    kaijo_code: (l as any).kaijo_code ?? '',
    auction_date: l.auction_date ?? '',
    bid_no: (l as any).bid_no ?? '',
    auction_count: (l as any).auction_count ?? '',
    has_power_steering: (l as any).has_power_steering ?? false,
    has_power_windows: (l as any).has_power_windows ?? false,
    has_rear_ac: (l as any).has_rear_ac ?? false,
    auction_time: (l as any).auction_time ? new Date((l as any).auction_time).toISOString().slice(0, 16) : '',
    auction_result: (l as any).auction_result ?? 'pending',
    sold_price_jpy: (l as any).sold_price_jpy?.toString() ?? '',
    top_bid_jpy: (l as any).top_bid_jpy?.toString() ?? '',
    curation_badge: l.curation_badge ?? '',
    pipeline_stage: l.pipeline_stage ?? '',
    pipeline_eta: l.pipeline_eta ? l.pipeline_eta.slice(0, 10) : '',
    au_market_price_low: l.au_market_price_low?.toString() ?? '',
    au_market_price_high: l.au_market_price_high?.toString() ?? '',
    au_market_source: l.au_market_source ?? '',
    au_market_note: l.au_market_note ?? '',
    notes: (l.notes ?? []).map(n => ({
      id: n.id, author: n.author, date: n.date,
      sentiment: n.sentiment, type: n.type, content: n.content,
    })),
    inspiration_title: l.inspiration?.title ?? '',
    inspiration_description: l.inspiration?.description ?? '',
    inspiration_link: l.inspiration?.link ?? '',
    inspiration_link_text: l.inspiration?.link_text ?? '',
    price_aud: l.price_aud ? (l.price_aud / 100).toFixed(0) : '',
    price_type: l.price_type ?? '',
  }
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white'

// ---- Notify Interested Customers Button ----
function NotifyButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<{ id: string; email: string; name: string | null; source: string }[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const findMatches = async () => {
    setOpen(true)
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/listings/${listingId}/notify`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMatches(data.matches ?? [])
      setSelected(new Set((data.matches ?? []).map((m: { email: string }) => m.email)))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const sendNotifications = async () => {
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/listings/${listingId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSent(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setSending(false)
    }
  }

  const toggleEmail = (email: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(email) ? next.delete(email) : next.add(email)
      return next
    })
  }

  return (
    <>
      <button
        onClick={findMatches}
        className="text-sm px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
      >
        📣 Notify Customers
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-charcoal">Notify Interested Customers</h3>
              <p className="text-sm text-gray-500 mt-1">Send an email alert about this van to customers who might be interested.</p>
            </div>

            <div className="p-5">
              {loading && <p className="text-sm text-gray-500">Finding matching customers...</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {sent && (
                <div className="text-center py-4">
                  <p className="text-green-700 font-semibold">✅ Notifications sent to {selected.size} customer{selected.size !== 1 ? 's' : ''}!</p>
                </div>
              )}

              {!loading && !sent && matches.length === 0 && (
                <p className="text-sm text-gray-500 py-4">No matching customers found. As customers save vans and submit scout requests, matches will appear here.</p>
              )}

              {!loading && !sent && matches.length > 0 && (
                <>
                  <p className="text-sm text-gray-600 mb-3">{matches.length} customer{matches.length !== 1 ? 's' : ''} matched:</p>
                  <div className="space-y-2 mb-4">
                    {matches.map(m => (
                      <label key={m.email} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected.has(m.email)}
                          onChange={() => toggleEmail(m.email)}
                          className="w-4 h-4 rounded accent-ocean"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-charcoal truncate">{m.name || m.email}</p>
                          {m.name && <p className="text-xs text-gray-400 truncate">{m.email}</p>}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {m.source === 'saved_van' ? '❤️ Saved similar' : '🔍 Scout request'}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => { setOpen(false); setSent(false) }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                {sent ? 'Close' : 'Cancel'}
              </button>
              {!sent && matches.length > 0 && (
                <button
                  onClick={sendNotifications}
                  disabled={sending || selected.size === 0}
                  className="px-5 py-2 bg-ocean text-white text-sm font-semibold rounded-lg hover:bg-ocean/90 disabled:opacity-50"
                >
                  {sending ? 'Sending…' : `Send to ${selected.size} customer${selected.size !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ---- Notify Stock Alert Subscribers Button ----
function NotifyStockAlertsButton({ listingId }: { listingId: string }) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const send = async () => {
    if (!confirm('Send stock alert emails to all matching subscribers?')) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/notify-stock-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(`Sent to ${data.total} subscriber${data.total !== 1 ? 's' : ''}`)
    } catch (e) {
      setResult(`Error: ${e}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={send}
        disabled={sending}
        className="text-sm px-3 py-1.5 rounded-lg border border-ocean/30 text-ocean hover:bg-ocean/5 disabled:opacity-50"
      >
        {sending ? 'Sending…' : '🔔 Notify Subscribers'}
      </button>
      {result && (
        <span className="ml-2 text-xs text-gray-500">{result}</span>
      )}
    </div>
  )
}

// ---- Send to Nao (Buyer Agent) Button ----
function SendToNaoButton({ listingId, modelName }: { listingId: string; modelName: string }) {
  const [open, setOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/admin/send-to-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          customer_name: customerName || undefined,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setSent(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setSent(false)
    setError('')
    setCustomerName('')
    setNotes('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 font-medium"
      >
        Send to Nao
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-charcoal">Send to Nao</h3>
              <p className="text-sm text-gray-500 mt-1">
                Email purchase request for <strong>{modelName}</strong> to Naoyuki Takahashi.
              </p>
            </div>

            <div className="p-5 space-y-4">
              {sent ? (
                <div className="text-center py-4">
                  <p className="text-green-700 font-semibold text-base">Purchase request sent!</p>
                  <p className="text-sm text-gray-500 mt-1">Nao will receive the email shortly.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Customer Name (optional)</label>
                    <input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Morgan Willaume"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Any special instructions or details..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white resize-none"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </>
              )}
            </div>

            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                {sent ? 'Close' : 'Cancel'}
              </button>
              {!sent && (
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send to Nao'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ---- Start Deal Button (New Deal System) ----
function StartDealButton({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<{ id: string; first_name: string; last_name: string | null; email: string | null }[]>([])
  const [buyers, setBuyers] = useState<{ id: string; name: string; email: string; company: string | null; is_active: boolean }[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedBuyerId, setSelectedBuyerId] = useState('')
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    deal: { id: string }
    customerWhatsAppUrl?: string
    buyerWhatsAppUrl?: string
  } | null>(null)
  const [error, setError] = useState('')

  const handleOpen = async () => {
    setOpen(true)
    setResult(null)
    setError('')
    setCustomerSearch('')
    setSelectedCustomerId('')
    setSelectedBuyerId('')
    setNotes('')
    setLoadingData(true)
    try {
      const [custRes, buyerRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/admin/buyers'),
      ])
      const custData = await custRes.json()
      const buyerData = await buyerRes.json()
      if (Array.isArray(custData)) setCustomers(custData)
      if (Array.isArray(buyerData)) {
        setBuyers(buyerData)
        // Pre-select first active buyer
        const firstActive = buyerData.find((b: any) => b.is_active)
        if (firstActive) setSelectedBuyerId(firstActive.id)
      }
    } catch (e) {
      setError('Failed to load data: ' + String(e))
    } finally {
      setLoadingData(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setResult(null)
    setError('')
  }

  const filteredCustomers = customers.filter(c => {
    if (!customerSearch.trim()) return true
    const search = customerSearch.toLowerCase()
    const name = `${c.first_name} ${c.last_name ?? ''}`.toLowerCase()
    return name.includes(search) || c.email?.toLowerCase().includes(search)
  })

  const handleSubmit = async () => {
    if (!selectedCustomerId) { setError('Please select a customer'); return }
    if (!selectedBuyerId) { setError('Please select a buyer'); return }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/admin/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          customer_id: selectedCustomerId,
          buyer_id: selectedBuyerId,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create deal')
      setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setSending(false)
    }
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-sm px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold"
      >
        Start Deal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <span className="text-xl">🤝</span> Start Deal
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {listing.model_year ?? ''} {listing.model_name}{listing.grade ? ` — ${listing.grade}` : ''}
              </p>
            </div>

            <div className="p-5 space-y-4">
              {loadingData ? (
                <p className="text-sm text-gray-500 py-4 text-center">Loading customers and buyers...</p>
              ) : result ? (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <p className="text-emerald-700 font-semibold text-base">Deal created!</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name ?? ''}`.trim() : 'Customer'} × {buyers.find(b => b.id === selectedBuyerId)?.name ?? 'Buyer'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {result.customerWhatsAppUrl && (
                      <a
                        href={result.customerWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 text-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        WhatsApp Customer
                      </a>
                    )}
                    {result.buyerWhatsAppUrl && (
                      <a
                        href={result.buyerWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 text-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        WhatsApp Buyer
                      </a>
                    )}
                    <a
                      href={`/admin/deals/${result.deal.id}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-ocean text-white font-semibold rounded-xl hover:bg-ocean/90 text-sm"
                    >
                      View Deal →
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  {/* Customer selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Customer *</label>
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white mb-2"
                    />
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredCustomers.length === 0 ? (
                        <p className="text-xs text-gray-400 p-3 text-center">No customers found</p>
                      ) : (
                        filteredCustomers.slice(0, 50).map(c => {
                          const name = `${c.first_name} ${c.last_name ?? ''}`.trim()
                          const isSelected = selectedCustomerId === c.id
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedCustomerId(c.id)}
                              className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 transition-colors ${
                                isSelected
                                  ? 'bg-ocean/10 text-ocean font-semibold'
                                  : 'hover:bg-gray-50 text-charcoal'
                              }`}
                            >
                              <span>{name}</span>
                              {c.email && <span className="text-xs text-gray-400 ml-2">{c.email}</span>}
                            </button>
                          )
                        })
                      )}
                    </div>
                    {selectedCustomer && (
                      <p className="text-xs text-ocean mt-1.5 font-medium">
                        Selected: {selectedCustomer.first_name} {selectedCustomer.last_name ?? ''}
                      </p>
                    )}
                  </div>

                  {/* Buyer selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Buyer *</label>
                    <select
                      value={selectedBuyerId}
                      onChange={e => setSelectedBuyerId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white"
                    >
                      <option value="">Select buyer...</option>
                      {buyers.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}{b.company ? ` (${b.company})` : ''}{!b.is_active ? ' [inactive]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Max bid, special requests, anything relevant..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white resize-none"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </>
              )}
            </div>

            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                {result ? 'Close' : 'Cancel'}
              </button>
              {!result && !loadingData && (
                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50"
                >
                  {sending ? 'Creating deal...' : 'Create Deal'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Try to upgrade a Goo-net / Car Sensor thumbnail URL to the largest available version
function CopyConfigLink({ listingId }: { listingId: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    const url = `${window.location.origin}/configurator?van=${listingId}`
    try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      title="Copy campaign link (pre-selects this van in the configurator)"
      className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 shrink-0 transition-colors"
    >
      {copied ? '✓ Copied' : '🔗 Campaign'}
    </button>
  )
}

function upgradeImageUrl(url: string): string {
  try {
    const u = new URL(url)
    // Replace w= / h= query params → request 800px wide
    if (u.searchParams.has('w') || u.searchParams.has('h')) {
      u.searchParams.set('w', '800')
      u.searchParams.delete('h')
      return u.toString()
    }
    // Car Sensor: convert tiny S-prefix thumbnails (80×60) to medium (640×480)
    // e.g. /SU00051137032_1_001.jpg → /U00051137032_1_001.jpg
    if (url.includes('carsensor') && /\/SU\d/.test(url)) {
      return url.replace(/\/SU(\d)/, '/U$1')
    }
    // Path-based size suffixes: _150x112.jpg → .jpg, /resize/w=150 → /resize/w=800
    return url
      .replace(/_\d+x\d+(\.(jpg|jpeg|png))/i, '$1')
      .replace(/(\/resize\/w=)\d+/i, '$1800')
  } catch {
    return url
  }
}

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
  isSelected: boolean
  isTranslating: boolean
  editState: EditState | null
  saving: boolean
  error: string | null
  newPhotoUrl: string
  onToggleSelect: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onDelete: () => void
  onRetranslate: () => void
  onSet: (field: keyof EditState, value: EditState[keyof EditState]) => void
  onSetNewPhotoUrl: (v: string) => void
  onAddPhoto: () => void
  onRemovePhoto: (i: number) => void
  onMovePhoto: (from: number, to: number) => void
  onClearPhotos: () => void
  onUploadPhoto: (url: string) => void
  onUploadingChange: (uploading: boolean) => void
  photoUploading: boolean
  newInteriorPhotoUrl: string
  onSetNewInteriorPhotoUrl: (v: string) => void
  onAddInteriorPhoto: () => void
  onRemoveInteriorPhoto: (i: number) => void
  onUploadInteriorPhoto: (url: string) => void
}

function ListingRow({
  listing: l, isEditing, isSaved, isSelected, isTranslating, editState, saving, error,
  newPhotoUrl, onToggleSelect, onStartEdit, onCancelEdit, onSave, onDelete, onRetranslate, onSet,
  onSetNewPhotoUrl, onAddPhoto, onRemovePhoto, onMovePhoto, onClearPhotos, onUploadPhoto, onUploadingChange, photoUploading,
  newInteriorPhotoUrl, onSetNewInteriorPhotoUrl, onAddInteriorPhoto, onRemoveInteriorPhoto, onUploadInteriorPhoto,
}: RowProps) {
  const { priceCents, priceType } = listingDisplayPrice(l)
  const price = priceCents
    ? `${priceType === 'estimate' ? '~' : ''}${centsToAud(priceCents)}`
    : 'POA'

  const dragFromRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${isEditing ? 'border-ocean shadow-md' : isSelected ? 'border-ocean' : 'border-gray-200'}`}>
      {/* Row summary */}
      <div className="px-4 py-3">

        {/* ── Desktop layout (md+) ── */}
        <div className="hidden md:flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 accent-ocean shrink-0"
          />
          {l.photos?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.photos[0]} alt="" className="w-16 h-11 object-cover rounded shrink-0" />
          )}
          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded text-white ${
            l.source === 'au_stock' ? 'bg-ocean' : l.source === 'auction' ? 'bg-amber-500' : 'bg-blue-600'
          }`}>
            {sourceLabel(l.source)}
          </span>
          <span className="flex-1 font-medium text-gray-800 truncate">
            {l.model_name}{l.grade ? ` — ${l.grade}` : ''}
          </span>
          {(l.raw_data as Record<string, string> | null)?.url && (
            <a href={(l.raw_data as Record<string, string>).url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline shrink-0" onClick={e => e.stopPropagation()}>
              Source ↗
            </a>
          )}
          <span className="text-gray-400 shrink-0 text-xs">{l.model_year ?? '—'}</span>
          <span className="text-gray-400 shrink-0 text-xs">{l.mileage_km?.toLocaleString() ?? '—'} km</span>
          <span className="text-ocean font-semibold shrink-0 text-xs">{price}</span>
          <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
            l.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>{l.status}</span>
          {isSaved && <span className="text-xs text-ocean font-semibold shrink-0">✓ Saved</span>}
          {!isEditing && (
            <CopyConfigLink listingId={l.id} />
          )}
          <button
            onClick={() => isEditing ? onCancelEdit() : onStartEdit()}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 ${
              isEditing ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-ocean text-ocean hover:bg-cream'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          {!isEditing && (
            <button onClick={onDelete} className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 shrink-0">
              ✕
            </button>
          )}
        </div>

        {/* ── Mobile layout (<md) ── */}
        <div className="md:hidden">
          {/* Top: checkbox + thumbnail + info */}
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-4 h-4 accent-ocean mt-1 shrink-0"
            />
            {l.photos?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photos[0]} alt="" className="w-[60px] h-[60px] object-cover rounded shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${
                  l.source === 'au_stock' ? 'bg-ocean' : l.source === 'auction' ? 'bg-amber-500' : 'bg-blue-600'
                }`}>
                  {sourceLabel(l.source)}
                </span>
                {(l.raw_data as Record<string, string> | null)?.url && (
                  <a href={(l.raw_data as Record<string, string>).url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                    Source ↗
                  </a>
                )}
              </div>
              <p className="font-medium text-gray-800 text-sm leading-snug">
                {l.model_name}{l.grade ? ` — ${l.grade}` : ''}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {[l.model_year, l.mileage_km ? `${l.mileage_km.toLocaleString()} km` : null].filter(Boolean).join(' · ')}
                {l.created_at && <span className="ml-2">· {new Date(l.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
              </p>
            </div>
          </div>

          {/* Bottom: price + status + buttons */}
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
            <span className="font-semibold text-ocean text-sm">{price}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              l.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>{l.status}</span>
            {isSaved && <span className="text-xs text-ocean font-semibold">✓ Saved</span>}
            <div className="ml-auto flex gap-2 shrink-0">
              <button
                onClick={() => isEditing ? onCancelEdit() : onStartEdit()}
                className={`min-h-[44px] px-4 text-sm font-semibold rounded-lg border ${
                  isEditing ? 'border-gray-300 text-gray-600' : 'border-ocean text-ocean'
                }`}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              {!isEditing && (
                <button onClick={onDelete} className="min-h-[44px] px-3 rounded-lg border border-red-200 text-red-500 text-sm">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Edit form */}
      {isEditing && editState && (
        <div className="border-t border-cream bg-gray-50 p-5 pb-24 md:pb-5">

          {/* Lead image — large preview with focal point picker */}
          {editState.photos[0] && (
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-1.5">
                Cover image — <span className="text-ocean font-medium">click to set focal point</span>
                <span className="text-gray-400 ml-1.5">({editState.image_focal_point || '50% 50%'})</span>
              </p>
              <div
                className="relative cursor-crosshair rounded-xl overflow-hidden border border-gray-200"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
                  onSet('image_focal_point', `${x}% ${y}%`)
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editState.photos[0]}
                  alt="Cover"
                  className="w-full max-h-72 object-contain bg-[#f5f5f5]"
                  style={{ objectPosition: editState.image_focal_point || '50% 50%' }}
                />
                {/* Focal point crosshair */}
                {editState.image_focal_point && (() => {
                  const [fx, fy] = editState.image_focal_point.split(' ')
                  return (
                    <div
                      className="absolute w-7 h-7 pointer-events-none"
                      style={{ left: fx, top: fy, transform: 'translate(-50%,-50%)' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-white" style={{ boxShadow: '0 0 3px rgba(0,0,0,0.8)' }} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-full w-0.5 bg-white" style={{ boxShadow: '0 0 3px rgba(0,0,0,0.8)' }} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white rounded-full" style={{ boxShadow: '0 0 3px rgba(0,0,0,0.8)' }} />
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Auction Sheet PDF */}
          {l.inspection_sheet && (
            <div className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
                <p className="text-xs font-semibold text-gray-600">Auction Sheet</p>
                <a href={l.inspection_sheet} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-ocean hover:underline">Open in new tab ↗</a>
              </div>
              <object
                data={l.inspection_sheet}
                type="application/pdf"
                className="w-full bg-gray-100"
                style={{ height: 500 }}
              >
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <p className="text-sm text-gray-500">PDF preview not available.</p>
                  <a href={l.inspection_sheet} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 bg-ocean text-white text-sm rounded-lg">View PDF</a>
                </div>
              </object>
            </div>
          )}

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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Chassis Code</label>
                  <input value={editState.chassis_code} onChange={e => onSet('chassis_code', e.target.value)} className={inputClass} placeholder="e.g. GDH211K" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Body Colour</label>
                  <input value={editState.body_colour} onChange={e => onSet('body_colour', e.target.value)} className={`${inputClass} mb-1.5`} placeholder="e.g. Pearl White" />
                  <div className="flex flex-wrap gap-1">
                    {['White', 'Silver', 'Black', 'Pearl', 'Khaki', 'Grey', 'Blue'].map(c => (
                      <button key={c} type="button" onClick={() => onSet('body_colour', c)}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${editState.body_colour === c ? 'bg-ocean text-white border-ocean' : 'bg-white text-gray-600 border-gray-300 hover:border-ocean'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
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
                    <option value="">Unknown</option>
                    <option value="IA">Automatic (IA)</option>
                    <option value="AT">Automatic (AT)</option>
                    <option value="MT">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Drive</label>
                  <select value={editState.drive} onChange={e => onSet('drive', e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    <option value="2WD">2WD</option>
                    <option value="4WD">4WD</option>
                    <option value="AWD">AWD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Inspection Score</label>
                  <select value={editState.inspection_score} onChange={e => onSet('inspection_score', e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    {['S','6','5.5','5','4.5','4','3.5','3','R','RA','X'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Engine Type</label>
                  <select value={editState.engine} onChange={e => onSet('engine', e.target.value)} className={inputClass}>
                    <option value="">Unknown</option>
                    <option value="diesel">Diesel 2.8L</option>
                    <option value="petrol">Petrol 2.7L</option>
                    <option value="petrol_20">Petrol 2.0L</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Displacement (cc)</label>
                  <input type="number" value={editState.displacement_cc} onChange={e => onSet('displacement_cc', e.target.value)} className={inputClass} placeholder="2800" />
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
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location Status</label>
                  <select value={editState.location_status} onChange={e => onSet('location_status', e.target.value)} className={inputClass}>
                    <option value="">— auto-detect —</option>
                    <option value="in_japan">In Japan (Awaiting Purchase/Export)</option>
                    <option value="on_ship">On Ship (Arriving Soon)</option>
                    <option value="in_brisbane">In Brisbane (Available Now)</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fit-Out Level</label>
                  <select value={editState.fit_out_level} onChange={e => onSet('fit_out_level', e.target.value)} className={inputClass}>
                    <option value="">— select —</option>
                    <option value="empty">Empty Van</option>
                    <option value="partial">Head Start (Partial Mods)</option>
                    <option value="full">Full Campervan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vehicle Model</label>
                  <select value={editState.vehicle_model} onChange={e => onSet('vehicle_model', e.target.value)} className={inputClass}>
                    <option value="">— select —</option>
                    <option value="hiace_h200">Hiace H200 (2005–2019)</option>
                    <option value="hiace_300">Hiace 300 Series (2019+)</option>
                    <option value="coaster">Toyota Coaster</option>
                    <option value="other">Other</option>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contact Phone</label>
                  <input
                    value={editState.contact_phone}
                    onChange={e => onSet('contact_phone', e.target.value)}
                    className={inputClass}
                    placeholder="0432 182 892"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Shown to logged-out users instead of images</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Condition Notes</label>
                  <input
                    value={editState.condition_notes}
                    onChange={e => onSet('condition_notes', e.target.value)}
                    className={inputClass}
                    placeholder="From auction sheet..."
                  />
                </div>
              </div>
              {editState.source === 'customer_upload' && (
                <div className="rounded-lg border border-driftwood/30 bg-driftwood/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-driftwood uppercase tracking-wide">Community Find — Private Fields</p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Source Category</label>
                    <input
                      value={l.source_category ?? ''}
                      readOnly
                      className={`${inputClass} bg-gray-50 text-gray-500`}
                      placeholder="No category set"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Source URL</label>
                    <div className="flex gap-2">
                      <input
                        value={l.source_url ?? ''}
                        readOnly
                        className={`${inputClass} bg-gray-50 text-gray-500 flex-1`}
                        placeholder="No URL provided"
                      />
                      {l.source_url && (
                        <a
                          href={l.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-ocean text-white text-xs rounded-lg hover:bg-ocean/90 shrink-0"
                        >
                          Open ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {editState.source === 'auction' && (<>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Auction Site</label>
                    <input value={editState.kaijo_code} onChange={e => onSet('kaijo_code', e.target.value)} className={inputClass} placeholder="e.g. Tokyo" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Auction Date</label>
                    <input type="date" value={editState.auction_date} onChange={e => onSet('auction_date', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bid Number</label>
                    <input value={editState.bid_no} onChange={e => onSet('bid_no', e.target.value)} className={inputClass} placeholder="e.g. 402" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Auction Session</label>
                    <input value={editState.auction_count} onChange={e => onSet('auction_count', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Auction Date & Time (JST)</label>
                  <input type="datetime-local" value={editState.auction_time} onChange={e => onSet('auction_time', e.target.value)} className={inputClass} />
                  <p className="text-[10px] text-gray-400 mt-0.5">Japan Standard Time (JST)</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Auction Result</label>
                  <select value={editState.auction_result} onChange={e => onSet('auction_result', e.target.value)} className={inputClass}>
                    <option value="pending">Pending — not yet auctioned</option>
                    <option value="sold">Sold — van was purchased</option>
                    <option value="unsold">Unsold — did not reach reserve</option>
                    <option value="no_sale">No sale — auction cancelled</option>
                  </select>
                </div>
                {editState.auction_result === 'sold' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sold Price JPY</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-400">¥</span>
                      <input type="number" value={editState.sold_price_jpy} onChange={e => onSet('sold_price_jpy', e.target.value)} className={`${inputClass} pl-6`} placeholder="2,900,000" />
                    </div>
                  </div>
                )}
                {editState.auction_result === 'unsold' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Highest Bid JPY</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-400">¥</span>
                      <input type="number" value={editState.top_bid_jpy} onChange={e => onSet('top_bid_jpy', e.target.value)} className={`${inputClass} pl-6`} placeholder="2,500,000" />
                    </div>
                  </div>
                )}
              </>)}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Conversion Video URL</label>
                <input
                  value={editState.conversion_video_url}
                  onChange={e => onSet('conversion_video_url', e.target.value)}
                  className={inputClass}
                  placeholder="YouTube or Vimeo URL"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">360 Spin Video</label>
                {editState.spin_video ? (
                  <div className="flex items-center gap-2">
                    <video src={editState.spin_video} className="h-16 rounded" muted loop playsInline autoPlay />
                    <button type="button" onClick={() => onSet('spin_video', '')} className="text-red-500 text-xs hover:underline">Remove</button>
                  </div>
                ) : (
                  <PhotoUploadButton
                    label="🎬 Upload Spin Video"
                    accept="video/mp4,video/quicktime,video/webm"
                    multiple={false}
                    onUploaded={url => onSet('spin_video', url)}
                    onUploadingChange={onUploadingChange}
                  />
                )}
              </div>
            </div>

            {/* Right — pricing + flags */}
            <div className="space-y-3">
              {/* ── Customer-facing price (primary) ── */}
              {!editState.price_aud && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-800 font-semibold">No AUD price set — will show as POA or use legacy fallback</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Display Price (AUD)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                    <input type="number" value={editState.price_aud} onChange={e => onSet('price_aud', e.target.value)} className={`${inputClass} pl-6`} placeholder="e.g. 38500" />
                  </div>
                  <select
                    value={editState.price_type}
                    onChange={e => onSet('price_type', e.target.value)}
                    className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white"
                  >
                    <option value="">— type —</option>
                    <option value="fixed">Fixed</option>
                    <option value="estimate">Estimate</option>
                    <option value="poa">POA</option>
                  </select>
                </div>
                {editState.start_price_jpy && !editState.price_aud && (
                  <button
                    type="button"
                    className="mt-1.5 text-xs text-ocean hover:underline font-medium"
                    onClick={() => {
                      const jpyPrice = parseInt(editState.start_price_jpy)
                      if (!jpyPrice || jpyPrice <= 0) return
                      const cents = estimateLandedAud(jpyPrice)
                      onSet('price_aud', (cents / 100).toFixed(0))
                      onSet('price_type', 'estimate')
                    }}
                  >
                    Calculate from ¥{parseInt(editState.start_price_jpy).toLocaleString()} → est. ${Math.round(estimateLandedAud(parseInt(editState.start_price_jpy)) / 100).toLocaleString()} AUD
                  </button>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">This is the price customers see. Set type to &ldquo;Estimate&rdquo; for Japan-sourced vans.</p>
              </div>

              <hr className="border-gray-200" />

              {/* ── Legacy / source pricing ── */}
              <details className="group">
                <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700">Legacy price fields</summary>
                <div className="mt-2 space-y-3">
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
                </div>
              </details>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Market Comparison ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                  <input type="number" value={editState.market_comparison_aud} onChange={e => onSet('market_comparison_aud', e.target.value)} className={`${inputClass} pl-6`} placeholder="Comparable local price" />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">If set, shows &ldquo;$X below market&rdquo; on listing page</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Japan Price (¥)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-400">¥</span>
                  <input type="number" value={editState.start_price_jpy} onChange={e => onSet('start_price_jpy', e.target.value)} className={`${inputClass} pl-6`} />
                </div>
                {editState.start_price_jpy && (
                  <p className="text-xs text-gray-400 mt-1">
                    ¥{parseInt(editState.start_price_jpy).toLocaleString()} × 0.0095 = ~${Math.round(parseInt(editState.start_price_jpy) * 0.0095).toLocaleString()} AUD
                  </p>
                )}
              </div>
              {/* AU Market Price Comparison */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-600">AU Market Price</label>
                  <button
                    type="button"
                    className="text-xs text-ocean hover:underline font-medium"
                    onClick={() => {
                      const year = editState.model_year ? parseInt(editState.model_year) : null
                      const km = editState.mileage_km ? parseInt(editState.mileage_km) : null
                      const drive = editState.drive || null
                      if (!year || km == null) return
                      const result = getAuMarketPrice(year, drive, km)
                      if (result) {
                        onSet('au_market_price_low', result.au_market_price_low.toString())
                        onSet('au_market_price_high', result.au_market_price_high.toString())
                        onSet('au_market_source', result.au_market_source)
                        onSet('au_market_note', result.au_market_note)
                      }
                    }}
                  >
                    Auto-fill from market data
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Low ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                      <input type="number" value={editState.au_market_price_low} onChange={e => onSet('au_market_price_low', e.target.value)} className={`${inputClass} pl-6`} placeholder="35000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">High ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                      <input type="number" value={editState.au_market_price_high} onChange={e => onSet('au_market_price_high', e.target.value)} className={`${inputClass} pl-6`} placeholder="48000" />
                    </div>
                  </div>
                </div>
                <div className="mt-1.5">
                  <input value={editState.au_market_source} onChange={e => onSet('au_market_source', e.target.value)} className={`${inputClass} text-xs`} placeholder="Source" />
                </div>
                <div className="mt-1.5">
                  <input value={editState.au_market_note} onChange={e => onSet('au_market_note', e.target.value)} className={`${inputClass} text-xs`} placeholder="Note" />
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
                  ['has_fitout',  '🏕 Has Campervan Fit-Out'],
                  ['has_power_steering', 'Power steering'],
                  ['has_power_windows', 'Power windows'],
                  ['has_rear_ac', 'Rear A/C'],
                ] as [keyof EditState, string][]).map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editState[field] as boolean}
                      onChange={e => onSet(field, e.target.checked)}
                      className="w-4 h-4 accent-ocean"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              {/* Fitout & power fields */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fitout Condition</label>
                <select value={editState.fitout_grade} onChange={e => onSet('fitout_grade', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Power System</label>
                <select value={editState.power_system} onChange={e => onSet('power_system', e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  <option value="None">None</option>
                  <option value="100V Japanese">100V Japanese</option>
                  <option value="240V Australian">240V Australian</option>
                </select>
              </div>
            </div>
          </div>

          {/* Curation & Pipeline */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-3">Curation &amp; Pipeline</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Curation Badge</label>
                <select value={editState.curation_badge} onChange={e => onSet('curation_badge', e.target.value)} className={inputClass}>
                  <option value="">— none —</option>
                  <option value="hot_this_week">🔥 Hot This Week</option>
                  <option value="staff_pick">⭐ Staff Pick</option>
                  <option value="rare_find">🔍 Rare Find</option>
                  <option value="low_km">🏆 Low KM</option>
                  <option value="budget_entry">💰 Budget Entry</option>
                  <option value="adventure_spec">🏕 Adventure Spec</option>
                  <option value="arriving_soon">🚢 Arriving Soon</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pipeline Stage</label>
                <select value={editState.pipeline_stage} onChange={e => onSet('pipeline_stage', e.target.value)} className={inputClass}>
                  <option value="">— none —</option>
                  <option value="listed">Listed</option>
                  <option value="sourced">Sourced</option>
                  <option value="purchased">Purchased</option>
                  <option value="shipping">Shipping</option>
                  <option value="customs">Customs</option>
                  <option value="compliance">Compliance</option>
                  <option value="ready">Ready</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pipeline ETA</label>
                <input type="date" value={editState.pipeline_eta} onChange={e => onSet('pipeline_eta', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Market Context */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-3">AU Market Context</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Market Low ($)</label>
                <input type="number" value={editState.au_market_price_low} onChange={e => onSet('au_market_price_low', e.target.value)} className={inputClass} placeholder="e.g. 35000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Market High ($)</label>
                <input type="number" value={editState.au_market_price_high} onChange={e => onSet('au_market_price_high', e.target.value)} className={inputClass} placeholder="e.g. 55000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Source</label>
                <input value={editState.au_market_source} onChange={e => onSet('au_market_source', e.target.value)} className={inputClass} placeholder="e.g. Carsales, Facebook" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Market Note</label>
                <input value={editState.au_market_note} onChange={e => onSet('au_market_note', e.target.value)} className={inputClass} placeholder="Short context..." />
              </div>
            </div>
          </div>

          {/* Buyer Agent Notes */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-600">Buyer Agent Notes</label>
              <button
                type="button"
                className="text-xs text-ocean hover:underline font-medium"
                onClick={() => {
                  const next = [...editState.notes, {
                    id: String(Date.now()),
                    author: 'Jared',
                    date: new Date().toISOString().slice(0, 10),
                    sentiment: 'positive',
                    type: 'agent_comment',
                    content: '',
                  }]
                  onSet('notes', next)
                }}
              >
                + Add note
              </button>
            </div>
            {editState.notes.length === 0 && (
              <p className="text-xs text-gray-400 italic">No notes yet. Click &ldquo;+ Add note&rdquo; to add one.</p>
            )}
            <div className="space-y-3">
              {editState.notes.map((note, idx) => (
                <div key={note.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex gap-2 mb-2">
                    <input
                      value={note.author}
                      onChange={e => {
                        const next = [...editState.notes]
                        next[idx] = { ...next[idx], author: e.target.value }
                        onSet('notes', next)
                      }}
                      className={`${inputClass} flex-1`}
                      placeholder="Author name"
                    />
                    <select
                      value={note.sentiment}
                      onChange={e => {
                        const next = [...editState.notes]
                        next[idx] = { ...next[idx], sentiment: e.target.value }
                        onSet('notes', next)
                      }}
                      className="px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="caution">Caution</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const next = editState.notes.filter((_, j) => j !== idx)
                        onSet('notes', next)
                      }}
                      className="text-red-400 hover:text-red-600 text-sm px-1"
                      title="Remove note"
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    value={note.content}
                    onChange={e => {
                      const next = [...editState.notes]
                      next[idx] = { ...next[idx], content: e.target.value }
                      onSet('notes', next)
                    }}
                    className={`${inputClass} text-sm`}
                    rows={2}
                    placeholder="Write your note here..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Inspiration Block */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-2">Inspiration Block</label>
            <div className="space-y-2">
              <input
                value={editState.inspiration_title}
                onChange={e => onSet('inspiration_title', e.target.value)}
                className={inputClass}
                placeholder="Title — e.g. What this van could become"
              />
              <textarea
                value={editState.inspiration_description}
                onChange={e => onSet('inspiration_description', e.target.value)}
                className={`${inputClass} text-sm`}
                rows={2}
                placeholder="Description — e.g. This Hiace is the perfect base for a weekend adventurer build..."
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={editState.inspiration_link}
                  onChange={e => onSet('inspiration_link', e.target.value)}
                  className={inputClass}
                  placeholder="Link URL (optional)"
                />
                <input
                  value={editState.inspiration_link_text}
                  onChange={e => onSet('inspiration_link_text', e.target.value)}
                  className={inputClass}
                  placeholder="Link text — e.g. See the build"
                />
              </div>
              {!editState.inspiration_title && (
                <p className="text-[10px] text-gray-400">Leave title empty to hide this block on the listing page.</p>
              )}
            </div>
          </div>

          {/* Photos */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-600">
                Photos <span className="text-gray-400 font-normal">({editState.photos.length} — first is cover)</span>
              </label>
              {editState.photos.length > 0 && (
                <button
                  onClick={onClearPhotos}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {editState.photos.map((url, i) => (
                <div
                  key={url}
                  draggable
                  onDragStart={() => { dragFromRef.current = i }}
                  onDragOver={e => { e.preventDefault(); setDragOverIndex(i) }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={e => {
                    e.preventDefault()
                    if (dragFromRef.current !== null && dragFromRef.current !== i) {
                      onMovePhoto(dragFromRef.current, i)
                    }
                    dragFromRef.current = null
                    setDragOverIndex(null)
                  }}
                  onDragEnd={() => { dragFromRef.current = null; setDragOverIndex(null) }}
                  className={`relative group cursor-grab active:cursor-grabbing transition-all ${dragOverIndex === i ? 'ring-2 ring-ocean ring-offset-1 scale-105' : ''}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200 pointer-events-none" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    <button onClick={() => onRemovePhoto(i)} className="text-white text-xs bg-red-600/80 rounded px-1.5 py-0.5">✕</button>
                  </div>
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-ocean text-white text-[10px] font-bold px-1 rounded">COVER</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newPhotoUrl}
                onChange={e => onSetNewPhotoUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onAddPhoto()}
                placeholder="Paste image URL (auto-upgraded to full res)"
                className={`${inputClass} flex-1`}
              />
              <button onClick={onAddPhoto} className="px-4 py-2 bg-ocean text-white text-sm rounded-lg hover:bg-ocean shrink-0">
                Add URL
              </button>
              <PhotoUploadButton onUploaded={onUploadPhoto} onUploadingChange={onUploadingChange} />
            </div>
          </div>

          {/* Interior / Campervan Photos */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-600">
                Interior / Campervan Photos <span className="text-gray-400 font-normal">({editState.internal_photos.length})</span>
              </label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none mb-3">
              <input
                type="checkbox"
                checked={editState.show_interior_gallery}
                onChange={e => onSet('show_interior_gallery', e.target.checked)}
                className="w-4 h-4 accent-ocean"
              />
              <span className="text-sm text-gray-700">Show interior gallery on listing page</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {editState.internal_photos.map((url, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button onClick={() => onRemoveInteriorPhoto(i)} className="text-white text-xs bg-red-600/80 rounded px-1.5 py-0.5">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newInteriorPhotoUrl}
                onChange={e => onSetNewInteriorPhotoUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onAddInteriorPhoto()}
                placeholder="Paste interior photo URL"
                className={`${inputClass} flex-1`}
              />
              <button onClick={onAddInteriorPhoto} className="px-4 py-2 bg-ocean text-white text-sm rounded-lg hover:bg-ocean shrink-0">
                Add URL
              </button>
              <PhotoUploadButton onUploaded={onUploadInteriorPhoto} />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
          )}

          {/* Desktop buttons */}
          <div className="hidden md:flex gap-3">
            <button onClick={onSave} disabled={saving || photoUploading} className="btn-primary btn-sm disabled:opacity-50">
              {saving ? 'Saving…' : photoUploading ? '⏳ Photos uploading…' : 'Save Changes'}
            </button>
            <button onClick={onCancelEdit} className="btn-secondary btn-sm">Cancel</button>
            <button
              onClick={onRetranslate}
              disabled={isTranslating}
              className="text-sm px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 ml-auto"
            >
              {isTranslating ? 'Translating…' : '🌐 Re-translate with AI'}
            </button>
            <NotifyButton listingId={l.id} />
            <NotifyStockAlertsButton listingId={l.id} />
            <SendToNaoButton listingId={l.id} modelName={l.model_name || 'Unknown Van'} />
            <StartDealButton listing={l} />
          </div>
        </div>
      )}

      {/* Sticky mobile save bar — fixed at viewport bottom when editing */}
      {isEditing && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          {error && (
            <p className="text-red-600 text-sm mb-2 font-medium">{error}</p>
          )}
          {isSaved && (
            <p className="text-green-600 text-sm mb-2 font-semibold">✓ Saved!</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving || photoUploading}
              className="flex-1 py-3 bg-green-800 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  Saving…
                </>
              ) : photoUploading ? '⏳ Photos uploading…' : 'Save Changes'}
            </button>
            <button
              onClick={onCancelEdit}
              className="px-5 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl text-base"
            >
              Cancel
            </button>
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
  const [newInteriorPhotoUrl, setNewInteriorPhotoUrl] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const [translatingId, setTranslatingId] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  const allSelected = listings.length > 0 && listings.every(l => selected.has(l.id))
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(listings.map(l => l.id)))
  const toggleOne = (id: string) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const bulkGoLive = async () => {
    if (!confirm(`Make ${selected.size} listing${selected.size !== 1 ? 's' : ''} live?`)) return
    setBulkWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'available' }),
      })
    ))
    setListings(ls => ls.map(l => selected.has(l.id) ? { ...l, status: 'available' } : l))
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

  const set = (field: keyof EditState, value: EditState[keyof EditState]) =>
    setEditState(s => s ? { ...s, [field]: value } : s)

  const addPhoto = () => {
    const raw = newPhotoUrl.trim()
    if (!raw || !editState) return
    const url = upgradeImageUrl(raw)
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

  const clearPhotos = () => {
    if (!editState) return
    if (!confirm('Remove all photos from this listing?')) return
    set('photos', [])
  }

  const uploadPhoto = (url: string) => {
    setEditState(s => s ? { ...s, photos: [...s.photos, url] } : s)
  }

  const addInteriorPhoto = () => {
    const raw = newInteriorPhotoUrl.trim()
    if (!raw || !editState) return
    set('internal_photos', [...editState.internal_photos, upgradeImageUrl(raw)])
    setNewInteriorPhotoUrl('')
  }

  const removeInteriorPhoto = (index: number) => {
    if (!editState) return
    set('internal_photos', editState.internal_photos.filter((_, i) => i !== index))
  }

  const uploadInteriorPhoto = (url: string) => {
    setEditState(s => s ? { ...s, internal_photos: [...s.internal_photos, url] } : s)
  }

  const handleRetranslate = async (id: string) => {
    setTranslatingId(id)
    try {
      const res = await fetch(`/api/listings/${id}/translate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Translation failed')
      setListings(ls => ls.map(l => l.id === id ? { ...l, ...data.listing } : l))
      if (editingId === id) setEditState(toEditState(data.listing))
    } catch (e) {
      alert(String(e))
    } finally {
      setTranslatingId(null)
    }
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
        market_comparison_aud: editState.market_comparison_aud ? Math.round(parseFloat(editState.market_comparison_aud) * 100) : null,
        source: editState.source,
        status: editState.status,
        au_status: editState.au_status || null,
        location_status: editState.location_status || null,
        fit_out_level: editState.fit_out_level || null,
        vehicle_model: editState.vehicle_model || null,
        conversion_video_url: editState.conversion_video_url || null,
        spin_video: editState.spin_video || null,
        featured: editState.featured,
        has_nav: editState.has_nav,
        has_leather: editState.has_leather,
        has_sunroof: editState.has_sunroof,
        has_alloys: editState.has_alloys,
        has_fitout: editState.has_fitout,
        fitout_grade: editState.fitout_grade || null,
        power_system: editState.power_system || null,
        image_focal_point: editState.image_focal_point || null,
        photos: editState.photos,
        internal_photos: editState.internal_photos,
        show_interior_gallery: editState.show_interior_gallery,
        contact_phone: editState.contact_phone || null,
        condition_notes: editState.condition_notes || null,
        engine: editState.engine || null,
        chassis_code: editState.chassis_code || null,
        inspection_score: editState.inspection_score || null,
        kaijo_code: editState.kaijo_code || null,
        auction_date: editState.auction_date || null,
        bid_no: editState.bid_no || null,
        auction_count: editState.auction_count || null,
        has_power_steering: editState.has_power_steering,
        has_power_windows: editState.has_power_windows,
        has_rear_ac: editState.has_rear_ac,
        auction_time: editState.auction_time ? new Date(editState.auction_time + ':00+09:00').toISOString() : null,
        auction_result: editState.auction_result || null,
        sold_price_jpy: editState.sold_price_jpy ? parseInt(editState.sold_price_jpy) : null,
        top_bid_jpy: editState.top_bid_jpy ? parseInt(editState.top_bid_jpy) : null,
        curation_badge: editState.curation_badge || null,
        pipeline_stage: editState.pipeline_stage || null,
        pipeline_eta: editState.pipeline_eta || null,
        au_market_price_low: editState.au_market_price_low ? parseInt(editState.au_market_price_low) : null,
        au_market_price_high: editState.au_market_price_high ? parseInt(editState.au_market_price_high) : null,
        au_market_source: editState.au_market_source || null,
        au_market_note: editState.au_market_note || null,
        notes: editState.notes.length > 0 ? editState.notes : null,
        inspiration: editState.inspiration_title.trim() ? {
          title: editState.inspiration_title.trim(),
          description: editState.inspiration_description.trim(),
          images: [],
          link: editState.inspiration_link.trim() || undefined,
          link_text: editState.inspiration_link_text.trim() || undefined,
        } : null,
        price_aud: editState.price_aud ? Math.round(parseFloat(editState.price_aud) * 100) : null,
        price_type: editState.price_type || null,
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
    if (res.ok) {
      setListings(ls => ls.filter(l => l.id !== id))
      setSelected(s => { const n = new Set(s); n.delete(id); return n })
    }
  }

  const auStock = listings.filter(l => l.source === 'au_stock')
  const auction = listings.filter(l => l.source === 'auction')
  const dealer  = listings.filter(l => l.source.startsWith('dealer'))
  const other   = listings.filter(l =>
    l.source !== 'au_stock' &&
    l.source !== 'auction' &&
    !l.source.startsWith('dealer')
  )

  const renderGroup = (title: string, items: Listing[]) => {
    if (items.length === 0) return null
    return (
      <section className="mb-8">
        <h2 className="text-xl text-charcoal mb-3">{title} ({items.length})</h2>
        <div className="space-y-2">
          {items.map(l => (
            <ListingRow
              key={l.id}
              listing={l}
              isEditing={editingId === l.id}
              isSaved={savedId === l.id}
              isSelected={selected.has(l.id)}
              isTranslating={translatingId === l.id}
              editState={editingId === l.id ? editState : null}
              saving={saving}
              error={editingId === l.id ? error : null}
              newPhotoUrl={newPhotoUrl}
              onToggleSelect={() => toggleOne(l.id)}
              onStartEdit={() => startEdit(l)}
              onCancelEdit={cancelEdit}
              onSave={() => handleSave(l.id)}
              onDelete={() => handleDelete(l.id)}
              onRetranslate={() => handleRetranslate(l.id)}
              onSet={set}
              onSetNewPhotoUrl={setNewPhotoUrl}
              onAddPhoto={addPhoto}
              onRemovePhoto={removePhoto}
              onMovePhoto={movePhoto}
              onClearPhotos={clearPhotos}
              onUploadPhoto={uploadPhoto}
              onUploadingChange={setPhotoUploading}
              photoUploading={photoUploading}
              newInteriorPhotoUrl={newInteriorPhotoUrl}
              onSetNewInteriorPhotoUrl={setNewInteriorPhotoUrl}
              onAddInteriorPhoto={addInteriorPhoto}
              onRemoveInteriorPhoto={removeInteriorPhoto}
              onUploadInteriorPhoto={uploadInteriorPhoto}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div>
      {/* Bulk toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6">
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
            <div className="hidden sm:block h-4 w-px bg-gray-200" />
            <button
              onClick={bulkGoLive}
              disabled={bulkWorking}
              className="text-sm font-semibold px-4 py-2.5 min-h-[44px] rounded-lg bg-ocean text-white hover:bg-ocean disabled:opacity-50"
            >
              {bulkWorking ? 'Working…' : `✓ Go Live (${selected.size})`}
            </button>
            <button
              onClick={bulkDelete}
              disabled={bulkWorking}
              className="text-sm font-semibold px-4 py-2.5 min-h-[44px] rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete ({selected.size})
            </button>
          </>
        )}
      </div>

      {renderGroup('AU Stock', auStock)}
      {renderGroup('Japan Auction', auction)}
      {renderGroup('Japan Dealers', dealer)}
      {renderGroup('Other / Legacy', other)}
      {listings.length === 0 && <p className="text-gray-400 text-sm">No listings found.</p>}
    </div>
  )
}
