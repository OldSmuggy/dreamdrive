'use client'

import { useState, useEffect } from 'react'
import AuctionCountdown from '@/components/ui/AuctionCountdown'
import ChatThread from '@/components/ui/ChatThread'

interface Vehicle {
  id: string
  listing_id: string
  max_bid_jpy: number | null
  auction_status: string
  listing: {
    model_name: string
    model_year: number | null
    grade: string | null
    auction_time: string | null
    auction_result: string | null
    sold_price_jpy: number | null
    aud_estimate: number | null
  } | null
  customer: { id: string; first_name: string; last_name: string; email: string; phone: string | null } | null
  agent: { id: string; first_name: string | null; last_name: string | null } | null
  message_count: number
}

interface Agent {
  id: string
  first_name: string | null
  last_name: string | null
}

export default function AdminAuctionsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/agent/dashboard').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()).catch(() => ({ agents: [] })),
    ]).then(([dashData]) => {
      setVehicles(dashData.vehicles ?? [])
    }).finally(() => setLoading(false))

    // Fetch agents (buyer_agent profiles)
    fetch('/api/admin/assign-agent?list_agents=true')
      .catch(() => {})
  }, [])

  async function assignAgent(vehicleId: string, agentId: string) {
    await fetch('/api/admin/assign-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_vehicle_id: vehicleId, agent_id: agentId || null }),
    })
    // Refresh
    const res = await fetch('/api/agent/dashboard')
    const d = await res.json()
    setVehicles(d.vehicles ?? [])
  }

  if (loading) return <p className="text-gray-400 py-12 text-center">Loading...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Auctions</h1>

      {vehicles.length === 0 && (
        <p className="text-gray-400 text-center py-12">No auction vehicles. Assign an agent to a customer vehicle to get started.</p>
      )}

      <div className="space-y-4">
        {vehicles.map(v => (
          <div key={v.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
              className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-charcoal">
                    {v.listing?.model_year} {v.listing?.model_name} {v.listing?.grade ?? ''}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Customer: {v.customer?.first_name} {v.customer?.last_name}
                    {' · '}
                    Agent: {v.agent ? `${v.agent.first_name ?? ''} ${v.agent.last_name ?? ''}`.trim() : 'Unassigned'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {v.max_bid_jpy && <span className="text-sm text-gray-500">Max: ¥{v.max_bid_jpy.toLocaleString()}</span>}
                  {v.listing?.sold_price_jpy && <span className="text-sm text-green-600 font-semibold">Sold: ¥{v.listing.sold_price_jpy.toLocaleString()}</span>}
                  <AuctionCountdown auctionTime={v.listing?.auction_time ?? null} auctionStatus={v.auction_status} showTimezone={false} />
                  {v.message_count > 0 && <span className="bg-ocean text-white text-xs px-2 py-1 rounded-full">{v.message_count}</span>}
                </div>
              </div>
            </button>

            {expandedId === v.id && (
              <div className="border-t border-gray-200 p-5">
                <div className="grid sm:grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Customer: <span className="text-charcoal font-medium">{v.customer?.first_name} {v.customer?.last_name}</span></p>
                    <p className="text-gray-500">Email: {v.customer?.email}</p>
                    <p className="text-gray-500">Phone: {v.customer?.phone ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Est. AUD: <span className="text-charcoal font-medium">${v.listing?.aud_estimate?.toLocaleString() ?? 'TBD'}</span></p>
                    <p className="text-gray-500">Max Bid: <span className="text-charcoal font-medium">{v.max_bid_jpy ? `¥${v.max_bid_jpy.toLocaleString()}` : 'Not set'}</span></p>
                  </div>
                </div>

                {/* Chat */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <ChatThread customerVehicleId={v.id} currentUserRole="admin" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
