'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Stage definitions ─────────────────────────────────────────────────────────
const ORDER_STAGES = [
  { key: 'vehicle_selection', label: 'Vehicle Selection',  short: 'Selected' },
  { key: 'deposit_received',  label: 'Deposit Received',   short: 'Deposit' },
  { key: 'sourcing',          label: 'Sourcing',           short: 'Sourcing' },
  { key: 'auction_won',       label: 'Auction Won',        short: 'Won' },
  { key: 'payment_received',  label: 'Payment Received',   short: 'Paid' },
  { key: 'export_docs',       label: 'Export Docs',        short: 'Export' },
  { key: 'shipped',           label: 'Shipped',            short: 'Shipped' },
  { key: 'arrived_au',        label: 'Arrived AU',         short: 'Arrived' },
  { key: 'compliance',        label: 'Compliance',         short: 'Comply' },
  { key: 'delivered',         label: 'Delivered',          short: 'Done' },
]

const stageIndex = (key: string) => ORDER_STAGES.findIndex(s => s.key === key)

// ── Types ─────────────────────────────────────────────────────────────────────
interface Listing {
  id: string; model_name: string; model_year: number | null; chassis_code: string | null; photos: string[]; bid_no: string | null
}
interface Vehicle {
  id: string; current_stage: string; stage_dates: Record<string, string>; admin_notes: string | null
  notes: string | null; make: string | null; model: string | null; year: number | null
  listing_id: string | null; build_id: string | null; created_at: string; listing: Listing | null
}
interface Document {
  id: string; filename: string; storage_path: string; file_type: string | null
  description: string | null; uploaded_at: string; customer_vehicle_id: string | null
}
interface Customer {
  id: string; first_name: string; last_name: string | null; email: string | null
  phone: string | null; state: string | null; notes: string | null; hubspot_id: string | null
  created_at: string; customer_vehicles: Vehicle[]
}

