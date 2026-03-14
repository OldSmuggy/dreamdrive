'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { centsToAud, effectivePrice, activeSpecial, sourceLabel, sourceBadgeColor } from '@/lib/utils'
import type { Listing, Product, BuildState } from '@/types'

interface Props {
  initialListing: Listing | null
  fitouts: Product[]
  electricals: Product[]
  poptop: Product | null
  poptopOnly: Product | null
  openDeposit: boolean
}

const STEPS = ['Base Van', 'Fit-Out', 'Electrical', 'Pop Top', 'Summary']

// Grid bed kit is only compatible with cabinet-level electrical
const GRID_SLUG = 'grid-bed-kit'
const CABINET_SLUG = 'elec-cabinet'

export default function ConfiguratorClient({ initialListing, fitouts, electricals, poptop, poptopOnly, openDeposit }: Props) {
  const [step, setStep]             = useState(initialListing ? 1 : 0)
  const [listing, setListing]       = useState<Listing | null>(initialListing)
  const [fitout, setFitout]         = useState<Product | null>(null)
  const [electrical, setElectrical] = useState<Product | null>(null)
  const [withPoptop, setWithPoptop] = useState(false)
  const [poptopJapan, setPoptopJapan] = useState(false)
  const [leadSent, setLeadSent]     = useState(false)

  // Enforce electrical restrictions for Grid bed kit
  const allowedElectricals = useMemo(() => {
    if (fitout?.slug === GRID_SLUG) return electricals.filter(e => e.slug === CABINET_SLUG || e.slug.startsWith('elec-cabinet'))
    return electricals
  }, [fitout, electricals])

  // Price calculation
  const { min, max } = useMemo(() => {
    let min = listing ? (listing.au_price_aud ?? listing.aud_estimate ?? 0) : 0
    let max = min
    if (fitout)     { const p = effectivePrice(fitout);     min += p; max += p }
    if (electrical) { const p = effectivePrice(electrical); min += p; max += p }
    if (withPoptop && poptop) { const p = effectivePrice(poptop); min += p; max += p }
    return { min, max }
  }, [listing, fitout, electrical, withPoptop, poptop])

  async function handleLeadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const budget = fd.get('budget') as string
    const location = fd.get('location') as string
    const notes = fd.get('notes') as string
    const notesLine = [
      budget && `Budget: ${budget}`,
      location && `Location: ${location}`,
      notes && `Notes: ${notes}`,
    ].filter(Boolean).join(' | ')

    // Save build first, then lead
    const buildRes = await fetch('/api/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listing?.id,
        fitout_product_id: fitout?.id,
        elec_product_id: electrical?.id,
        poptop_product_id: withPoptop ? poptop?.id : null,
        poptop_japan: false,
        total_aud_min: min,
        total_aud_max: max,
      }),
    })
    const buildData = await buildRes.json()

    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'consultation',
        name: fd.get('name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        listing_id: listing?.id,
        build_id: buildData.id ?? null,
        estimated_value: min,
        source: 'configurator',
        notes: notesLine || null,
      }),
    })

    setLeadSent(true)
    if (buildData.share_slug) {
      setTimeout(() => { window.location.href = `/build/${buildData.share_slug}` }, 1500)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-4xl text-forest-900 mb-2">Build Your Van</h1>
      <p className="text-gray-500 mb-8">Configure your complete build. Every step is optional — build as much or as little as you want.</p>

      {/* Progress */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i <= step && setStep(i)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              i === step ? 'bg-forest-600 text-white' : i < step ? 'bg-forest-100 text-forest-700' : 'bg-gray-100 text-gray-400'
            }`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* ---- Step 0: Base Van ---- */}
      {step === 0 && (
        <StepPanel title="Choose Your Base Van" onNext={() => setStep(1)}>
          <p className="text-gray-500 mb-6">Browse and select a van, or skip for now and configure your build first.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={`/browse`} className="btn-primary flex-1 text-center py-4">
              Browse All Vans
            </Link>
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-4">
              Skip — Configure Build First
            </button>
          </div>
        </StepPanel>
      )}

      {/* ---- Step 1: Fit-Out ---- */}
      {step === 1 && (
        <StepPanel title="Choose a Fit-Out Package" onBack={() => setStep(0)} onNext={() => setStep(2)}>
          {listing && <VanSummaryCard listing={listing} onClear={() => setListing(null)} />}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {fitouts.map(p => (
              <ProductCard key={p.id} product={p} selected={fitout?.id === p.id}
                onSelect={() => {
                  setFitout(prev => prev?.id === p.id ? null : p)
                  // Clear incompatible electrical if switching away from grid
                  if (p.slug !== GRID_SLUG && electrical && electrical.slug !== CABINET_SLUG) {/* keep */}
                  if (p.slug === GRID_SLUG && electrical && electrical.slug !== CABINET_SLUG) setElectrical(null)
                }} />
            ))}
            {poptopOnly && (
              <ProductCard product={poptopOnly} selected={fitout?.id === poptopOnly.id}
                onSelect={() => setFitout(prev => prev?.id === poptopOnly.id ? null : poptopOnly)} />
            )}
            <div
              className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${!fitout ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => setFitout(null)}>
              <p className="font-semibold text-gray-800">No Fit-Out</p>
              <p className="text-sm text-gray-500 mt-1">Base van only — arrange your own interior</p>
              <p className="font-display text-forest-600 text-lg mt-3">$0</p>
            </div>
          </div>
          {fitout?.slug === GRID_SLUG && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-4 py-2 mt-3">
              Grid Bed Kit is compatible with Electrical Cabinet or No Electrical only.
            </p>
          )}
        </StepPanel>
      )}

      {/* ---- Step 2: Electrical ---- */}
      {step === 2 && (
        <StepPanel title="Electrical & Battery System" onBack={() => setStep(1)} onNext={() => setStep(3)}>
          <div className="grid sm:grid-cols-2 gap-4">
            {allowedElectricals.map(p => (
              <ProductCard key={p.id} product={p} selected={electrical?.id === p.id}
                onSelect={() => setElectrical(prev => prev?.id === p.id ? null : p)} />
            ))}
            <div
              className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${!electrical ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => setElectrical(null)}>
              <p className="font-semibold text-gray-800">No Electrical</p>
              <p className="text-sm text-gray-500 mt-1">Base van electrics only</p>
              <p className="font-display text-forest-600 text-lg mt-3">$0</p>
            </div>
          </div>
        </StepPanel>
      )}

      {/* ---- Step 3: Pop Top ---- */}
      {step === 3 && (
        <StepPanel title="Fiberglass Pop Top Roof" onBack={() => setStep(2)} onNext={() => setStep(4)}>
          {poptop && (
            <div className={`border-2 rounded-2xl p-6 cursor-pointer transition-colors mb-4 ${withPoptop ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => setWithPoptop(v => !v)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">Add Pop Top Conversion</p>
                  <p className="text-sm text-gray-500 mt-1">{poptop.description}</p>
                  <ul className="text-sm text-gray-600 mt-3 space-y-1">
                    <li>• +600mm internal height when raised</li>
                    <li>• Fits nearly all car parks when lowered</li>
                    <li>• 10–15 second setup</li>
                    <li>• Made & installed in Brisbane factory</li>
                  </ul>
                </div>
                <div className="ml-4 text-right shrink-0">
                  <p className="font-display text-forest-700 text-2xl">{centsToAud(effectivePrice(poptop))}</p>
                  {activeSpecial(poptop) && poptop.special_price_aud && (
                    <p className="text-xs text-gray-400 line-through mt-0.5">{centsToAud(poptop.rrp_aud)}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Ex GST</p>
                </div>
              </div>
            </div>
          )}
          {withPoptop && (
            <div className="bg-sand-50 rounded-xl p-4 text-sm">
              <p className="font-semibold text-gray-700">Installed at our Brisbane factory on arrival — within 2 weeks of your van landing.</p>
            </div>
          )}
          {!withPoptop && (
            <button onClick={() => setStep(4)} className="text-gray-400 text-sm hover:underline mt-2">
              Skip — no pop top →
            </button>
          )}
        </StepPanel>
      )}

      {/* ---- Step 4: Summary ---- */}
      {step === 4 && (
        <div>
          <h2 className="font-display text-2xl text-forest-900 mb-6">Your Build Summary</h2>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
            {listing && (
              <SummaryRow label="Base Van" value={
                listing.au_price_aud ? centsToAud(listing.au_price_aud)
                  : listing.aud_estimate ? `~${centsToAud(listing.aud_estimate)}`
                  : 'TBC'
              } sub={listing.model_name} badge={sourceLabel(listing.source)} badgeColor={sourceBadgeColor(listing.source)} />
            )}
            {!listing && (
              <SummaryRow label="Base Van" value="TBC" sub="No van selected yet" />
            )}
            {fitout && <SummaryRow label="Fit-Out" value={centsToAud(effectivePrice(fitout))} sub={fitout.name}
              special={activeSpecial(fitout) ? fitout.special_label ?? undefined : undefined} />}
            {electrical && <SummaryRow label="Electrical" value={centsToAud(effectivePrice(electrical))} sub={electrical.name} />}
            {withPoptop && poptop && <SummaryRow label="Pop Top" value={centsToAud(effectivePrice(poptop))} sub="Installed in Brisbane" />}

            <div className="bg-forest-50 px-5 py-4 flex justify-between items-center">
              <span className="font-display text-lg text-forest-900">Estimated Total</span>
              <span className="font-display text-2xl text-forest-700">
                {min === max ? centsToAud(min) : `${centsToAud(min)} – ${centsToAud(max)}`}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            Final pricing confirmed at consultation. Import/shipping estimate based on current rates. All prices AUD.
          </p>

          {/* Save & Share form */}
          {!leadSent ? (
            <div className="bg-sand-50 border border-sand-200 rounded-2xl p-6 mb-6">
              <h3 className="font-display text-xl mb-1">Save & Share This Build</h3>
              <p className="text-gray-500 text-sm mb-5">Enter your details to save a shareable link and book a free consultation call.</p>
              <form onSubmit={handleLeadSubmit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input name="name" required placeholder="Your name" className="input-field" />
                  <input name="phone" required placeholder="Phone number" className="input-field" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input name="email" type="email" required placeholder="Email address" className="input-field" />
                  <select name="budget" className="input-field">
                    <option value="">Budget (optional)</option>
                    <option value="under_40k">Under $40,000</option>
                    <option value="40_60k">$40,000 – $60,000</option>
                    <option value="60_80k">$60,000 – $80,000</option>
                    <option value="80_100k">$80,000 – $100,000</option>
                    <option value="over_100k">Over $100,000</option>
                  </select>
                </div>
                <input name="location" placeholder="Your location (e.g. Brisbane, QLD)" className="input-field" />
                <textarea name="notes" placeholder="Any notes or questions..." rows={3} className="input-field resize-none" />
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1 py-3">Save & Share My Build →</button>
                  <Link href="/browse" className="btn-secondary py-3 px-5 text-center">
                    {listing ? 'Change Van' : 'Find a Van'}
                  </Link>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-forest-50 border border-forest-200 rounded-2xl p-6 text-center mb-6">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-display text-xl text-forest-800">Build saved!</h3>
              <p className="text-forest-600 text-sm mt-1">Jared will reach out within 24 hours to confirm your build and next steps.</p>
            </div>
          )}

          <button onClick={() => setStep(0)} className="text-gray-400 text-sm hover:underline mt-6 block">
            ← Start over
          </button>
        </div>
      )}
    </div>
  )
}

