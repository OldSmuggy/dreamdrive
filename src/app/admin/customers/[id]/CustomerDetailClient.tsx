'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { centsToAud } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGE_ORDER = [
  'vehicle_selection', 'bidding', 'purchase', 'storage',
  'design_approval', 'van_building', 'shipping', 'compliance',
  'pop_top_install', 'ready_for_delivery', 'delivered',
]

const STAGE_LABELS: Record<string, string> = {
  vehicle_selection:  'Vehicle Selection',
  bidding:            'Bidding',
  purchase:           'Purchase',
  storage:            'Storage (Japan)',
  design_approval:    'Design Approval',
  van_building:       'Van Building',
  shipping:           'Shipping',
  compliance:         'Compliance',
  pop_top_install:    'Pop Top Installation',
  ready_for_delivery: 'Ready for Delivery',
  delivered:          'Delivered',
}

const BUILD_TYPES = [
  { value: 'none',           label: 'None' },
  { value: 'tama',           label: 'TAMA' },
  { value: 'mana_japan',     label: 'MANA (Japan)' },
  { value: 'mana_australia', label: 'MANA (Australia)' },
  { value: 'bare_camper',    label: 'Bare Camper' },
  { value: 'pop_top_only',   label: 'Pop Top Only' },
  { value: 'custom',         label: 'Custom' },
]

const BUILD_STATUS_LABELS: Record<string, string> = {
  quoted:      'Quoted',
  confirmed:   'Confirmed',
  in_progress: 'In Progress',
  completed:   'Completed',
}

const DOC_TYPES = [
  { value: 'quote',            label: 'Quote' },
  { value: 'invoice',          label: 'Invoice' },
  { value: 'inspection_sheet', label: 'Inspection Sheet' },
  { value: 'shipping_doc',     label: 'Shipping Document' },
  { value: 'compliance_cert',  label: 'Compliance Certificate' },
  { value: 'photo',            label: 'Photo' },
  { value: 'contract',         label: 'Contract' },
  { value: 'other',            label: 'Other' },
]

const DOC_TYPE_BADGE: Record<string, string> = {
  quote:            'bg-blue-100 text-blue-700',
  invoice:          'bg-green-100 text-green-700',
  inspection_sheet: 'bg-amber-100 text-amber-700',
  shipping_doc:     'bg-cyan-100 text-cyan-700',
  compliance_cert:  'bg-purple-100 text-purple-700',
  photo:            'bg-pink-100 text-pink-700',
  contract:         'bg-indigo-100 text-indigo-700',
  other:            'bg-gray-100 text-gray-600',
}

