'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AuctionCountdown from '@/components/ui/AuctionCountdown'

interface Vehicle {
  id: string
  listing_id: string
  max_bid_jpy: number | null
  auction_status: string
  listing: {
    model_name: string
    model_year: number | null
    grade: string | null
    photos: string[]
    auction_time: string | null
    auction_result: string | null
    sold_price_jpy: number | null
    aud_estimate: number | null
    mileage_km: number | null
  } | null
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
  } | null
  agent: { first_name: string | null; last_name: string | null } | null
  message_count: number
}

export default function AgentDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agent/dashboard')
      .then(r => r.json())
      .then(d => setVehicles(d.vehicles ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-400 py-12 text-center">Loading...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Assigned Vehicles</h1>

      {vehicles.length === 0 && (
        <p className="text-gray-400 text-center py-12">No vehicles assigned yet.</p>
      )}

      <div className="space-y-4">
        {vehicles.map(v => (
          <Link
            key={v.id}
            href={`/agent/listing/${v.listing_id}`}
            className="block bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="flex">
              <div className="relative w-32 h-28 shrink-0">
                {v.listing?.photos?.[0] ? (
                  <Image src={v.listing.photos[0]} alt={v.listing?.model_name ?? 'Vehicle'} fill className="object-cover" sizes="128px" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No photo</div>
                )}
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-charcoal">
                      {v.listing?.model_year} {v.listing?.model_name} {v.listing?.grade ?? ''}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Customer: {v.customer?.first_name} {v.customer?.last_name}
                      {v.customer?.phone && ` · ${v.customer.phone}`}
                    </p>
                  </div>
                  {v.message_count > 0 && (
                    <span className="bg-ocean text-white text-xs px-2 py-1 rounded-full">{v.message_count} msg</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <AuctionCountdown auctionTime={v.listing?.auction_time ?? null} auctionStatus={v.auction_status} showTimezone={false} />
                  {v.max_bid_jpy && (
                    <span className="text-sm text-gray-500">Max bid: ¥{v.max_bid_jpy.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