// ---- Sub-components ----

function StepPanel({ title, children, onBack, onNext }: {
  title: string; children: React.ReactNode; onBack?: () => void; onNext?: () => void
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-forest-900 mb-6">{title}</h2>
      {children}
      <div className="flex gap-3 mt-8">
        {onBack && <button onClick={onBack} className="btn-secondary">← Back</button>}
        {onNext && <button onClick={onNext} className="btn-primary ml-auto">Continue →</button>}
      </div>
    </div>
  )
}

function ProductCard({ product, selected, onSelect }: { product: Product; selected: boolean; onSelect: () => void }) {
  const isSpecial = activeSpecial(product)
  const price = effectivePrice(product)

  return (
    <div onClick={onSelect}
      className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${selected ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-900">{product.name}</p>
            {isSpecial && product.special_label && (
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">{product.special_label}</span>
            )}
          </div>
          {product.description && <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-forest-700 text-xl">
          {price === 0 ? 'Contact for price' : centsToAud(price)}
        </span>
        {isSpecial && product.rrp_aud > 0 && (
          <span className="text-sm text-gray-400 line-through">{centsToAud(product.rrp_aud)}</span>
        )}
      </div>
    </div>
  )
}

function VanSummaryCard({ listing, onClear }: { listing: Listing; onClear: () => void }) {
  const photo = listing.photos[0]
  return (
    <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden shrink-0">
        {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🚐</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{listing.model_name}</p>
        <p className="text-xs text-gray-500">{listing.model_year} · {listing.drive} · {listing.mileage_km?.toLocaleString() ?? '—'} km</p>
      </div>
      <button onClick={onClear} className="text-gray-400 hover:text-red-500 text-xs shrink-0">Change</button>
    </div>
  )
}

function SummaryRow({ label, value, sub, badge, badgeColor, special }: {
  label: string; value: string; sub?: string; badge?: string; badgeColor?: string; special?: string
}) {
  return (
    <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 last:border-0">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">{label}</span>
          {badge && <span className={`${badgeColor ?? 'bg-gray-400'} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>{badge}</span>}
          {special && <span className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded">{special}</span>}
        </div>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <span className="font-display text-gray-900 text-lg ml-4">{value}</span>
    </div>
  )
}
