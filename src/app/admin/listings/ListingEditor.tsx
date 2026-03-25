'use client'

import { useState } from 'react'
import { centsToAud, sourceLabel } from '@/lib/utils'
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
  source: string
  status: string
  au_status: string
  location_status: string
  fit_out_level: string
  vehicle_model: string
  conversion_video_url: string
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
    source: l.source,
    status: l.status,
    au_status: l.au_status ?? '',
    location_status: l.location_status ?? '',
    fit_out_level: l.fit_out_level ?? '',
    vehicle_model: l.vehicle_model ?? '',
    conversion_video_url: l.conversion_video_url ?? '',
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
  }
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-ocean bg-white'

// Try to upgrade a Goo-net / Car Sensor thumbnail URL to the largest available version
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
  onSet: (field: keyof EditState, value: string | boolean | string[]) => void
  onSetNewPhotoUrl: (v: string) => void
  onAddPhoto: () => void
  onRemovePhoto: (i: number) => void
  onMovePhoto: (from: number, to: number) => void
  onClearPhotos: () => void
  onUploadPhoto: (url: string) => void
  newInteriorPhotoUrl: string
  onSetNewInteriorPhotoUrl: (v: string) => void
  onAddInteriorPhoto: () => void
  onRemoveInteriorPhoto: (i: number) => void
  onUploadInteriorPhoto: (url: string) => void
}

function ListingRow({
  listing: l, isEditing, isSaved, isSelected, isTranslating, editState, saving, error,
  newPhotoUrl, onToggleSelect, onStartEdit, onCancelEdit, onSave, onDelete, onRetranslate, onSet,
  onSetNewPhotoUrl, onAddPhoto, onRemovePhoto, onMovePhoto, onClearPhotos, onUploadPhoto,
  newInteriorPhotoUrl, onSetNewInteriorPhotoUrl, onAddInteriorPhoto, onRemoveInteriorPhoto, onUploadInteriorPhoto,
}: RowProps) {
  const price = l.source === 'au_stock' && l.au_price_aud
    ? centsToAud(l.au_price_aud)
    : l.aud_estimate ? `~${centsToAud(l.aud_estimate)}`
    : l.start_price_jpy ? `¥${l.start_price_jpy.toLocaleString()}`
    : '—'

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
            </div>

            {/* Right — pricing + flags */}
            <div className="space-y-3">
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
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    {i > 0 && (
                      <button onClick={() => onMovePhoto(i, i - 1)} className="text-white text-xs bg-black/60 rounded px-1 py-0.5">←</button>
                    )}
                    <button onClick={() => onRemovePhoto(i)} className="text-white text-xs bg-red-600/80 rounded px-1.5 py-0.5">✕</button>
                    {i < editState.photos.length - 1 && (
                      <button onClick={() => onMovePhoto(i, i + 1)} className="text-white text-xs bg-black/60 rounded px-1 py-0.5">→</button>
                    )}
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
              <PhotoUploadButton onUploaded={onUploadPhoto} />
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
            <button onClick={onSave} disabled={saving} className="btn-primary btn-sm disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={onCancelEdit} className="btn-secondary btn-sm">Cancel</button>
            <button
              onClick={onRetranslate}
              disabled={isTranslating}
              className="text-sm px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 ml-auto"
            >
              {isTranslating ? 'Translating…' : '🌐 Re-translate with AI'}
            </button>
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
              disabled={saving}
              className="flex-1 py-3 bg-green-800 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  Saving…
                </>
              ) : 'Save Changes'}
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

  const set = (field: keyof EditState, value: string | boolean | string[]) =>
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
        source: editState.source,
        status: editState.status,
        au_status: editState.au_status || null,
        location_status: editState.location_status || null,
        fit_out_level: editState.fit_out_level || null,
        vehicle_model: editState.vehicle_model || null,
        conversion_video_url: editState.conversion_video_url || null,
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