const PRODUCT_CATEGORIES = [
  { key: 'fitout',     label: 'Fit-Out' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'poptop',     label: 'Pop Top' },
  { key: 'addon',      label: 'Add-Ons' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderStage {
  id: string
  stage: string
  status: 'completed' | 'current' | 'upcoming'
  notes: string | null
  entered_at: string | null
  completed_at: string | null
  planned_date: string | null
}

interface Build {
  id: string
  build_type: string
  build_location: string | null
  conversion_fee_aud: number | null
  pop_top: boolean
  pop_top_fee_aud: number | null
  addon_slugs: string[]
  addons_total_aud: number
  custom_description: string | null
  custom_quote_aud: number | null
  total_quoted_aud: number | null
  build_status: string
  notes: string | null
}

interface TargetPrefs {
  min_year?: number | string
  max_year?: number | string
  max_budget_aud?: number | string
  drive?: string
  engine?: string
  grade?: string
  colour?: string
  notes?: string
}

interface Listing {
  id: string
  model_name: string
  model_year: number | null
  grade: string | null
  chassis_code: string | null
  photos: string[]
  bid_no: string | null
  mileage_km: number | null
  start_price_jpy: number | null
  buy_price_jpy: number | null
}

interface Vehicle {
  id: string
  vehicle_status: string
  vehicle_description: string | null
  target_preferences: TargetPrefs
  listing_id: string | null
  purchase_price_jpy: number | null
  purchase_price_aud: number | null
  build_date: string | null
  notes: string | null
  sort_order: number
  created_at: string
  listing: Listing | null
  order_stages: OrderStage[]
  customer_builds: Build[]
}

interface Document {
  id: string
  name: string
  file_url: string
  file_type: string | null
  file_size_bytes: number | null
  document_type: string
  notes: string | null
  created_at: string
  customer_vehicle_id: string | null
}

interface Product {
  id: string
  slug: string
  name: string
  rrp_aud: number
  special_price_aud: number | null
  category: string
}

interface Customer {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  state: string | null
  notes: string | null
  hubspot_contact_id: string | null
  status: string
  created_at: string
  customer_vehicles: Vehicle[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })
}

function fmtBytes(b: number | null) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function fmtJpy(jpy: number | null) {
  if (!jpy) return ''
  return `¥${jpy.toLocaleString()}`
}

function toInputDate(iso: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function isFutureDate(dateStr: string | null) {
  if (!dateStr) return false
  return new Date(dateStr) > new Date()
}

// ── Stage Tracker ─────────────────────────────────────────────────────────────

function StageTracker({
  stages,
  hasPoptop,
  hasDesignApproval,
  vehicleId,
  customerId,
  onStagesUpdate,
  onVehicleStatusUpdate,
}: {
  stages: OrderStage[]
  hasPoptop: boolean
  hasDesignApproval: boolean
  vehicleId: string
  customerId: string
  onStagesUpdate: (vehicleId: string, stages: OrderStage[]) => void
  onVehicleStatusUpdate: (vehicleId: string, status: string) => void
}) {
  const [advancing, setAdvancing]         = useState(false)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [noteText, setNoteText]           = useState('')
  const [savingNote, setSavingNote]       = useState(false)
  const [editingDate, setEditingDate]     = useState<string | null>(null)

  // Filter stages based on build config
  const visibleKeys = STAGE_ORDER.filter(s => {
    if (s === 'pop_top_install' && !hasPoptop) return false
    if (s === 'design_approval' && !hasDesignApproval) return false
    return true
  })

  const sortedStages = visibleKeys
    .map(key => stages.find(s => s.stage === key))
    .filter((s): s is OrderStage => !!s)

  const currentStage = sortedStages.find(s => s.status === 'current')
  const currentIdx   = currentStage ? visibleKeys.indexOf(currentStage.stage) : -1
  const canAdvance   = currentIdx < visibleKeys.length - 1
  const canGoBack    = currentIdx > 0

  const advance = async (direction: 'advance' | 'back') => {
    setAdvancing(true)
    const res = await fetch(`/api/customers/${customerId}/vehicles/${vehicleId}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: direction,
        skip_poptop: !hasPoptop,
        skip_design_approval: !hasDesignApproval,
      }),
    })
    const updated = await res.json()
    setAdvancing(false)
    if (res.ok) {
      onStagesUpdate(vehicleId, updated)
      const newCurrent = (updated as OrderStage[]).find(s => s.status === 'current')
      if (newCurrent) onVehicleStatusUpdate(vehicleId, newCurrent.stage)
    }
  }

  const jumpTo = async (stage: string) => {
    if (stage === currentStage?.stage) return
    setAdvancing(true)
    const res = await fetch(`/api/customers/${customerId}/vehicles/${vehicleId}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'jump', stage }),
    })
    const updated = await res.json()
    setAdvancing(false)
    if (res.ok) {
      onStagesUpdate(vehicleId, updated)
      onVehicleStatusUpdate(vehicleId, stage)
    }
  }

  const saveNote = async () => {
    if (!currentStage || !noteText.trim()) return
    setSavingNote(true)
    const res = await fetch(`/api/customers/${customerId}/vehicles/${vehicleId}/stages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: currentStage.id, notes: noteText }),
    })
    const updated = await res.json()
    setSavingNote(false)
    if (res.ok) {
      onStagesUpdate(vehicleId, stages.map(s => s.id === updated.id ? updated : s))
      setNoteText('')
    }
  }

  const saveStageDate = async (stageId: string, field: 'planned_date' | 'entered_at' | 'completed_at', value: string) => {
    const res = await fetch(`/api/customers/${customerId}/vehicles/${vehicleId}/stages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId, [field]: value || null }),
    })
    const updated = await res.json()
    if (res.ok) {
      onStagesUpdate(vehicleId, stages.map(s => s.id === updated.id ? updated : s))
    }
  }

  return (
    <div className="space-y-3">
      {/* Dots */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-start min-w-max gap-0">
          {sortedStages.map((stage, i) => {
            const done   = stage.status === 'completed'
            const active = stage.status === 'current'
            const upcoming = stage.status === 'upcoming'
            const isExpanded = expandedStage === stage.stage

            // Determine which date to show and its color
            let dateDisplay = ''
            let dateColor   = 'text-gray-300'
            if (done && stage.completed_at) {
              dateDisplay = fmtDate(stage.completed_at)
              dateColor   = isFutureDate(stage.completed_at) ? 'text-gray-400 italic' : 'text-forest-500'
            } else if (active && stage.entered_at) {
              dateDisplay = fmtDate(stage.entered_at)
              dateColor   = 'text-forest-400'
            } else if (upcoming && stage.planned_date) {
              dateDisplay = fmtDate(stage.planned_date)
              dateColor   = 'text-gray-400 italic'
            }

            return (
              <div key={stage.stage} className="flex items-start">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      if (upcoming && !isExpanded) setExpandedStage(stage.stage)
                      else if (isExpanded) setExpandedStage(null)
                      else setExpandedStage(stage.stage)
                    }}
                    title={upcoming ? `Set planned date or jump to ${STAGE_LABELS[stage.stage]}` : STAGE_LABELS[stage.stage]}
                    className="flex flex-col items-center group"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                      ${done   ? 'bg-forest-600 border-forest-600 text-white'                       : ''}
                      ${active ? 'bg-white border-forest-600 text-forest-700 ring-2 ring-forest-200' : ''}
                      ${upcoming ? 'bg-gray-100 border-gray-300 text-gray-400 hover:border-gray-400' : ''}
                    `}>
                      {done ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : <span>{i + 1}</span>}
                    </div>
                    <p className={`text-[10px] mt-1 whitespace-nowrap leading-tight text-center max-w-[56px] ${active ? 'text-forest-700 font-semibold' : done ? 'text-forest-500' : 'text-gray-400'}`}>
                      {STAGE_LABELS[stage.stage]}
                    </p>
                  </button>
                  {dateDisplay && (
                    <p className={`text-[9px] whitespace-nowrap ${dateColor}`}>{dateDisplay}</p>
                  )}
                </div>
                {i < sortedStages.length - 1 && (
                  <div className={`h-0.5 w-6 mx-0.5 mt-3.5 shrink-0 ${i < currentIdx ? 'bg-forest-600' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Expanded stage panel */}
      {expandedStage && (() => {
        const s = stages.find(st => st.stage === expandedStage)
        if (!s) return null
        const done     = s.status === 'completed'
        const active   = s.status === 'current'
        const upcoming = s.status === 'upcoming'

        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-700">{STAGE_LABELS[s.stage]}</p>
              {upcoming && (
                <button
                  onClick={() => jumpTo(s.stage)}
                  className="text-xs px-2 py-1 bg-forest-600 text-white rounded hover:bg-forest-700"
                >
                  Jump to this stage
                </button>
              )}
            </div>

            {/* Date editors */}
            <div className="grid grid-cols-2 gap-2">
              {(done || active) && (
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">Entered</label>
                  <input
                    type="date"
                    value={toInputDate(s.entered_at)}
                    onChange={e => saveStageDate(s.id, 'entered_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                  />
                </div>
              )}
              {done && (
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">Completed</label>
                  <input
                    type="date"
                    value={toInputDate(s.completed_at)}
                    onChange={e => saveStageDate(s.id, 'completed_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className={`w-full border border-gray-300 rounded px-2 py-1 text-xs ${isFutureDate(s.completed_at) ? 'text-gray-400 italic' : ''}`}
                  />
                </div>
              )}
              {upcoming && (
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">Planned Date</label>
                  <input
                    type="date"
                    value={toInputDate(s.planned_date)}
                    onChange={e => saveStageDate(s.id, 'planned_date', e.target.value || '')}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-400"
                  />
                </div>
              )}
            </div>

            {s.notes && <p className="text-gray-600 italic">{s.notes}</p>}
          </div>
        )
      })()}

      {/* Stage controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => advance('back')}
          disabled={!canGoBack || advancing}
          className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          ← Back
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-semibold text-forest-700">
            {currentStage ? STAGE_LABELS[currentStage.stage] : '—'}
          </span>
          <span className="text-xs text-gray-400 ml-1">({currentIdx + 1}/{visibleKeys.length})</span>
        </div>
        <button
          onClick={() => advance('advance')}
          disabled={!canAdvance || advancing}
          className="text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-40"
        >
          {advancing ? '…' : 'Advance →'}
        </button>
      </div>

      {/* Note for current stage */}
      {currentStage && (
        <div className="flex gap-2">
          <input
            type="text"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder={`Add note to "${STAGE_LABELS[currentStage.stage]}"…`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-forest-500"
            onKeyDown={e => e.key === 'Enter' && saveNote()}
          />
          <button
            onClick={saveNote}
            disabled={!noteText.trim() || savingNote}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            {savingNote ? '…' : 'Save Note'}
          </button>
        </div>
      )}
      {currentStage?.notes && (
        <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-1.5">
          Current note: {currentStage.notes}
        </p>
      )}
    </div>
  )
}

// ── Build Editor ──────────────────────────────────────────────────────────────

function BuildEditor({
  vehicleId,
  customerId,
  initialBuild,
  products,
  onSave,
}: {
  vehicleId: string
  customerId: string
  initialBuild: Build | null
  products: Product[]
  onSave: (vehicleId: string, build: Build) => void
}) {
  const defaultBuild = {
    build_type:         initialBuild?.build_type         ?? 'none',
    build_location:     initialBuild?.build_location     ?? '',
    conversion_fee_aud: initialBuild?.conversion_fee_aud ? String(initialBuild.conversion_fee_aud / 100) : '',
    pop_top:            initialBuild?.pop_top            ?? false,
    pop_top_fee_aud:    initialBuild?.pop_top_fee_aud    ? String(initialBuild.pop_top_fee_aud / 100) : '13090',
    addon_slugs:        initialBuild?.addon_slugs        ?? [],
    custom_description: initialBuild?.custom_description ?? '',
    custom_quote_aud:   initialBuild?.custom_quote_aud   ? String(initialBuild.custom_quote_aud / 100) : '',
    total_quoted_aud:   initialBuild?.total_quoted_aud   ? String(initialBuild.total_quoted_aud / 100) : '',
    build_status:       initialBuild?.build_status       ?? 'quoted',
    notes:              initialBuild?.notes              ?? '',
  }

  const [form, setForm]     = useState(defaultBuild)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const toggleProduct = (slug: string) => {
    setForm(f => ({
      ...f,
      addon_slugs: f.addon_slugs.includes(slug)
        ? f.addon_slugs.filter(s => s !== slug)
        : [...f.addon_slugs, slug],
    }))
  }

  const productTotal = form.addon_slugs.reduce((sum, slug) => {
    const p = products.find(pr => pr.slug === slug)
    return sum + (p ? (p.special_price_aud ?? p.rrp_aud) : 0)
  }, 0)

  const calcTotal = () => {
    const conv    = parseFloat(form.conversion_fee_aud) * 100 || 0
    const poptop  = form.pop_top ? (parseFloat(form.pop_top_fee_aud) * 100 || 0) : 0
    const custom  = form.build_type === 'custom' ? (parseFloat(form.custom_quote_aud) * 100 || 0) : 0
    return conv + poptop + productTotal + custom
  }

  const save = async () => {
    setSaving(true)
    const total = form.total_quoted_aud ? parseFloat(form.total_quoted_aud) * 100 : calcTotal()
    const res = await fetch(`/api/customers/${customerId}/vehicles/${vehicleId}/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        build_type:         form.build_type,
        build_location:     form.build_location     || null,
        conversion_fee_aud: form.conversion_fee_aud ? Math.round(parseFloat(form.conversion_fee_aud) * 100) : null,
        pop_top:            form.pop_top,
        pop_top_fee_aud:    form.pop_top ? Math.round(parseFloat(form.pop_top_fee_aud) * 100) : null,
        addon_slugs:        form.addon_slugs,
        addons_total_aud:   productTotal,
        custom_description: form.build_type === 'custom' ? form.custom_description : null,
        custom_quote_aud:   form.build_type === 'custom' && form.custom_quote_aud ? Math.round(parseFloat(form.custom_quote_aud) * 100) : null,
        total_quoted_aud:   Math.round(total),
        build_status:       form.build_status,
        notes:              form.notes || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) { onSave(vehicleId, data); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  const estimatedTotal = calcTotal()

  // Group products by category
  const grouped = PRODUCT_CATEGORIES.map(cat => ({
    ...cat,
    items: products.filter(p => p.category === cat.key),
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Build Type</label>
          <select
            value={form.build_type}
            onChange={e => setForm(f => ({ ...f, build_type: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            {BUILD_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
          <select
            value={form.build_location}
            onChange={e => setForm(f => ({ ...f, build_location: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            <option value="">—</option>
            <option value="japan">Japan</option>
            <option value="australia">Australia</option>
          </select>
        </div>
      </div>

      {form.build_type !== 'none' && form.build_type !== 'custom' && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Conversion Fee (AUD)</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
            <input type="number" value={form.conversion_fee_aud} onChange={e => setForm(f => ({ ...f, conversion_fee_aud: e.target.value }))} className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" placeholder="0" />
          </div>
        </div>
      )}

      {form.build_type === 'custom' && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Custom Build Description</label>
            <textarea value={form.custom_description} onChange={e => setForm(f => ({ ...f, custom_description: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Custom Quote (AUD)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
              <input type="number" value={form.custom_quote_aud} onChange={e => setForm(f => ({ ...f, custom_quote_aud: e.target.value }))} className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
            </div>
          </div>
        </div>
      )}

      {/* Pop Top */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => setForm(f => ({ ...f, pop_top: !f.pop_top }))}
          className={`w-10 h-6 rounded-full transition-colors relative ${form.pop_top ? 'bg-forest-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.pop_top ? 'translate-x-5' : 'translate-x-1'}`} />
        </div>
        <span className="text-sm text-gray-700">Pop Top included</span>
        {form.pop_top && <span className="text-xs text-gray-400">(${parseFloat(form.pop_top_fee_aud || '13090').toLocaleString()})</span>}
      </label>

      {form.pop_top && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Pop Top Fee (AUD)</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
            <input type="number" value={form.pop_top_fee_aud} onChange={e => setForm(f => ({ ...f, pop_top_fee_aud: e.target.value }))} className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
          </div>
        </div>
      )}

      {/* Products grouped by category */}
      {grouped.map(group => (
        <div key={group.key}>
          <label className="block text-xs font-semibold text-gray-600 mb-2">{group.label}</label>
          <div className="space-y-1.5">
            {group.items.map(p => {
              const price   = p.special_price_aud ?? p.rrp_aud
              const checked = form.addon_slugs.includes(p.slug)
              return (
                <label key={p.slug} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={() => toggleProduct(p.slug)} className="w-4 h-4 text-forest-600 rounded border-gray-300 focus:ring-forest-500" />
                  <span className={`text-sm flex-1 ${checked ? 'text-gray-900' : 'text-gray-600'}`}>{p.name}</span>
                  <span className="text-xs text-gray-400">{centsToAud(price)}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Total Quoted (AUD)</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
            <input type="number" value={form.total_quoted_aud} onChange={e => setForm(f => ({ ...f, total_quoted_aud: e.target.value }))} placeholder={estimatedTotal > 0 ? String(estimatedTotal / 100) : '0'} className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
          </div>
          {estimatedTotal > 0 && <p className="text-xs text-gray-400 mt-0.5">Auto-calculated: {centsToAud(estimatedTotal)}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Build Status</label>
          <select value={form.build_status} onChange={e => setForm(f => ({ ...f, build_status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-500">
            {Object.entries(BUILD_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Build Notes</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest-500" />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${saved ? 'bg-green-600 text-white' : 'bg-forest-600 text-white hover:bg-forest-700'}`}
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Build'}
      </button>
    </div>
  )
}

// ── Document Section ──────────────────────────────────────────────────────────

function DocSection({
  docs,
  customerId,
  vehicleId,
  onAdded,
  onDeleted,
}: {
  docs: Document[]
  customerId: string
  vehicleId: string | null
  onAdded: (doc: Document) => void
  onDeleted: (docId: string) => void
}) {
  const [showUpload, setShowUpload]     = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [uploadErr, setUploadErr]       = useState<string | null>(null)
  const [confirmDel, setConfirmDel]     = useState<string | null>(null)
  const [docName, setDocName]           = useState('')
  const [docType, setDocType]           = useState('other')
  const [docNotes, setDocNotes]         = useState('')
  const fileRef                          = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const upload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setUploadErr(null)
    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('name', docName || selectedFile.name)
    fd.append('document_type', docType)
    if (vehicleId) fd.append('vehicle_id', vehicleId)
    if (docNotes) fd.append('notes', docNotes)

    const res = await fetch(`/api/customers/${customerId}/documents`, { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (res.ok) {
      onAdded(data)
      setShowUpload(false)
      setSelectedFile(null)
      setDocName('')
      setDocType('other')
      setDocNotes('')
      if (fileRef.current) fileRef.current.value = ''
    } else {
      setUploadErr(data.error ?? 'Upload failed')
    }
  }

  const del = async (docId: string) => {
    await fetch(`/api/customers/${customerId}/documents?docId=${docId}`, { method: 'DELETE' })
    onDeleted(docId)
    setConfirmDel(null)
  }

  return (
    <div className="space-y-2">
      {docs.length === 0 && !showUpload && <p className="text-xs text-gray-400">No documents yet.</p>}

      {docs.map(doc => (
        <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">{doc.file_type === 'pdf' ? '📄' : doc.file_type === 'image' ? '🖼️' : '📎'}</span>
            <div className="min-w-0">
              <button onClick={() => window.open(doc.file_url, '_blank')} className="text-sm font-medium text-forest-700 hover:underline truncate block">{doc.name}</button>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DOC_TYPE_BADGE[doc.document_type] ?? DOC_TYPE_BADGE.other}`}>
                  {DOC_TYPES.find(d => d.value === doc.document_type)?.label ?? doc.document_type}
                </span>
                <span className="text-[10px] text-gray-400">{fmtDate(doc.created_at)}</span>
                {doc.file_size_bytes && <span className="text-[10px] text-gray-400">{fmtBytes(doc.file_size_bytes)}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {confirmDel === doc.id ? (
              <>
                <button onClick={() => del(doc.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                <button onClick={() => setConfirmDel(null)} className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-600">Cancel</button>
              </>
            ) : (
              <button onClick={() => setConfirmDel(doc.id)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
            )}
          </div>
        </div>
      ))}

      {showUpload && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">File</label>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => { const f = e.target.files?.[0] ?? null; setSelectedFile(f); if (f && !docName) setDocName(f.name.replace(/\.[^.]+$/, '')) }} className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-forest-600 file:text-white hover:file:bg-forest-700" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Display Name</label>
              <input type="text" value={docName} onChange={e => setDocName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-forest-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-forest-500">
                {DOC_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
            <input type="text" value={docNotes} onChange={e => setDocNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-forest-500" />
          </div>
          {uploadErr && <p className="text-xs text-red-600">{uploadErr}</p>}
          <div className="flex gap-2">
            <button onClick={upload} disabled={!selectedFile || uploading} className="text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50">{uploading ? 'Uploading…' : 'Upload'}</button>
            <button onClick={() => { setShowUpload(false); setSelectedFile(null); setUploadErr(null) }} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {!showUpload && (
        <button onClick={() => setShowUpload(true)} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">+ Upload Document</button>
      )}
    </div>
  )
}

// ── Vehicle Card ──────────────────────────────────────────────────────────────

function VehicleCard({
  vehicle,
  customer,
  stagesForVehicle,
  buildForVehicle,
  docsForVehicle,
  products,
  onStagesUpdate,
  onVehicleStatusUpdate,
  onBuildSave,
  onDocAdded,
  onDocDeleted,
  onVehicleUpdate,
  onVehicleDelete,
}: {
  vehicle: Vehicle
  customer: Customer
  stagesForVehicle: OrderStage[]
  buildForVehicle: Build | null
  docsForVehicle: Document[]
  products: Product[]
  onStagesUpdate: (vid: string, stages: OrderStage[]) => void
  onVehicleStatusUpdate: (vid: string, status: string) => void
  onBuildSave: (vid: string, build: Build) => void
  onDocAdded: (doc: Document) => void
  onDocDeleted: (docId: string) => void
  onVehicleUpdate: (vehicle: Vehicle) => void
  onVehicleDelete: (vid: string) => void
}) {
  const [showListingSearch, setShowListingSearch] = useState(false)
  const [listingQuery, setListingQuery]           = useState('')
  const [listingResults, setListingResults]       = useState<Listing[]>([])
  const [linkingListing, setLinkingListing]       = useState(false)

  const [showTargetPrefs, setShowTargetPrefs] = useState(false)
  const [prefs, setPrefs]                     = useState<TargetPrefs>(vehicle.target_preferences ?? {})
  const [savingPrefs, setSavingPrefs]         = useState(false)

  const [showBuild, setShowBuild]       = useState(!!buildForVehicle)
  const [showDocs, setShowDocs]         = useState(false)

  const [vehicleNotes, setVehicleNotes] = useState(vehicle.notes ?? '')
  const [savingNotes, setSavingNotes]   = useState(false)

  const [purchaseJpy, setPurchaseJpy]     = useState(vehicle.purchase_price_jpy ? String(vehicle.purchase_price_jpy) : '')
  const [purchaseAud, setPurchaseAud]     = useState(vehicle.purchase_price_aud ? String(vehicle.purchase_price_aud / 100) : '')
  const [savingPurchase, setSavingPurchase] = useState(false)

  const [buildDate, setBuildDate]       = useState(vehicle.build_date ?? '')
  const [savingBuildDate, setSavingBuildDate] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)

  // Design approval toggle — optional stage
  const [designApproval, setDesignApproval] = useState(true)

  const searchListings = async (q: string) => {
    setListingQuery(q)
    if (q.length < 2) { setListingResults([]); return }
    const res = await fetch(`/api/listings/search?q=${encodeURIComponent(q)}`)
    if (res.ok) setListingResults(await res.json())
  }

  const linkListing = async (listing: Listing) => {
    setLinkingListing(true)
    const res = await fetch(`/api/customers/${customer.id}/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listing.id }),
    })
    setLinkingListing(false)
    if (res.ok) {
      onVehicleUpdate({ ...vehicle, listing_id: listing.id, listing })
      setShowListingSearch(false)
      setListingQuery('')
      setListingResults([])
    }
  }

  const unlinkListing = async () => {
    const res = await fetch(`/api/customers/${customer.id}/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: null }),
    })
    if (res.ok) onVehicleUpdate({ ...vehicle, listing_id: null, listing: null })
  }

  const savePrefs = async () => {
    setSavingPrefs(true)
    const res = await fetch(`/api/customers/${customer.id}/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_preferences: prefs }),
    })
    setSavingPrefs(false)
    if (res.ok) onVehicleUpdate({ ...vehicle, target_preferences: prefs })
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    await fetch(`/api/customers/${customer.id}/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: vehicleNotes }),
    })
    setSavingNotes(false)
    onVehicleUpdate({ ...vehicle, notes: vehicleNotes })
  }

  const savePurchasePricing = async () => {
    setSavingPurchase(true)
    await fetch(`/api/customers/${customer.id}/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchase_price_jpy: purchaseJpy ? parseInt(purchaseJpy) : null,
        purchase_price_aud: purchaseAud ? Math.round(parseFloat(purchaseAud) * 100) : null,
      }),
    })
    setSavingPurchase(false)
  }

  const saveBuildDate = async () => {
    setSavingBuildDate(true)
    await fetch(`/api/customers/${customer.id}/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ build_date: buildDate || null }),
    })
    setSavingBuildDate(false)
    onVehicleUpdate({ ...vehicle, build_date: buildDate || null })
  }

  const label = vehicle.listing
    ? `${vehicle.listing.model_year ?? ''} ${vehicle.listing.model_name}`.trim()
    : vehicle.vehicle_description || 'New Vehicle'

  const hasPoptop = buildForVehicle?.pop_top ?? false

  const statusColors: Record<string, string> = {
    searching:          'bg-gray-100 text-gray-600',
    targeted:           'bg-amber-100 text-amber-700',
    bidding:            'bg-orange-100 text-orange-700',
    purchase:           'bg-indigo-100 text-indigo-700',
    storage:            'bg-teal-100 text-teal-700',
    design_approval:    'bg-pink-100 text-pink-700',
    van_building:       'bg-blue-100 text-blue-700',
    shipping:           'bg-cyan-100 text-cyan-700',
    compliance:         'bg-yellow-100 text-yellow-700',
    pop_top_install:    'bg-purple-100 text-purple-700',
    ready_for_delivery: 'bg-emerald-100 text-emerald-700',
    delivered:          'bg-green-100 text-green-700',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {vehicle.listing?.photos?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vehicle.listing.photos[0]} alt="" className="w-16 h-10 object-cover rounded shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[vehicle.vehicle_status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STAGE_LABELS[vehicle.vehicle_status] ?? vehicle.vehicle_status}
              </span>
            </div>
            {vehicle.listing && (
              <p className="text-xs text-gray-400">
                {[vehicle.listing.grade, vehicle.listing.chassis_code, vehicle.listing.bid_no].filter(Boolean).join(' · ')}
                {vehicle.listing.mileage_km && ` · ${vehicle.listing.mileage_km.toLocaleString()} km`}
                {' '}
                <Link href={`/van/${vehicle.listing.id}`} target="_blank" className="text-forest-600 hover:underline">View →</Link>
              </p>
            )}
            {vehicle.build_date && (
              <p className="text-xs text-gray-400">Build date: {fmtDate(vehicle.build_date)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {confirmDelete ? (
            <>
              <span className="text-xs text-red-600">Remove?</span>
              <button onClick={() => onVehicleDelete(vehicle.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-600">No</button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">

        {/* ── Listing ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Listing</p>
            {vehicle.listing ? (
              <button onClick={unlinkListing} className="text-xs text-gray-400 hover:text-red-500">Unlink</button>
            ) : (
              <button onClick={() => setShowListingSearch(v => !v)} className="text-xs px-2.5 py-1 bg-forest-600 text-white rounded-lg hover:bg-forest-700">
                {showListingSearch ? 'Cancel' : 'Link a Listing'}
              </button>
            )}
          </div>
          {vehicle.listing ? (
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
              {vehicle.listing.photos?.[0] && <img src={vehicle.listing.photos[0]} alt="" className="w-20 h-14 object-cover rounded shrink-0" />}
              <div className="text-xs">
                <p className="font-semibold text-gray-800">{vehicle.listing.model_year} {vehicle.listing.model_name}</p>
                <p className="text-gray-500">{[vehicle.listing.grade, vehicle.listing.chassis_code].filter(Boolean).join(' · ')}</p>
                {vehicle.listing.mileage_km && <p className="text-gray-500">{vehicle.listing.mileage_km.toLocaleString()} km</p>}
                {vehicle.listing.start_price_jpy && <p className="text-gray-500">{fmtJpy(vehicle.listing.start_price_jpy)} start</p>}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">No listing linked — vehicle still being searched.</p>
          )}
          {showListingSearch && (
            <div className="mt-2 relative">
              <input type="text" value={listingQuery} onChange={e => searchListings(e.target.value)} placeholder="Search by model, chassis, bid no…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" autoFocus />
              {listingResults.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
                  {listingResults.map(l => (
                    <button key={l.id} type="button" onClick={() => linkListing(l)} disabled={linkingListing} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 disabled:opacity-50">
                      {l.photos?.[0] && <img src={l.photos[0]} alt="" className="w-12 h-8 object-cover rounded shrink-0" />}
                      <div>
                        <p className="font-medium">{l.model_year} {l.model_name}</p>
                        <p className="text-xs text-gray-400">{[l.grade, l.chassis_code, l.bid_no].filter(Boolean).join(' · ')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-1 text-right">
                <Link href="/admin/listings" target="_blank" className="text-xs text-forest-600 hover:underline">Browse all listings →</Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Target Preferences ── */}
        {!vehicle.listing && (
          <div>
            <button onClick={() => setShowTargetPrefs(v => !v)} className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 hover:text-gray-800">
              Target Preferences <span className="text-gray-400 font-normal normal-case">{showTargetPrefs ? '▲' : '▼'}</span>
            </button>
            {showTargetPrefs && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="block text-xs text-gray-500 mb-1">Min Year</label><input type="number" value={prefs.min_year ?? ''} onChange={e => setPrefs(p => ({ ...p, min_year: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" placeholder="2020" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Max Year</label><input type="number" value={prefs.max_year ?? ''} onChange={e => setPrefs(p => ({ ...p, max_year: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Max Budget</label><div className="relative"><span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span><input type="number" value={prefs.max_budget_aud ?? ''} onChange={e => setPrefs(p => ({ ...p, max_budget_aud: e.target.value }))} className="w-full border border-gray-300 rounded-lg pl-5 pr-2 py-1.5 text-xs" /></div></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs text-gray-500 mb-1">Drive</label><select value={prefs.drive ?? ''} onChange={e => setPrefs(p => ({ ...p, drive: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"><option value="">Either</option><option value="4WD">4WD</option><option value="2WD">2WD</option></select></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Engine</label><select value={prefs.engine ?? ''} onChange={e => setPrefs(p => ({ ...p, engine: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"><option value="">Either</option><option value="diesel">Diesel</option><option value="petrol">Petrol</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs text-gray-500 mb-1">Grade</label><input type="text" value={prefs.grade ?? ''} onChange={e => setPrefs(p => ({ ...p, grade: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" placeholder="Super GL" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Colour</label><input type="text" value={prefs.colour ?? ''} onChange={e => setPrefs(p => ({ ...p, colour: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" placeholder="White or Silver" /></div>
                </div>
                <div><label className="block text-xs text-gray-500 mb-1">Notes</label><textarea value={prefs.notes ?? ''} onChange={e => setPrefs(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs resize-none" /></div>
                <button onClick={savePrefs} disabled={savingPrefs} className="text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50">{savingPrefs ? 'Saving…' : 'Save Preferences'}</button>
              </div>
            )}
          </div>
        )}

        {/* ── Build Date + Purchase Pricing ── */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Schedule & Pricing</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Build Date</label>
              <input type="date" value={buildDate} onChange={e => setBuildDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Purchase (JPY)</label>
              <div className="relative"><span className="absolute left-2 top-1.5 text-xs text-gray-400">¥</span><input type="number" value={purchaseJpy} onChange={e => setPurchaseJpy(e.target.value)} className="w-full border border-gray-300 rounded-lg pl-5 pr-2 py-1.5 text-xs" placeholder="0" /></div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Purchase (AUD)</label>
              <div className="relative"><span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span><input type="number" value={purchaseAud} onChange={e => setPurchaseAud(e.target.value)} className="w-full border border-gray-300 rounded-lg pl-5 pr-2 py-1.5 text-xs" placeholder="0" /></div>
            </div>
          </div>
          <button
            onClick={async () => { await saveBuildDate(); await savePurchasePricing() }}
            disabled={savingBuildDate || savingPurchase}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {savingBuildDate || savingPurchase ? 'Saving…' : 'Save Schedule & Pricing'}
          </button>
        </div>

        {/* ── Stage Tracker ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Stage Tracker</p>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={designApproval} onChange={e => setDesignApproval(e.target.checked)} className="w-3.5 h-3.5 text-forest-600 rounded border-gray-300" />
              <span className="text-[10px] text-gray-500">Design Approval</span>
            </label>
          </div>
          <StageTracker
            stages={stagesForVehicle}
            hasPoptop={hasPoptop}
            hasDesignApproval={designApproval}
            vehicleId={vehicle.id}
            customerId={customer.id}
            onStagesUpdate={onStagesUpdate}
            onVehicleStatusUpdate={onVehicleStatusUpdate}
          />
        </div>

        {/* ── Build Assignment ── */}
        <div>
          <button onClick={() => setShowBuild(v => !v)} className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 hover:text-gray-800 w-full text-left">
            <span>Build Assignment</span>
            {buildForVehicle && (
              <span className="text-xs font-normal normal-case text-forest-600">
                {BUILD_TYPES.find(b => b.value === buildForVehicle.build_type)?.label ?? buildForVehicle.build_type}
                {buildForVehicle.total_quoted_aud ? ` — ${centsToAud(buildForVehicle.total_quoted_aud)}` : ''}
              </span>
            )}
            <span className="text-gray-400 font-normal ml-auto">{showBuild ? '▲' : '▼'}</span>
          </button>
          {showBuild && (
            <BuildEditor vehicleId={vehicle.id} customerId={customer.id} initialBuild={buildForVehicle} products={products} onSave={onBuildSave} />
          )}
        </div>

        {/* ── Documents ── */}
        <div>
          <button onClick={() => setShowDocs(v => !v)} className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 hover:text-gray-800">
            Documents ({docsForVehicle.length}) <span className="text-gray-400 font-normal">{showDocs ? '▲' : '▼'}</span>
          </button>
          {showDocs && <DocSection docs={docsForVehicle} customerId={customer.id} vehicleId={vehicle.id} onAdded={onDocAdded} onDeleted={onDocDeleted} />}
        </div>

        {/* ── Vehicle Notes ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vehicle Notes</label>
          <textarea rows={2} value={vehicleNotes} onChange={e => setVehicleNotes(e.target.value)} placeholder="Notes about this vehicle…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest-500" />
          <button onClick={saveNotes} disabled={savingNotes} className="mt-1.5 text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">{savingNotes ? 'Saving…' : 'Save Notes'}</button>
        </div>

      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CustomerDetailClient({
  customer: initialCustomer,
  documents: initialDocs,
  products,
}: {
  customer: Customer
  documents: Document[]
  products: Product[]
}) {
  const [customer]              = useState(initialCustomer)
  const [vehicles, setVehicles] = useState(initialCustomer.customer_vehicles)
  const [docs, setDocs]         = useState(initialDocs)

  const [stagesMap, setStagesMap] = useState<Record<string, OrderStage[]>>(() => {
    const m: Record<string, OrderStage[]> = {}
    for (const v of initialCustomer.customer_vehicles) m[v.id] = v.order_stages ?? []
    return m
  })

  const [buildsMap, setBuildsMap] = useState<Record<string, Build | null>>(() => {
    const m: Record<string, Build | null> = {}
    for (const v of initialCustomer.customer_vehicles) m[v.id] = v.customer_builds?.[0] ?? null
    return m
  })

  const [showAddVehicle, setShowAddVehicle]   = useState(false)
  const [addingVehicle, setAddingVehicle]     = useState(false)
  const [addVehicleDesc, setAddVehicleDesc]   = useState('')
  const [addVehicleNotes, setAddVehicleNotes] = useState('')
  const [addBuildDate, setAddBuildDate]        = useState('')

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingVehicle(true)
    const res = await fetch(`/api/customers/${customer.id}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_description: addVehicleDesc || null, build_date: addBuildDate || null, notes: addVehicleNotes || null }),
    })
    const data = await res.json()
    setAddingVehicle(false)
    if (res.ok) {
      setVehicles(vs => [...vs, { ...data, listing: null, order_stages: [], customer_builds: [] }])
      setStagesMap(m => ({ ...m, [data.id]: [] }))
      setBuildsMap(m => ({ ...m, [data.id]: null }))
      setShowAddVehicle(false)
      setAddVehicleDesc('')
      setAddVehicleNotes('')
      setAddBuildDate('')
    }
  }

  const deleteVehicle = async (vehicleId: string) => {
    await fetch(`/api/customers/${customer.id}/vehicles/${vehicleId}`, { method: 'DELETE' })
    setVehicles(vs => vs.filter(v => v.id !== vehicleId))
    setStagesMap(m => { const n = { ...m }; delete n[vehicleId]; return n })
    setBuildsMap(m => { const n = { ...m }; delete n[vehicleId]; return n })
    setDocs(d => d.filter(doc => doc.customer_vehicle_id !== vehicleId))
  }

  const fullName     = [customer.first_name, customer.last_name].filter(Boolean).join(' ')
  const statusBadge: Record<string, string> = { active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', archived: 'bg-gray-100 text-gray-500' }
  const globalDocs   = docs.filter(d => !d.customer_vehicle_id)

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers" className="text-gray-400 hover:text-gray-600 text-sm shrink-0">← Customers</Link>
          <span className="text-gray-300">/</span>
          <div className="w-11 h-11 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-lg font-bold shrink-0">{customer.first_name[0].toUpperCase()}</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl text-forest-900 leading-tight">{fullName}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge[customer.status] ?? 'bg-gray-100 text-gray-600'}`}>{customer.status}</span>
            </div>
            <p className="text-sm text-gray-400">{[customer.email, customer.phone, customer.state].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <Link href={`/admin/customers/${customer.id}/edit`} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 shrink-0">Edit</Link>
      </div>

      {/* Notes / HubSpot */}
      {(customer.notes || customer.hubspot_contact_id) && (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 grid sm:grid-cols-2 gap-3">
          {customer.notes && <div><p className="text-xs font-semibold text-gray-500 mb-1">Notes</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p></div>}
          {customer.hubspot_contact_id && <div><p className="text-xs font-semibold text-gray-500 mb-1">HubSpot Contact ID</p><p className="text-sm text-gray-700 font-mono">{customer.hubspot_contact_id}</p></div>}
        </div>
      )}

      {/* Vehicles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 text-sm">Vehicles ({vehicles.length})</h2>
          <button onClick={() => setShowAddVehicle(v => !v)} className="text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700">+ Add Vehicle</button>
        </div>

        {showAddVehicle && (
          <form onSubmit={addVehicle} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600">New Vehicle</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
                <input type="text" value={addVehicleDesc} onChange={e => setAddVehicleDesc(e.target.value)} placeholder="e.g. 2022 Super GL 4WD Diesel" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Build Date</label>
                <input type="date" value={addBuildDate} onChange={e => setAddBuildDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
              <textarea value={addVehicleNotes} onChange={e => setAddVehicleNotes(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest-500" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={addingVehicle} className="text-xs px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50">{addingVehicle ? 'Adding…' : 'Add Vehicle'}</button>
              <button type="button" onClick={() => setShowAddVehicle(false)} className="text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        {vehicles.length === 0 && !showAddVehicle && (
          <p className="text-sm text-gray-400 text-center py-8">No vehicles yet — click &ldquo;Add Vehicle&rdquo; to start.</p>
        )}

        <div className="space-y-4">
          {vehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              customer={customer}
              stagesForVehicle={stagesMap[vehicle.id] ?? []}
              buildForVehicle={buildsMap[vehicle.id] ?? null}
              docsForVehicle={docs.filter(d => d.customer_vehicle_id === vehicle.id)}
              products={products}
              onStagesUpdate={(vid, stages) => setStagesMap(m => ({ ...m, [vid]: stages }))}
              onVehicleStatusUpdate={(vid, status) => setVehicles(vs => vs.map(v => v.id === vid ? { ...v, vehicle_status: status } : v))}
              onBuildSave={(vid, build) => setBuildsMap(m => ({ ...m, [vid]: build }))}
              onDocAdded={doc => setDocs(d => [doc, ...d])}
              onDocDeleted={docId => setDocs(d => d.filter(doc => doc.id !== docId))}
              onVehicleUpdate={updated => setVehicles(vs => vs.map(v => v.id === updated.id ? { ...v, ...updated } : v))}
              onVehicleDelete={deleteVehicle}
            />
          ))}
        </div>
      </div>

      {/* General documents */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">General Documents ({globalDocs.length})</h2>
        <DocSection docs={globalDocs} customerId={customer.id} vehicleId={null} onAdded={doc => setDocs(d => [doc, ...d])} onDeleted={docId => setDocs(d => d.filter(doc => doc.id !== docId))} />
      </div>

    </div>
  )
}