// ── Stage Tracker ─────────────────────────────────────────────────────────────
function StageTracker({ current, stageDates }: { current: string; stageDates: Record<string, string> }) {
  const currentIdx = stageIndex(current)
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-center min-w-max gap-0">
        {ORDER_STAGES.map((stage, i) => {
          const done    = i < currentIdx
          const active  = i === currentIdx
          const future  = i > currentIdx
          const date    = stageDates?.[stage.key]
          return (
            <div key={stage.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                    ${done   ? 'bg-forest-600 border-forest-600 text-white'       : ''}
                    ${active ? 'bg-white border-forest-600 text-forest-700 ring-2 ring-forest-200' : ''}
                    ${future ? 'bg-gray-100 border-gray-300 text-gray-400'        : ''}
                  `}
                >
                  {done ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <p className={`text-[10px] mt-1 whitespace-nowrap ${active ? 'text-forest-700 font-semibold' : done ? 'text-forest-500' : 'text-gray-400'}`}>
                  {stage.short}
                </p>
                {date && <p className="text-[9px] text-gray-400">{new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>}
              </div>
              {i < ORDER_STAGES.length - 1 && (
                <div className={`h-0.5 w-8 mx-0.5 mb-5 ${i < currentIdx ? 'bg-forest-600' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CustomerDetailClient({
  customer: initialCustomer,
  documents: initialDocs,
}: {
  customer: Customer
  documents: Document[]
}) {
  const [customer, setCustomer]       = useState(initialCustomer)
  const [docs, setDocs]               = useState(initialDocs)
  const [vehicles, setVehicles]       = useState(initialCustomer.customer_vehicles)
  const [updatingStage, setUpdating]  = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState<string | null>(null)
  const [vehicleNotes, setVehicleNotes] = useState<Record<string, string>>({})
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [addingVehicle, setAddingVehicle]   = useState(false)
  const [uploadingDoc, setUploadingDoc]     = useState(false)
  const [listingSearch, setListingSearch]   = useState('')
  const [listingResults, setListingResults] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [addVehicleForm, setAddVehicleForm]   = useState({ make: '', model: '', year: '', notes: '' })
  const [confirmDelete, setConfirmDelete]     = useState<string | null>(null)

  // ── Stage advance ──────────────────────────────────────────────────────────
  const advanceStage = async (vehicleId: string, direction: 1 | -1) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (!vehicle) return
    const idx = stageIndex(vehicle.current_stage)
    const next = ORDER_STAGES[idx + direction]
    if (!next) return

    setUpdating(vehicleId)
    const today = new Date().toISOString().split('T')[0]
    const newDates = direction === 1
      ? { ...vehicle.stage_dates, [next.key]: today }
      : vehicle.stage_dates

    const res = await fetch(`/api/customers/${customer.id}/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_stage: next.key, stage_dates: newDates }),
    })
    const updated = await res.json()
    setUpdating(null)
    if (res.ok) {
      setVehicles(vs => vs.map(v => v.id === vehicleId ? { ...v, ...updated, listing: v.listing } : v))
    }
  }

  // ── Save vehicle notes ─────────────────────────────────────────────────────
  const saveVehicleNotes = async (vehicleId: string) => {
    setSavingNotes(vehicleId)
    const noteText = vehicleNotes[vehicleId] ?? vehicles.find(v => v.id === vehicleId)?.admin_notes ?? ''
    await fetch(`/api/customers/${customer.id}/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: noteText }),
    })
    setSavingNotes(null)
    setVehicles(vs => vs.map(v => v.id === vehicleId ? { ...v, admin_notes: noteText } : v))
  }

  // ── Listing search ─────────────────────────────────────────────────────────
  const searchListings = async (q: string) => {
    setListingSearch(q)
    if (q.length < 2) { setListingResults([]); return }
    const res = await fetch(`/api/listings/search?q=${encodeURIComponent(q)}`)
    if (res.ok) setListingResults(await res.json())
  }

  // ── Add vehicle ────────────────────────────────────────────────────────────
  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingVehicle(true)
    const res = await fetch(`/api/customers/${customer.id}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: selectedListing?.id ?? null,
        make:  selectedListing ? null : addVehicleForm.make,
        model: selectedListing ? selectedListing.model_name : addVehicleForm.model,
        year:  selectedListing ? selectedListing.model_year : addVehicleForm.year,
        notes: addVehicleForm.notes,
      }),
    })
    const data = await res.json()
    setAddingVehicle(false)
    if (res.ok) {
      setVehicles(vs => [...vs, { ...data, listing: selectedListing }])
      setShowAddVehicle(false)
      setSelectedListing(null)
      setListingSearch('')
      setListingResults([])
      setAddVehicleForm({ make: '', model: '', year: '', notes: '' })
    }
  }

  // ── Delete vehicle ─────────────────────────────────────────────────────────
  const deleteVehicle = async (vehicleId: string) => {
    await fetch(`/api/customers/${customer.id}/vehicles/${vehicleId}`, { method: 'DELETE' })
    setVehicles(vs => vs.filter(v => v.id !== vehicleId))
    setConfirmDelete(null)
  }

  // ── Upload document ────────────────────────────────────────────────────────
  const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/customers/${customer.id}/documents`, { method: 'POST', body: fd })
    const data = await res.json()
    setUploadingDoc(false)
    if (res.ok) setDocs(d => [data, ...d])
    e.target.value = ''
  }

  const deleteDoc = async (docId: string) => {
    await fetch(`/api/customers/${customer.id}/documents?docId=${docId}`, { method: 'DELETE' })
    setDocs(d => d.filter(doc => doc.id !== docId))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ')

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers" className="text-gray-400 hover:text-gray-600 text-sm">← Customers</Link>
          <span className="text-gray-300">/</span>
          <div className="w-10 h-10 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center text-base font-bold">
            {customer.first_name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-xl text-forest-900 leading-tight">{fullName}</h1>
            <p className="text-sm text-gray-400">
              {[customer.email, customer.phone, customer.state].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <Link href={`/admin/customers/${customer.id}/edit`} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
          Edit
        </Link>
      </div>

      {/* Info card */}
      {(customer.notes || customer.hubspot_id) && (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 grid sm:grid-cols-2 gap-3">
          {customer.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
          {customer.hubspot_id && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">HubSpot ID</p>
              <p className="text-sm text-gray-700 font-mono">{customer.hubspot_id}</p>
            </div>
          )}
        </div>
      )}

      {/* Vehicles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 text-sm">Vehicles ({vehicles.length})</h2>
          <button
            onClick={() => setShowAddVehicle(v => !v)}
            className="text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700"
          >
            + Add Vehicle
          </button>
        </div>

        {/* Add vehicle form */}
        {showAddVehicle && (
          <form onSubmit={addVehicle} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600">Link a listing or enter manually</p>

            {/* Listing search */}
            <div className="relative">
              <input
                type="text"
                value={selectedListing ? `${selectedListing.model_year ?? ''} ${selectedListing.model_name}` : listingSearch}
                onChange={e => { setSelectedListing(null); searchListings(e.target.value) }}
                placeholder="Search listings by model, chassis, bid no…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
              {selectedListing && (
                <button type="button" onClick={() => { setSelectedListing(null); setListingSearch('') }} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
              )}
              {listingResults.length > 0 && !selectedListing && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {listingResults.map(l => (
                    <button
                      key={l.id} type="button"
                      onClick={() => { setSelectedListing(l); setListingSearch(''); setListingResults([]) }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                    >
                      {l.photos?.[0] && <img src={l.photos[0]} alt="" className="w-10 h-7 object-cover rounded shrink-0" />}
                      <div>
                        <span className="font-medium">{l.model_year} {l.model_name}</span>
                        <span className="text-gray-400 ml-2 text-xs">{l.chassis_code} {l.bid_no}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!selectedListing && (
              <div className="grid grid-cols-3 gap-2">
                <input name="make" value={addVehicleForm.make} onChange={e => setAddVehicleForm(f => ({ ...f, make: e.target.value }))} placeholder="Make" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input name="model" value={addVehicleForm.model} onChange={e => setAddVehicleForm(f => ({ ...f, model: e.target.value }))} placeholder="Model" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input name="year" type="number" value={addVehicleForm.year} onChange={e => setAddVehicleForm(f => ({ ...f, year: e.target.value }))} placeholder="Year" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}

            <textarea
              value={addVehicleForm.notes}
              onChange={e => setAddVehicleForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />

            <div className="flex gap-2">
              <button type="submit" disabled={addingVehicle} className="text-xs px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50">
                {addingVehicle ? 'Adding…' : 'Add Vehicle'}
              </button>
              <button type="button" onClick={() => setShowAddVehicle(false)} className="text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {vehicles.length === 0 && !showAddVehicle && (
          <p className="text-sm text-gray-400 text-center py-8">No vehicles yet.</p>
        )}

        <div className="space-y-4">
          {vehicles.map(vehicle => {
            const vehicleLabel = vehicle.listing
              ? `${vehicle.listing.model_year ?? ''} ${vehicle.listing.model_name}`
              : [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle'
            const currentIdx = stageIndex(vehicle.current_stage)
            const canAdvance = currentIdx < ORDER_STAGES.length - 1
            const canGoBack  = currentIdx > 0

            return (
              <div key={vehicle.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {vehicle.listing?.photos?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={vehicle.listing.photos[0]} alt="" className="w-14 h-9 object-cover rounded shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{vehicleLabel}</p>
                      {vehicle.listing && (
                        <p className="text-xs text-gray-400">
                          {[vehicle.listing.chassis_code, vehicle.listing.bid_no].filter(Boolean).join(' · ')}
                          {' '}
                          <Link href={`/van/${vehicle.listing.id}`} target="_blank" className="text-forest-600 hover:underline">
                            View listing →
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                  {confirmDelete === vehicle.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">Remove vehicle?</span>
                      <button onClick={() => deleteVehicle(vehicle.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded">Yes</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-600">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(vehicle.id)} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                  )}
                </div>

                <div className="px-4 py-4 space-y-4">
                  {/* Stage tracker */}
                  <StageTracker current={vehicle.current_stage} stageDates={vehicle.stage_dates ?? {}} />

                  {/* Stage controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => advanceStage(vehicle.id, -1)}
                      disabled={!canGoBack || updatingStage === vehicle.id}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      ← Back
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-xs font-semibold text-forest-700">
                        {ORDER_STAGES[currentIdx]?.label ?? vehicle.current_stage}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">({currentIdx + 1}/{ORDER_STAGES.length})</span>
                    </div>
                    <button
                      onClick={() => advanceStage(vehicle.id, 1)}
                      disabled={!canAdvance || updatingStage === vehicle.id}
                      className="text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-40"
                    >
                      {updatingStage === vehicle.id ? '…' : 'Advance →'}
                    </button>
                  </div>

                  {/* Admin notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Admin Notes</label>
                    <textarea
                      rows={2}
                      value={vehicleNotes[vehicle.id] ?? vehicle.admin_notes ?? ''}
                      onChange={e => setVehicleNotes(n => ({ ...n, [vehicle.id]: e.target.value }))}
                      placeholder="Internal notes about this vehicle…"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    />
                    <button
                      onClick={() => saveVehicleNotes(vehicle.id)}
                      disabled={savingNotes === vehicle.id}
                      className="mt-1.5 text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50"
                    >
                      {savingNotes === vehicle.id ? 'Saving…' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 text-sm">Documents ({docs.length})</h2>
          <label className={`text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer ${uploadingDoc ? 'opacity-50' : ''}`}>
            {uploadingDoc ? 'Uploading…' : '+ Upload'}
            <input type="file" className="hidden" onChange={uploadDoc} disabled={uploadingDoc} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          </label>
        </div>

        {docs.length === 0 ? (
          <p className="text-sm text-gray-400">No documents yet.</p>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{doc.file_type === 'pdf' ? '📄' : '🖼️'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.filename}</p>
                    {doc.description && <p className="text-xs text-gray-400">{doc.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs text-gray-400">
                    {new Date(doc.uploaded_at).toLocaleDateString('en-AU')}
                  </span>
                  <button onClick={() => deleteDoc(doc.id)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
