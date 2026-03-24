'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import AuctionCountdown from '@/components/ui/AuctionCountdown'
import ChatThread from '@/components/ui/ChatThread'

export default function AgentListingPage() {
  const params = useParams()
  const listingId = params.id as string
  const [vehicles, setVehicles] = useState<any[]>([])
  const [listing, setListing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [auctionTime, setAuctionTime] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [userRole, setUserRole] = useState('buyer_agent')

  useEffect(() => {
    fetch('/api/agent/dashboard')
      .then(r => r.json())
      .then(d => {
        const all = d.vehicles ?? []
        const matched = all.filter((v: any) => v.listing_id === listingId)
        setVehicles(matched)
        if (matched[0]?.listing) {
          setListing(matched[0].listing)
          setAuctionTime(matched[0].listing.auction_time ?? '')
          setConditionNotes(matched[0].listing.condition_notes ?? '')
        }
      })
  }, [listingId])

  async function updateListing(updates: Record<string, unknown>) {
    setSaving(true)
    try {
      await fetch(`/api/agent/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } finally {
      setSaving(false)
    }
  }

  async function updateVehicleStatus(vehicleId: string, status: string) {
    await fetch(`/api/agent/vehicles/${vehicleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auction_status: status }),
    })
    // Refresh
    const res = await fetch('/api/agent/dashboard')
    const d = await res.json()
    const matched = (d.vehicles ?? []).filter((v: any) => v.listing_id === listingId)
    setVehicles(matched)
  }

  if (!listing) return <p className="text-gray-400 py-12 text-center">Loading...</p>

  return (
    <div className="space-y-6">
      {/* Vehicle Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-64 h-48 shrink-0">
            {listing.photos?.[0] ? (
              <Image src={listing.photos[0]} alt={listing.model_name} fill className="object-cover" sizes="256px" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No photo</div>
            )}
          </div>
          <div className="p-6 flex-1">
            <h1 className="text-xl font-bold text-charcoal">
              {listing.model_year} {listing.model_name} {listing.grade ?? ''}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {listing.mileage_km?.toLocaleString()}km · Est. ${listing.aud_estimate?.toLocaleString()} AUD
            </p>
            <div className="mt-3">
              <AuctionCountdown auctionTime={listing.auction_time} auctionStatus={vehicles[0]?.auction_status} />
            </div>
          </div>
        </div>
      </div>

      {/* Customers interested in this vehicle */}
      {vehicles.map(v => (
        <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-charcoal">
                {v.customer?.first_name} {v.customer?.last_name}
              </h2>
              <p className="text-sm text-gray-500">
                {v.customer?.email} {v.customer?.phone && `· ${v.customer.phone}`}
              </p>
              {v.max_bid_jpy && (
                <p className="text-sm text-ocean font-semibold mt-1">Max bid: ¥{v.max_bid_jpy.toLocaleString()}</p>
              )}
            </div>
            <div className="flex gap-2">
              {v.auction_status !== 'won' && v.auction_status !== 'lost' && (
                <>
                  <button onClick={() => updateVehicleStatus(v.id, 'bidding')} className="btn-sm bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold">Bidding</button>
                  <button onClick={() => updateVehicleStatus(v.id, 'won')} className="btn-sm bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-semibold">Won</button>
                  <button onClick={() => updateVehicleStatus(v.id, 'lost')} className="btn-sm bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold">Lost</button>
                </>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <ChatThread customerVehicleId={v.id} currentUserRole={userRole} />
          </div>
        </div>
      ))}

      {/* Update Auction Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-charcoal mb-4">Update Auction Info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Auction Time</label>
            <input
              type="datetime-local"
              value={auctionTime ? new Date(auctionTime).toISOString().slice(0, 16) : ''}
              onChange={e => setAuctionTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sold Price (JPY)</label>
            <input
              type="number"
              placeholder="e.g. 2500000"
              onChange={e => setListing({ ...listing, sold_price_jpy: Number(e.target.value) })}
              defaultValue={listing.sold_price_jpy ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs text-gray-500 block mb-1">Condition Notes</label>
          <textarea
            value={conditionNotes}
            onChange={e => setConditionNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => updateListing({
            auction_time: auctionTime ? new Date(auctionTime).toISOString() : null,
            sold_price_jpy: listing.sold_price_jpy,
            condition_notes: conditionNotes,
          })}
          disabled={saving}
          className="btn-primary mt-4 px-6 py-2 text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
