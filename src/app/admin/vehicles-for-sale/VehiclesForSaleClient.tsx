'use client'

import { useState } from 'react'
import Link from 'next/link'
import { centsToAud } from '@/lib/utils'

const BUILD_LABELS: Record<string, string> = {
  tama: 'TAMA', mana_japan: 'MANA (JP)', mana_australia: 'MANA (AU)',
  bare_camper: 'Bare Camper', pop_top_only: 'Pop Top', custom: 'Custom', none: 'None',
}

const STAGE_LABELS: Record<string, string> = {
  vehicle_selection: 'Selection', bidding: 'Bidding', purchase: 'Purchase',
  storage: 'Storage', design_approval: 'Design Approval', van_building: 'Building',
  shipping: 'Shipping', compliance: 'Compliance', pop_top_install: 'Pop Top',
  ready_for_delivery: 'Ready', delivered: 'Delivered', searching: 'Searching',
}

interface Vehicle {
  id: string; vehicle_status: string; vehicle_description: string | null
  for_sale: boolean; sale_price_aud: number | null; sale_notes: string | null; created_at: string
  customer: { id: string; first_name: string; last_name: string | null } | null
  listing: { id: string; model_name: string; model_year: number | null; grade: string | null; photos: string[] } | null
  build: { id: string; build_type: string; pop_top: boolean; total_quoted_aud: number | null } | null
}

interface Customer { id: string; first_name: string; last_name: string | null }

export default function VehiclesForSaleClient({
  vehicles: initialVehicles,
  allCustomers,
}: {
  vehicles: Vehicle[]
  allCustomers: Customer[]
}) {
  const [vehicles, setVehicles]         = useState(initialVehicles)
  const [transferFor, setTransferFor]   = useState<string | null>(null)
  const [transferTo, setTransferTo]     = useState('')
  const [transferSearch, setTransferSearch] = useState('')
  const [transferring, setTransferring] = useState(false)

  const handleTransfer = async (vehicleId: string) => {
    if (!transferTo) return
    if (!confirm('Transfer this vehicle to the selected customer? This action cannot be easily undone.')) return
    setTransferring(true)
    const res = await fetch('/api/vehicles/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_id: vehicleId, new_customer_id: transferTo }),
    })
    setTransferring(false)
    if (res.ok) {
      setVehicles(vs => vs.filter(v => v.id !== vehicleId))
      setTransferFor(null)
      setTransferTo('')
      setTransferSearch('')
    }
  }

  const removeSale = async (vehicleId: string, customerId: string) => {
    await fetch(`/api/customers/${customerId}/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ for_sale: false, sale_price_aud: null, sale_notes: null }),
    })
    setVehicles(vs => vs.filter(v => v.id !== vehicleId))
  }

  const filteredCustomers = transferSearch
    ? allCustomers.filter(c => `${c.first_name} ${c.last_name ?? ''}`.toLowerCase().includes(transferSearch.toLowerCase()))
    : allCustomers

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🏷️</p>
        <p className="text-sm">No vehicles currently listed for sale.</p>
        <p className="text-xs mt-1">Toggle &ldquo;For Sale&rdquo; on any vehicle in a customer profile to list it here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {vehicles.map(v => {
        const label = v.listing
          ? `${v.listing.model_year ?? ''} ${v.listing.model_name}`
          : v.vehicle_description || 'Vehicle'
        const ownerName = v.customer ? [v.customer.first_name, v.customer.last_name].filter(Boolean).join(' ') : '—'
        const buildLabel = v.build ? `${BUILD_LABELS[v.build.build_type] ?? v.build.build_type}${v.build.pop_top ? ' + Pop Top' : ''}` : '—'

        return (
          <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-4">
              {v.listing?.photos?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.listing.photos[0]} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm">{label}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">FOR SALE</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{STAGE_LABELS[v.vehicle_status] ?? v.vehicle_status}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Owner: {ownerName} · Build: {buildLabel}
                  {v.sale_price_aud ? ` · ${centsToAud(v.sale_price_aud)}` : ''}
                </p>
                {v.sale_notes && <p className="text-xs text-gray-500 mt-1">{v.sale_notes}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {v.customer && (
                <Link href={`/admin/customers/${v.customer.id}`} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  View Customer
                </Link>
              )}
              <Link href={`/my-van/${v.id}`} target="_blank" className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                👁 Customer View
              </Link>
              <button
                onClick={() => { setTransferFor(transferFor === v.id ? null : v.id); setTransferTo(''); setTransferSearch('') }}
                className="text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700"
              >
                Transfer to Customer
              </button>
              {v.customer && (
                <button
                  onClick={() => removeSale(v.id, v.customer!.id)}
                  className="text-xs px-3 py-1.5 text-gray-400 hover:text-red-500"
                >
                  Remove from Sale
                </button>
              )}
            </div>

            {/* Transfer panel */}
            {transferFor === v.id && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600">Transfer to:</p>
                <input
                  type="text"
                  value={transferSearch}
                  onChange={e => { setTransferSearch(e.target.value); setTransferTo('') }}
                  placeholder="Search customers…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
                {transferSearch && (
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                    {filteredCustomers.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-400">No customers found</p>
                    ) : (
                      filteredCustomers.map(c => {
                        const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
                        const selected = transferTo === c.id
                        return (
                          <button
                            key={c.id}
                            onClick={() => { setTransferTo(c.id); setTransferSearch(name) }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selected ? 'bg-forest-50 text-forest-700 font-medium' : ''}`}
                          >
                            {name}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTransfer(v.id)}
                    disabled={!transferTo || transferring}
                    className="text-xs px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50"
                  >
                    {transferring ? 'Transferring…' : 'Confirm Transfer'}
                  </button>
                  <button onClick={() => setTransferFor(null)} className="text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-600">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
