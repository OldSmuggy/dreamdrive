'use client'

import { useState } from 'react'
import Link from 'next/link'

const ORDER_STAGES = [
  { key: 'vehicle_selection', label: 'Vehicle Selection' },
  { key: 'deposit_received',  label: 'Deposit Received' },
  { key: 'sourcing',          label: 'Sourcing' },
  { key: 'auction_won',       label: 'Auction Won' },
  { key: 'payment_received',  label: 'Payment Received' },
  { key: 'export_docs',       label: 'Export Docs' },
  { key: 'shipped',           label: 'Shipped' },
  { key: 'arrived_au',        label: 'Arrived AU' },
  { key: 'compliance',        label: 'Compliance' },
  { key: 'delivered',         label: 'Delivered' },
]

const STAGE_COLORS: Record<string, string> = {
  vehicle_selection: 'bg-gray-100 text-gray-600',
  deposit_received:  'bg-amber-100 text-amber-700',
  sourcing:          'bg-blue-100 text-blue-700',
  auction_won:       'bg-purple-100 text-purple-700',
  payment_received:  'bg-indigo-100 text-indigo-700',
  export_docs:       'bg-orange-100 text-orange-700',
  shipped:           'bg-cyan-100 text-cyan-700',
  arrived_au:        'bg-teal-100 text-teal-700',
  compliance:        'bg-yellow-100 text-yellow-700',
  delivered:         'bg-green-100 text-green-700',
}

interface Vehicle { id: string; current_stage: string; created_at: string }

interface Customer {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  state: string | null
  created_at: string
  customer_vehicles: Vehicle[]
}

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [q, setQ] = useState('')

  const filtered = q.trim()
    ? customers.filter(c => {
        const name = `${c.first_name} ${c.last_name ?? ''}`.toLowerCase()
        const search = q.toLowerCase()
        return name.includes(search) || c.email?.toLowerCase().includes(search) || c.phone?.includes(search)
      })
    : customers

  const latestStage = (c: Customer) => {
    if (!c.customer_vehicles.length) return null
    const sorted = [...c.customer_vehicles].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return sorted[0]?.current_stage ?? null
  }

  const stageLabel = (key: string) => ORDER_STAGES.find(s => s.key === key)?.label ?? key

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name, email or phone…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">{q ? 'No customers match your search.' : 'No customers yet — add the first one.'}</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(c => {
          const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
          const stage = latestStage(c)
          const vehicleCount = c.customer_vehicles.length
          return (
            <Link
              key={c.id}
              href={`/admin/customers/${c.id}`}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm hover:border-gray-300 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-sm font-semibold shrink-0">
                {(c.first_name[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {[c.email, c.phone, c.state].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {vehicleCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {vehicleCount} van{vehicleCount !== 1 ? 's' : ''}
                  </span>
                )}
                {stage && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[stage] ?? 'bg-gray-100 text-gray-600'}`}>
                    {stageLabel(stage)}
                  </span>
                )}
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
