'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Partner {
  id: string
  name: string
  commission_aud: number | null
  commission_type: string | null
}

export default function AddPartnerListingClient({ partner }: { partner: Partner }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    model_name: 'Toyota Hiace',
    model_year: '',
    body_type: '',
    mileage_km: '',
    transmission: 'AT',
    drive: '2WD',
    colour: '',
    price_aud: '',
    description: '',
    source_url: '',
    vin: '',
    stock_number: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function uploadPhoto(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      setPhotos(p => [...p, url])
    } catch (err) {
      alert('Upload failed: ' + String(err))
    } finally { setUploading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.model_name) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          model_year: form.model_year ? parseInt(form.model_year) : null,
          mileage_km: form.mileage_km ? parseInt(form.mileage_km) : null,
          price_aud: form.price_aud ? parseFloat(form.price_aud) : null,
          photos,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const { id } = await res.json()
      router.push(`/admin/listings?id=${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Add Partner Vehicle</h1>
        <p className="text-gray-500 text-sm mt-1">
          New listing tied to <strong className="text-charcoal">{partner.name}</strong>
          {partner.commission_aud ? ` · $${partner.commission_aud.toLocaleString('en-AU')} ${partner.commission_type}` : ''}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Model name *</label>
            <input required value={form.model_name} onChange={e => set('model_name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
            <input type="number" value={form.model_year} onChange={e => set('model_year', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Body type</label>
            <select value={form.body_type} onChange={e => set('body_type', e.target.value)} className={inputCls}>
              <option value="">—</option>
              <option value="MWB">MWB</option>
              <option value="LWB">LWB</option>
              <option value="SLWB">SLWB</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Colour</label>
            <input value={form.colour} onChange={e => set('colour', e.target.value)} className={inputCls} placeholder="White" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mileage (km)</label>
            <input type="number" value={form.mileage_km} onChange={e => set('mileage_km', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Asking price (AUD)</label>
            <input type="number" step="0.01" value={form.price_aud} onChange={e => set('price_aud', e.target.value)} className={inputCls} placeholder="61900" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Transmission</label>
            <select value={form.transmission} onChange={e => set('transmission', e.target.value)} className={inputCls}>
              <option value="AT">Automatic</option>
              <option value="MT">Manual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Drive</label>
            <select value={form.drive} onChange={e => set('drive', e.target.value)} className={inputCls}>
              <option value="2WD">2WD</option>
              <option value="4WD">4WD</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">VIN</label>
            <input value={form.vin} onChange={e => set('vin', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Stock # (partner&apos;s ref)</label>
            <input value={form.stock_number} onChange={e => set('stock_number', e.target.value)} className={inputCls} placeholder="1788" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Source URL (partner&apos;s listing page)</label>
          <input value={form.source_url} onChange={e => set('source_url', e.target.value)} className={inputCls} placeholder="https://www.accars.com.au/our-stock/..." />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
          <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} placeholder="Features, condition, what's included..." />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Photos</label>
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <div key={url} className="relative w-24 h-20 rounded-lg overflow-hidden border border-gray-200">
                <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                <button type="button" onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-24 h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-ocean/40 hover:text-ocean text-xs">
              {uploading ? 'Uploading…' : '+ Add'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }} />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50">
          {saving ? 'Saving…' : 'Create Listing'}
        </button>
      </form>
    </div>
  )
}
