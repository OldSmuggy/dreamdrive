'use client'

import { useState } from 'react'
import Link from 'next/link'

const STAGE_LABELS: Record<string, string> = {
  searching:           'Searching',
  targeted:            'Targeted',
  vehicle_selection:   'Vehicle Selection',
  bidding:             'Bidding',
  purchase:            'Purchase',
  storage:             'Storage',
  van_building:        'Van Building',
  shipping:            'Shipping',
  compliance:          'Compliance',
  pop_top_install:     'Pop Top Install',
  ready_for_delivery:  'Ready for Delivery',
  delivered:           'Delivered',
}

const STAGE_BADGE: Record<string, string> = {
  delivered:          'bg-green-100 text-green-700',
  ready_for_delivery: 'bg-emerald-100 text-emerald-700',
  van_building:       'bg-blue-100 text-blue-700',
  building:           'bg-blue-100 text-blue-700',
  shipping:           'bg-cyan-100 text-cyan-700',
  compliance:         'bg-yellow-100 text-yellow-700',
  pop_top_install:    'bg-purple-100 text-purple-700',
  purchase:           'bg-indigo-100 text-indigo-700',
  bidding:            'bg-orange-100 text-orange-700',
  storage:            'bg-teal-100 text-teal-700',
  searching:          'bg-gray-100 text-gray-500',
  targeted:           'bg-amber-100 text-amber-700',
}

const STATUS_TABS = ['all', 'active', 'completed', 'archived'] as const
type StatusTab = typeof STATUS_TABS[number]

interface Vehicle { id: string; vehicle_status: string; created_at: string }
interface Customer {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  state: string | null
  status: string
  created_at: string
  customer_vehicles: Vehicle[]
}

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [q, setQ]             = useState('')
  const [tab, setTab]         = useState<StatusTab>('active')

  const filtered = customers
    .filter(c => tab === 'all' || c.status === tab)
    .filter(c => {
      if (!q.trim()) return true
      const search = q.toLowerCase()
      const name   = `${c.first_name} ${c.last_name ?? ''}`.toLowerCase()
      return name.includes(search) || c.email?.toLowerCase().includes(search) || c.phone?.includes(search)
    })

  const activeCount    = customers.filter(c => c.status === 'active').length
  const completedCount = customers.filter(c => c.status === 'completed').length
  const archivedCount  = customers.filter(c => c.status === 'archived').length

  const latestStage = (c: Customer) => {
    if (!c.customer_vehicles.length) return null
    const sorted = [...c.customer_vehicles].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    return sorted[0]?.vehicle_status ?? null
  }

  return (
    <div>
      {/* Status tabs */}
      <div className="flex gap-1 mb-4">
        {STATUS_TABS.map(t => {
          const count = t === 'all' ? customers.length : t === 'active' ? activeCount : t === 'completed' ? completedCount : archivedCount
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? 'bg-forest-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t} <span className="opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
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
          <p className="text-sm">{q ? 'No customers match your search.' : `No ${tab === 'all' ? '' : tab + ' '}customers yet.`}</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(c => {
          const name  = [c.first_name, c.last_name].filter(Boolean).join(' ')
          const stage = latestStage(c)
          const vCount = c.customer_vehicles.length
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
                {vCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {vCount} van{vCount !== 1 ? 's' : ''}
                  </span>
                )}
                {stage && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_BADGE[stage] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STAGE_LABELS[stage] ?? stage}
                  </span>
                )}
                {c.status === 'archived' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Archived</span>
                )}
                {c.status === 'completed' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Completed</span>
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
