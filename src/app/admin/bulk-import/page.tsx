'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'

interface DraftListing {
  id: string
  filename: string
  pdfUrl: string
  // Editable fields
  model_name: string
  grade: string
  chassis_code: string
  model_year: string
  body_colour: string
  mileage_km: string
  transmission: string
  drive: string
  displacement_cc: string
  inspection_score: string
  start_price_jpy: string
  bid_no: string
  kaijo_code: string
  auction_date: string
  auction_time: string
  saving: boolean
  saved: boolean
  error: string
}

const INSPECTION_SCORES = ['S', '6', '5.5', '5', '4.5', '4', '3.5', '3', 'R', 'RA', 'X']

export default function BulkImportPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [drafts, setDrafts] = useState<DraftListing[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    createSupabaseBrowser().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const handleUpload = async (files: FileList) => {
    setUploadError('')
    setUploading(true)
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    let errorCount = 0

    for (const file of pdfFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        if (userId) formData.append('added_by', userId)
        formData.append('added_by_role', 'admin')

        const res = await fetch('/api/listings/extract-pdf', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')

        const newDrafts: DraftListing[] = data.listings.map((l: { id: string; filename: string; pdfUrl: string }) => ({
          id: l.id,
          filename: l.filename,
          pdfUrl: l.pdfUrl,
          model_name: '',
          grade: '',
          chassis_code: '',
          model_year: '',
          body_colour: '',
          mileage_km: '',
          transmission: '',
          drive: '',
          displacement_cc: '',
          inspection_score: '',
          start_price_jpy: '',
          bid_no: '',
          kaijo_code: '',
          auction_date: '',
          auction_time: '',
          saving: false,
          saved: false,
          error: '',
        }))

        setDrafts(prev => [...prev, ...newDrafts])
      } catch (e) {
        console.error(`Failed to upload ${file.name}:`, e)
        errorCount++
      }
    }

    if (errorCount > 0) {
      setUploadError(`${errorCount} of ${pdfFiles.length} files failed to upload.`)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const updateDraft = useCallback((id: string, field: string, value: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }, [])

  const saveDraft = async (draft: DraftListing) => {
    setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, saving: true, error: '' } : d))
    try {
      const payload: Record<string, unknown> = {
        status: 'live',
      }
      if (draft.model_name) payload.model_name = draft.model_name
      if (draft.grade) payload.grade = draft.grade
      if (draft.chassis_code) payload.chassis_code = draft.chassis_code
      if (draft.model_year) payload.model_year = parseInt(draft.model_year)
      if (draft.body_colour) payload.body_colour = draft.body_colour
      if (draft.mileage_km) payload.mileage_km = parseInt(draft.mileage_km)
      if (draft.transmission) payload.transmission = draft.transmission
      if (draft.drive) payload.drive = draft.drive
      if (draft.displacement_cc) payload.displacement_cc = parseInt(draft.displacement_cc)
      if (draft.inspection_score) payload.inspection_score = draft.inspection_score
      if (draft.start_price_jpy) payload.start_price_jpy = parseInt(draft.start_price_jpy)
      if (draft.bid_no) payload.bid_no = draft.bid_no
      if (draft.kaijo_code) payload.kaijo_code = draft.kaijo_code
      if (draft.auction_date) payload.auction_date = draft.auction_date
      if (draft.auction_date && draft.auction_time) {
        payload.auction_time = new Date(`${draft.auction_date}T${draft.auction_time}:00+09:00`).toISOString()
      }

      const res = await fetch(`/api/listings/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }

      setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, saving: false, saved: true } : d))
    } catch (e) {
      setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, saving: false, error: String(e) } : d))
    }
  }

  const removeDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="max-w-[1800px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import — Auction Sheets</h1>
          <p className="text-gray-500 mt-1">
            Upload multiple auction sheet PDFs. View each PDF alongside the form and fill in the details.
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/listings')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to listings
        </button>
      </div>

      {/* Upload area */}
      <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-ocean/50 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files?.length) handleUpload(e.target.files) }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-8 py-4 bg-ocean text-white font-semibold rounded-lg hover:bg-ocean/90 disabled:opacity-50 transition-colors text-lg"
        >
          {uploading ? 'Uploading…' : '📄 Upload Auction Sheet PDFs'}
        </button>
        <p className="text-sm text-gray-400 mt-2">Select multiple PDFs at once. Max 20MB each.</p>
        {uploadError && <p className="text-red-600 text-sm mt-2">{uploadError}</p>}
      </div>

      {drafts.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          {drafts.length} sheet{drafts.length !== 1 ? 's' : ''} uploaded — fill in the details below. Each saves independently.
        </p>
      )}

      {/* Grid of PDF + form pairs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-6">
        {drafts.map(draft => (
          <div
            key={draft.id}
            className={`border rounded-xl overflow-hidden ${draft.saved ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}
          >
            {/* Header */}
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">{draft.filename}</span>
              <div className="flex items-center gap-2">
                {draft.saved && <span className="text-xs text-green-700 font-medium">✅ Saved</span>}
                <button
                  onClick={() => removeDraft(draft.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row" style={{ height: '600px' }}>
              {/* PDF viewer */}
              <div className="lg:w-1/2 h-full bg-gray-100 border-r">
                <object
                  data={draft.pdfUrl}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
                    <p className="text-sm text-gray-500">PDF preview not supported in this browser.</p>
                    <a href={draft.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 bg-ocean text-white text-sm rounded-lg hover:bg-ocean/90">
                      Open PDF in new tab
                    </a>
                  </div>
                </object>
              </div>

              {/* Form fields */}
              <div className="lg:w-1/2 h-full overflow-y-auto p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">

                  {/* ── Auction Info (top — fill first) ── */}
                  <div className="col-span-2 bg-amber-50 rounded-lg p-3 -mx-0.5">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Auction Info</p>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Bid / Lot No.">
                        <input className={inputCls} value={draft.bid_no}
                          onChange={e => updateDraft(draft.id, 'bid_no', e.target.value)} placeholder="Y3502K01" />
                      </FormField>
                      <FormField label="Auction Site">
                        <input className={inputCls} value={draft.kaijo_code}
                          onChange={e => updateDraft(draft.id, 'kaijo_code', e.target.value)} placeholder="e.g. Tokyo" />
                      </FormField>
                      <FormField label="Auction Date">
                        <input className={inputCls} type="date" value={draft.auction_date}
                          onChange={e => updateDraft(draft.id, 'auction_date', e.target.value)} />
                      </FormField>
                      <FormField label="Auction Time (JST)">
                        <input className={inputCls} type="time" value={draft.auction_time}
                          onChange={e => updateDraft(draft.id, 'auction_time', e.target.value)} />
                      </FormField>
                    </div>
                  </div>

                  {/* ── Vehicle Details ── */}
                  <FormField label="Model Name" colSpan={2}>
                    <input className={inputCls} value={draft.model_name}
                      onChange={e => updateDraft(draft.id, 'model_name', e.target.value)} placeholder="e.g. TOYOTA HIACE VAN 5D 4WD DX" />
                  </FormField>
                  <FormField label="Grade">
                    <input className={inputCls} value={draft.grade}
                      onChange={e => updateDraft(draft.id, 'grade', e.target.value)} placeholder="e.g. DX GL Package" />
                  </FormField>
                  <FormField label="Chassis Code">
                    <input className={inputCls} value={draft.chassis_code}
                      onChange={e => updateDraft(draft.id, 'chassis_code', e.target.value)} placeholder="e.g. GDH206V" />
                  </FormField>
                  <FormField label="Year">
                    <input className={inputCls} type="number" value={draft.model_year}
                      onChange={e => updateDraft(draft.id, 'model_year', e.target.value)} placeholder="2023" />
                  </FormField>
                  <FormField label="Mileage (km)">
                    <input className={inputCls} type="number" value={draft.mileage_km}
                      onChange={e => updateDraft(draft.id, 'mileage_km', e.target.value)} placeholder="16000" />
                  </FormField>
                  <FormField label="Colour">
                    <input className={inputCls} value={draft.body_colour}
                      onChange={e => updateDraft(draft.id, 'body_colour', e.target.value)} placeholder="White" />
                  </FormField>
                  <FormField label="Inspection">
                    <select className={inputCls} value={draft.inspection_score}
                      onChange={e => updateDraft(draft.id, 'inspection_score', e.target.value)}>
                      <option value="">--</option>
                      {INSPECTION_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Transmission">
                    <select className={inputCls} value={draft.transmission}
                      onChange={e => updateDraft(draft.id, 'transmission', e.target.value)}>
                      <option value="">--</option>
                      <option value="IA">IA (CVT)</option>
                      <option value="AT">AT (Auto)</option>
                      <option value="MT">MT (Manual)</option>
                    </select>
                  </FormField>
                  <FormField label="Drive">
                    <select className={inputCls} value={draft.drive}
                      onChange={e => updateDraft(draft.id, 'drive', e.target.value)}>
                      <option value="">--</option>
                      <option value="2WD">2WD</option>
                      <option value="4WD">4WD</option>
                    </select>
                  </FormField>
                  <FormField label="Engine (cc)">
                    <input className={inputCls} type="number" value={draft.displacement_cc}
                      onChange={e => updateDraft(draft.id, 'displacement_cc', e.target.value)} placeholder="2800" />
                  </FormField>
                  <FormField label="Start Price (¥)">
                    <input className={inputCls} type="number" value={draft.start_price_jpy}
                      onChange={e => updateDraft(draft.id, 'start_price_jpy', e.target.value)} placeholder="2800000" />
                  </FormField>
                </div>

                {draft.error && <p className="text-red-600 text-xs">{draft.error}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => saveDraft(draft)}
                    disabled={draft.saving || draft.saved}
                    className="flex-1 py-2 bg-green-800 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {draft.saving ? 'Saving…' : draft.saved ? 'Saved ✓' : 'Save & Publish'}
                  </button>
                  <a
                    href={draft.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50"
                  >
                    Open PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {drafts.length > 0 && drafts.every(d => d.saved) && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-green-800 font-medium">All sheets saved!</p>
          <button
            onClick={() => router.push('/admin/listings')}
            className="mt-2 text-sm text-ocean underline"
          >
            Go to listings →
          </button>
        </div>
      )}
    </div>
  )
}

function FormField({ label, children, colSpan }: { label: string; children: React.ReactNode; colSpan?: number }) {
  return (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-ocean focus:border-transparent'
