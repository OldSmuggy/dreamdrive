'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'

const AUCTION_SITES = [
  { code: 'TK', name: 'Tokyo' },
  { code: 'YK', name: 'Yokohama' },
  { code: 'NG', name: 'Nagoya' },
  { code: 'OS', name: 'Osaka' },
  { code: 'KB', name: 'Kobe' },
  { code: 'HA', name: 'HAA Kobe' },
  { code: 'SP', name: 'Sapporo' },
  { code: 'TH', name: 'Tohoku' },
  { code: 'NT', name: 'Niigata' },
  { code: 'KF', name: 'Fukuoka' },
  { code: 'KG', name: 'Kyushu' },
]

const GRADES = [
  'SUPER GL', 'LONG SUPER GL', 'LONG WIDE SUPER GL',
  'LONG SUPER GL PRIME SELECTION', 'LONG SUPER GL-E',
  'DX', 'LONG DX', 'LONG DX GL PACKAGE',
  'DX GL PACKAGE', 'DX B PACKAGE',
  'SUPER LONG DX', 'SUPER LONG DX GL PACKAGE',
  'OTHER',
]

const INSPECTION_SCORES = ['S', '6', '5.5', '5', '4.5', '4', '3.5', '3', 'R', 'RA', 'X']

const SOURCES = [
  { value: 'auction', label: 'Auction' },
  { value: 'dealer_carsensor', label: 'Dealer (Car Sensor)' },
  { value: 'dealer_goonet', label: 'Dealer (Goo-Net)' },
  { value: 'private', label: 'Private Sale' },
]

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function AgentAddListingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')

  // Photo upload state
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoUploadError, setPhotoUploadError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    source: 'auction',
    model_name: 'TOYOTA HIACE VAN',
    grade: 'LONG SUPER GL',
    chassis_code: '',
    model_year: '',
    body_colour: '',
    transmission: 'IA',
    drive: '2WD',
    displacement_cc: '',
    mileage_km: '',
    inspection_score: '',
    start_price_jpy: '',
    buy_price_jpy: '',
    aud_estimate: '',
    auction_date: '',
    auction_time: '',
    kaijo_code: '',
    auction_count: '',
    bid_no: '',
    description: '',
    photos: '',
  })

  // Load customers for assignment
  useEffect(() => {
    fetch('/api/agent/customers')
      .then(r => r.json())
      .then(d => setCustomers(d.customers ?? []))
      .catch(() => {})
  }, [])

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const getAllPhotos = () => {
    const typed = form.photos.split(/[\n,]/).map(u => u.trim()).filter(Boolean)
    return [...photoUrls, ...typed]
  }

  const handlePhotoUpload = async (files: FileList) => {
    setPhotoUploadError('')
    setPhotoUploading(true)
    const supabase = createSupabaseBrowser()
    const newUrls: string[] = []
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('site-assets')
          .upload(path, file, { upsert: false, contentType: file.type })
        if (uploadErr) throw new Error(uploadErr.message)
        const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(path)
        newUrls.push(publicUrl)
      }
      setPhotoUrls(prev => [...prev, ...newUrls])
    } catch (e) {
      setPhotoUploadError(String(e))
    } finally {
      setPhotoUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const removeUploadedPhoto = (url: string) => {
    setPhotoUrls(prev => prev.filter(u => u !== url))
  }

  const handleSubmit = async () => {
    setError('')
    setSaving(true)
    try {
      const allPhotos = getAllPhotos()
      const res = await fetch('/api/agent/add-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photos: allPhotos.join('\n'),
          assign_customer_id: selectedCustomer || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setSuccess(true)
      setTimeout(() => router.push('/agent'), 1500)
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  const isAuction = form.source === 'auction'
  const isDealer = form.source === 'dealer_carsensor' || form.source === 'dealer_goonet'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add Vehicle</h1>
        <p className="text-gray-500 mt-1">Add a vehicle from auction, dealer, or private sale</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">
          Vehicle saved! Redirecting to dashboard...
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-8">

        {/* SOURCE */}
        <Section title="Source">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SOURCES.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('source', opt.value)}
                className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  form.source === opt.value
                    ? 'border-green-700 bg-green-50 text-green-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        {/* ASSIGN TO CUSTOMER */}
        {customers.length > 0 && (
          <Section title="Assign to Customer (Optional)">
            <select
              className={inputCls}
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
            >
              <option value="">— No customer (general listing) —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.email})
                </option>
              ))}
            </select>
          </Section>
        )}

        {/* VEHICLE DETAILS */}
        <Section title="Vehicle Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Model Name *">
              <input className={inputCls} value={form.model_name} onChange={e => set('model_name', e.target.value)} placeholder="e.g. TOYOTA HIACE VAN" />
            </Field>
            <Field label="Grade">
              <select className={inputCls} value={form.grade} onChange={e => set('grade', e.target.value)}>
                <option value="">— select —</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Chassis Code">
              <input className={inputCls} value={form.chassis_code} onChange={e => set('chassis_code', e.target.value)} placeholder="e.g. GDH211K" />
            </Field>
            <Field label="Model Year">
              <input className={inputCls} type="number" value={form.model_year} onChange={e => set('model_year', e.target.value)} placeholder="e.g. 2023" min="2000" max="2030" />
            </Field>
            <Field label="Body Colour">
              <input className={inputCls} value={form.body_colour} onChange={e => set('body_colour', e.target.value)} placeholder="e.g. White, Black, Khaki" />
            </Field>
            <Field label="Inspection Score">
              <select className={inputCls} value={form.inspection_score} onChange={e => set('inspection_score', e.target.value)}>
                <option value="">— select —</option>
                {INSPECTION_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Transmission">
              <select className={inputCls} value={form.transmission} onChange={e => set('transmission', e.target.value)}>
                <option value="IA">IA (CVT)</option>
                <option value="AT">AT (Auto)</option>
                <option value="MT">MT (Manual)</option>
              </select>
            </Field>
            <Field label="Drive">
              <select className={inputCls} value={form.drive} onChange={e => set('drive', e.target.value)}>
                <option value="2WD">2WD</option>
                <option value="4WD">4WD</option>
              </select>
            </Field>
            <Field label="Displacement (cc)">
              <input className={inputCls} type="number" value={form.displacement_cc} onChange={e => set('displacement_cc', e.target.value)} placeholder="e.g. 2800" />
            </Field>
            <Field label="Mileage (km)">
              <input className={inputCls} type="number" value={form.mileage_km} onChange={e => set('mileage_km', e.target.value)} placeholder="e.g. 45000" />
            </Field>
          </div>
        </Section>

        {/* PRICING */}
        <Section title="Pricing">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isAuction && (
              <Field label="Start Price (JPY)">
                <input className={inputCls} type="number" value={form.start_price_jpy} onChange={e => set('start_price_jpy', e.target.value)} placeholder="e.g. 2800000" />
              </Field>
            )}
            {(isDealer || form.source === 'private') && (
              <Field label="Asking Price (JPY)">
                <input className={inputCls} type="number" value={form.buy_price_jpy} onChange={e => set('buy_price_jpy', e.target.value)} placeholder="e.g. 3200000" />
              </Field>
            )}
            <Field label="AUD Estimate">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input className={inputCls + ' pl-7'} type="number" value={form.aud_estimate} onChange={e => set('aud_estimate', e.target.value)} placeholder="e.g. 42000" />
              </div>
            </Field>
          </div>
        </Section>

        {/* AUCTION DETAILS */}
        {isAuction && (
          <Section title="Auction Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Auction Date">
                <input className={inputCls} type="date" value={form.auction_date} onChange={e => set('auction_date', e.target.value)} />
              </Field>
              <Field label="Auction Time (JST)">
                <input className={inputCls} type="time" value={form.auction_time} onChange={e => set('auction_time', e.target.value)} />
              </Field>
              <Field label="Auction Site">
                <select className={inputCls} value={form.kaijo_code} onChange={e => set('kaijo_code', e.target.value)}>
                  <option value="">— select —</option>
                  {AUCTION_SITES.map(s => (
                    <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </Field>
              <Field label="Bid / Lot No.">
                <input className={inputCls} value={form.bid_no} onChange={e => set('bid_no', e.target.value)} placeholder="e.g. Y3502K01" />
              </Field>
            </div>
          </Section>
        )}

        {/* PHOTOS */}
        <Section title="Photos">
          <div className="mb-4">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files?.length) handlePhotoUpload(e.target.files) }}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photoUploading}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              {photoUploading ? 'Uploading...' : 'Upload Photos'}
            </button>
            {photoUploadError && <p className="text-red-600 text-xs mt-1">{photoUploadError}</p>}

            {photoUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photoUrls.map((url, i) => (
                  <div key={url} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeUploadedPhoto(url)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      x
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-white text-[10px] bg-black/50 rounded-b-lg py-0.5">Main</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Field label="Or paste photo URLs (one per line)">
            <textarea
              className={inputCls + ' h-24 resize-none'}
              value={form.photos}
              onChange={e => set('photos', e.target.value)}
              placeholder={`https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg`}
            />
          </Field>
        </Section>

        {/* NOTES */}
        <Section title="Notes">
          <textarea
            className={inputCls + ' h-28 resize-none'}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Condition, history, damage, rust, why it's a good buy..."
          />
        </Section>

        {/* SUBMIT */}
        <div className="flex items-center gap-4 pb-12">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || success}
            className="px-8 py-3 bg-green-800 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : success ? 'Saved!' : 'Add Vehicle'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/agent')}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent'
