'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { centsToAud, effectivePrice, activeSpecial, sourceLabel, sourceBadgeColor } from '@/lib/utils'
import type { Listing, Product, BuildState } from '@/types'

interface Props {
  initialListing: Listing | null
  fitouts: Product[]
  electricals: Product[]
  poptop: Product | null
  poptopOnly: Product | null
  rearACProduct: Product | null
  openDeposit: boolean
  jpyRate?: number
}

function fitoutAudJpy(cents: number, jpyRate: number): string {
  const aud = cents / 100
  const jpy = Math.round(aud / jpyRate / 1000) * 1000
  return `$${aud.toLocaleString('en-AU')} AUD (approx. ¥${jpy.toLocaleString('en-AU')} JPY)`
}

const STEPS = ['Base Van', 'Fit-Out', 'Electrical & Battery', 'Pop Top', 'Import Costs', 'Summary']

const GRID_SLUG    = 'grid-bed-kit'
const CABINET_SLUG = 'elec-cabinet'
const PREMIUM_FITOUT_SLUGS = ['tama', 'mana', 'kumaq']
type ComingSoonSlug = 'kitchen-only' | 'bed-only'

// Detect LWB vs SLWB from listing fields
function detectVanSize(listing: Listing | null): 'LWB' | 'SLWB' {
  if (listing?.size === 'SLWB') return 'SLWB'
  if (listing?.size === 'LWB' || listing?.size === 'MWB') return 'LWB'
  const chassis = listing?.chassis_code ?? ''
  if (/221|206K|SLWB/i.test(chassis)) return 'SLWB'
  return 'LWB'
}

// Import cost constants (in cents)
const SHIPPING_LWB  = 260000   // $2,600
const SHIPPING_SLWB = 320000   // $3,200
const COMPLIANCE    = 220000   // $2,200
const REG_MIN       = 50000    // $500
const REG_MAX       = 100000   // $1,000
const DUTY_RATE     = 0.05

export default function ConfiguratorClient({
  initialListing, fitouts, electricals, poptop, poptopOnly, rearACProduct, openDeposit, jpyRate,
}: Props) {
  const [step, setStep]             = useState(initialListing ? 1 : 0)
  const [listing, setListing]       = useState<Listing | null>(initialListing)
  const [fitout, setFitout]         = useState<Product | null>(null)
  const [electrical, setElectrical] = useState<Product | null>(null)
  const [withPoptop, setWithPoptop] = useState(false)
  const [withRearAC, setWithRearAC] = useState(false)
  const [leadSent, setLeadSent]     = useState(false)
  const [comingSoon, setComingSoon] = useState<ComingSoonSlug | null>(null)

  const hasPremiumFitout = fitout != null && PREMIUM_FITOUT_SLUGS.includes(fitout.slug)
  const isGridKit = fitout?.slug === GRID_SLUG
  const isMana = fitout?.slug === 'mana'

  // Auto-reset electrical + poptop when fitout changes
  useEffect(() => {
    if (hasPremiumFitout) setElectrical(null)
    if (isMana) setWithPoptop(false)
  }, [fitout?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Enforce electrical restrictions for Grid bed kit
  const allowedElectricals = useMemo(() => {
    if (fitout?.slug === GRID_SLUG) return electricals.filter(e => e.slug === CABINET_SLUG || e.slug.startsWith('elec-cabinet'))
    return electricals
  }, [fitout, electricals])

  // Van purchase price in AUD (for import cost calculation)
  const vanFobCents = useMemo(() => {
    if (!listing) return null
    if (listing.start_price_jpy) return Math.round(listing.start_price_jpy * 0.0095) * 100
    if (listing.au_price_aud)    return Math.round(listing.au_price_aud * 0.82)  // back-calc FOB
    if (listing.aud_estimate)    return Math.round(listing.aud_estimate * 0.82)
    return null
  }, [listing])

  const vanSize    = detectVanSize(listing)
  const shipping   = vanSize === 'SLWB' ? SHIPPING_SLWB : SHIPPING_LWB
  const duty       = vanFobCents ? Math.round(vanFobCents * DUTY_RATE) : null
  const importMin  = (vanFobCents ?? 0) + (duty ?? 0) + shipping + COMPLIANCE + REG_MIN
  const importMax  = (vanFobCents ?? 0) + (duty ?? 0) + shipping + COMPLIANCE + REG_MAX

  // Full build price
  const { min, max } = useMemo(() => {
    let base = listing ? (listing.au_price_aud ?? listing.aud_estimate ?? 0) : 0
    if (fitout)                      { const p = effectivePrice(fitout);      base += p }
    if (electrical)                  { const p = effectivePrice(electrical);  base += p }
    if (withPoptop && poptop)        { const p = effectivePrice(poptop);      base += p }
    if (withRearAC && rearACProduct) { const p = effectivePrice(rearACProduct); base += p }
    return { min: base, max: base }
  }, [listing, fitout, electrical, withPoptop, poptop, withRearAC, rearACProduct])

  async function handleLeadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd      = new FormData(e.currentTarget)
    const budget   = fd.get('budget') as string
    const location = fd.get('location') as string
    const notes    = fd.get('notes') as string
    const addons   = [withRearAC && 'Rear A/C'].filter(Boolean).join(', ')
    const notesLine = [
      budget   && `Budget: ${budget}`,
      location && `Location: ${location}`,
      addons   && `Add-ons: ${addons}`,
      notes    && `Notes: ${notes}`,
    ].filter(Boolean).join(' | ')

    const buildRes = await fetch('/api/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id:        listing?.id,
        fitout_product_id: fitout?.id,
        elec_product_id:   electrical?.id,
        poptop_product_id: withPoptop ? poptop?.id : null,
        poptop_japan:      false,
        total_aud_min:     min,
        total_aud_max:     max,
      }),
    })
    const buildData = await buildRes.json()

    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:            'consultation',
        name:            fd.get('name'),
        email:           fd.get('email'),
        phone:           fd.get('phone'),
        listing_id:      listing?.id,
        build_id:        buildData.id ?? null,
        estimated_value: min,
        source:          'configurator',
        notes:           notesLine || null,
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
            className={`shrink-0 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
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
            <Link href="/browse" className="btn-primary flex-1 text-center py-4">Browse All Vans</Link>
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-4">Skip — Configure Build First</button>
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
                jpyRate={jpyRate}
                onSelect={() => {
                  setComingSoon(null)
                  setFitout(prev => prev?.id === p.id ? null : p)
                  if (p.slug === GRID_SLUG && electrical && electrical.slug !== CABINET_SLUG) setElectrical(null)
                }} />
            ))}
            {poptopOnly && (
              <ProductCard product={poptopOnly} selected={fitout?.id === poptopOnly.id}
                jpyRate={jpyRate}
                onSelect={() => { setComingSoon(null); setFitout(prev => prev?.id === poptopOnly.id ? null : poptopOnly) }} />
            )}
            {/* Coming Soon options */}
            <ComingSoonCard
              name="Kitchen Only"
              description="Galley kitchen fit-out only — sink, faucet, countertop, fridge, water tank. No bed or seating conversion. Coming soon — enquire for pricing."
              selected={comingSoon === 'kitchen-only'}
              onSelect={() => { setFitout(null); setComingSoon('kitchen-only'); setStep(5) }}
            />
            <ComingSoonCard
              name="Bed Only"
              description="Simple bed platform with storage drawers. No kitchen. Perfect if you already have a kitchen setup. Coming soon — enquire for pricing."
              selected={comingSoon === 'bed-only'}
              onSelect={() => { setFitout(null); setComingSoon('bed-only'); setStep(5) }}
            />
            <div
              className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${!fitout && !comingSoon ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => { setFitout(null); setComingSoon(null) }}>
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

      {/* ---- Step 2: Electrical & Battery ---- */}
      {step === 2 && (
        <StepPanel title="Electrical & Battery System" onBack={() => setStep(1)} onNext={() => setStep(3)}>

          {/* Electrical inclusion banner */}
          {hasPremiumFitout && (
            <div className="flex gap-3 bg-forest-50 border border-forest-300 rounded-xl px-4 py-3 text-sm text-forest-800 mb-5">
              <span className="shrink-0 mt-0.5">✓</span>
              <p>
                <strong>Electrical system included</strong> — Your {fitout!.name} fit-out includes a 200AH lithium battery, 2000W inverter, DC charger, shore power, and LED lighting as standard.
                You can upgrade below or keep the included system.
              </p>
            </div>
          )}
          {isGridKit && (
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-5">
              <span className="shrink-0 mt-0.5">⚠</span>
              <p>
                <strong>Electrical not included with Grid Bed Kit</strong> — The Grid Bed Kit is a furniture/bed system only and does not include electrical.
                Please select an electrical package below or choose &ldquo;No Electrical&rdquo; if you are arranging your own.
              </p>
            </div>
          )}
          {!hasPremiumFitout && !isGridKit && !fitout && (
            <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 mb-5">
              <span className="shrink-0 mt-0.5">ℹ</span>
              <p>No fit-out selected — you can still add an electrical system to your van independently.</p>
            </div>
          )}

          {/* Rear A/C add-on — shown first, compatible with all fit-outs */}
          {rearACProduct && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add-On Options</p>
              <div
                onClick={() => setWithRearAC(v => !v)}
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${withRearAC ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{rearACProduct.name}</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Add-On</span>
                    </div>
                    {rearACProduct.description && (
                      <p className="text-sm text-gray-500 leading-relaxed">{rearACProduct.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-forest-700 text-xl">
                      {effectivePrice(rearACProduct) === 0 ? 'Contact' : centsToAud(effectivePrice(rearACProduct))}
                    </p>
                    <div className={`mt-2 w-6 h-6 rounded border-2 flex items-center justify-center ml-auto ${withRearAC ? 'bg-forest-600 border-forest-600 text-white' : 'border-gray-300'}`}>
                      {withRearAC && '✓'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Electrical Systems</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {allowedElectricals.map(p => (
              <ProductCard key={p.id} product={p} selected={electrical?.id === p.id}
                onSelect={() => setElectrical(prev => prev?.id === p.id ? null : p)} />
            ))}
            <div
              className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${!electrical ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => setElectrical(null)}>
              {hasPremiumFitout ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">Keep Included System</p>
                    <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded font-medium">Recommended</span>
                  </div>
                  <p className="text-sm text-gray-500">Already included in your fit-out price — no extra cost</p>
                  <p className="font-display text-forest-600 text-lg mt-3">$0 <span className="text-xs text-gray-400 font-sans font-normal">(included)</span></p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-800">No Electrical</p>
                  <p className="text-sm text-gray-500 mt-1">Base van electrics only</p>
                  <p className="font-display text-forest-600 text-lg mt-3">$0</p>
                </>
              )}
            </div>
          </div>
        </StepPanel>
      )}

      {/* ---- Step 3: Pop Top ---- */}
      {step === 3 && (
        <StepPanel title="Fiberglass Pop Top Roof" onBack={() => setStep(2)} onNext={() => setStep(4)}>
          {isMana && (
            <div className="flex gap-3 bg-forest-50 border border-forest-300 rounded-xl px-4 py-3 text-sm text-forest-800 mb-5">
              <span className="shrink-0 mt-0.5">✓</span>
              <p>
                <strong>The MANA already includes a pop top as standard</strong> — this is included in your fit-out price. You do not need to add it here.
              </p>
            </div>
          )}
          {poptop && (
            <div className={`border-2 rounded-2xl p-6 transition-colors mb-4 ${isMana ? 'border-gray-200 opacity-50 cursor-not-allowed' : `cursor-pointer ${withPoptop ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'}`}`}
              onClick={() => !isMana && setWithPoptop(v => !v)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-lg">{isMana ? 'Pop Top Conversion' : 'Add Pop Top Conversion'}</p>
                    {isMana && <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded font-medium">Included with MANA</span>}
                  </div>
                  <p className="text-sm text-gray-500">{poptop.description}</p>
                  <ul className="text-sm text-gray-600 mt-3 space-y-1">
                    <li>• +600mm internal height when raised</li>
                    <li>• Fits nearly all car parks when lowered</li>
                    <li>• 10–15 second setup</li>
                    <li>• Made & installed in Brisbane factory</li>
                  </ul>
                </div>
                <div className="ml-4 text-right shrink-0">
                  {isMana ? (
                    <p className="font-display text-forest-700 text-2xl">Included</p>
                  ) : (
                    <>
                      <p className="font-display text-forest-700 text-2xl">{centsToAud(effectivePrice(poptop))}</p>
                      {activeSpecial(poptop) && poptop.special_price_aud && (
                        <p className="text-xs text-gray-400 line-through mt-0.5">{centsToAud(poptop.rrp_aud)}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Ex GST</p>
                    </>
                  )}
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

      {/* ---- Step 4: Import Costs ---- */}
      {step === 4 && (
        <StepPanel title="Estimated Import Costs" onBack={() => setStep(3)} onNext={() => setStep(5)}>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3 text-sm text-amber-800 mb-6">
            <span className="shrink-0">⚠️</span>
            <p><strong>Estimates only.</strong> Final import costs are confirmed at consultation. All costs are in AUD.</p>
          </div>

          {!listing && (
            <p className="text-gray-500 text-sm mb-4">No van selected — showing typical estimates for a {vanSize} Hiace.</p>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
            {vanFobCents !== null && (
              <ImportRow label="Japan purchase price" value={centsToAud(vanFobCents)} note="Based on listed price" />
            )}
            {duty !== null && (
              <ImportRow label="Import duty (5%)" value={centsToAud(duty)} note="Applied to Japan purchase price" />
            )}
            <ImportRow
              label="RORO shipping"
              value={centsToAud(shipping)}
              note={`${vanSize} Hiace — roll-on/roll-off from Japan`}
            />
            <ImportRow label="Compliance & ADR" value={`~${centsToAud(COMPLIANCE)}`} note="Includes inspection (covered by sourcing fee)" />
            <ImportRow label="Registration" value={`${centsToAud(REG_MIN)} – ${centsToAud(REG_MAX)}`} note="Varies by state" />

            <div className="bg-forest-950 text-white px-5 py-4 flex justify-between items-center">
              <div>
                <p className="font-display text-base">Estimated Total on Australian Roads</p>
                <p className="text-white/50 text-xs mt-0.5">Excluding fit-out &amp; accessories</p>
              </div>
              <div className="text-right">
                {vanFobCents !== null ? (
                  <p className="font-display text-xl text-sand-400">
                    {centsToAud(importMin)} – {centsToAud(importMax)}
                  </p>
                ) : (
                  <p className="font-display text-xl text-sand-400">TBC at consultation</p>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Exchange rate fluctuations affect the JPY → AUD purchase price. Final price depends on the rate at time of payment.
            <Link href="/import-costs" className="text-forest-600 hover:underline ml-1" target="_blank">
              Full import cost guide →
            </Link>
          </p>
        </StepPanel>
      )}

      {/* ---- Step 5: Summary ---- */}
      {step === 5 && (
        <div>
          <h2 className="font-display text-2xl text-forest-900 mb-6">Your Build Summary</h2>

          {/* Coming Soon notice */}
          {comingSoon && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
              <p className="font-semibold text-gray-800 mb-1">
                Thanks for your interest in {comingSoon === 'kitchen-only' ? 'Kitchen Only' : 'Bed Only'}!
              </p>
              <p className="text-gray-600 text-sm">
                This option is coming soon. Submit your build below and we&apos;ll be in touch with pricing and availability.
              </p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
            {listing && (
              <SummaryRow label="Base Van" value={
                listing.au_price_aud ? centsToAud(listing.au_price_aud)
                  : listing.aud_estimate ? `~${centsToAud(listing.aud_estimate)}`
                  : 'TBC'
              } sub={listing.model_name} badge={sourceLabel(listing.source)} badgeColor={sourceBadgeColor(listing.source)} />
            )}
            {!listing && <SummaryRow label="Base Van" value="TBC" sub="No van selected yet" />}
            {fitout    && <SummaryRow label="Fit-Out"
              value={jpyRate ? fitoutAudJpy(effectivePrice(fitout), jpyRate) : centsToAud(effectivePrice(fitout))}
              sub={fitout.name}
              special={activeSpecial(fitout) ? fitout.special_label ?? undefined : undefined} />}
            {electrical && <SummaryRow label="Electrical" value={centsToAud(effectivePrice(electrical))} sub={electrical.name} />}
            {withPoptop && poptop && <SummaryRow label="Pop Top" value={centsToAud(effectivePrice(poptop))} sub="Installed in Brisbane" />}
            {withRearAC && rearACProduct && (
              <SummaryRow label="Rear Air Conditioning" value={effectivePrice(rearACProduct) === 0 ? 'Contact' : centsToAud(effectivePrice(rearACProduct))} sub="Auxiliary rear A/C unit" />
            )}

            {/* Import cost summary row */}
            {vanFobCents !== null && (
              <SummaryRow
                label="Import Costs (est.)"
                value={`${centsToAud(importMin)} – ${centsToAud(importMax)}`}
                sub={`Shipping · Duty · Compliance · Rego`}
              />
            )}

            <div className="bg-forest-50 px-5 py-4 flex justify-between items-center">
              <span className="font-display text-lg text-forest-900">Estimated Total</span>
              <span className="font-display text-2xl text-forest-700">
                {min === max ? centsToAud(min) : `${centsToAud(min)} – ${centsToAud(max)}`}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            Fit-out price is separate from the van purchase price. Van price is an estimate based on current exchange rates — final price depends on the rate at time of payment.
            All prices AUD unless noted. Final pricing confirmed at consultation.
          </p>

          {/* Save & Share form */}
          {!leadSent ? (
            <div className="bg-sand-50 border border-sand-200 rounded-2xl p-6 mb-6">
              <h3 className="font-display text-xl mb-1">Save & Share This Build</h3>
              <p className="text-gray-500 text-sm mb-5">Enter your details to save a shareable link and book a free consultation call.</p>
              <form onSubmit={handleLeadSubmit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input name="name"  required placeholder="Your name"    className="input-field" />
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

          <button onClick={() => setStep(0)} className="text-gray-400 text-sm hover:underline mt-6 block">← Start over</button>
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

function ProductCard({ product, selected, onSelect, jpyRate }: { product: Product; selected: boolean; onSelect: () => void; jpyRate?: number }) {
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
      <div className="mt-3 flex flex-col gap-0.5">
        <span className="font-display text-forest-700 text-xl">
          {price === 0 ? 'Contact for price' : centsToAud(price)}
        </span>
        {jpyRate && price > 0 && (
          <span className="text-xs text-gray-400">
            approx. ¥{Math.round(price / 100 / jpyRate / 1000) * 1000 > 0
              ? (Math.round(price / 100 / jpyRate / 1000) * 1000).toLocaleString('en-AU')
              : '—'} JPY
          </span>
        )}
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
        {photo
          ? <img src={photo} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">🚐</div>}
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
      <span className="font-display text-gray-900 text-lg ml-4 shrink-0">{value}</span>
    </div>
  )
}

function ImportRow({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{note}</p>
      </div>
      <span className="font-semibold text-gray-900 text-sm shrink-0 ml-4">{value}</span>
    </div>
  )
}

function ComingSoonCard({ name, description, selected, onSelect }: {
  name: string; description: string; selected: boolean; onSelect: () => void
}) {
  return (
    <div onClick={onSelect}
      className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${selected ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-900">{name}</p>
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">Coming Soon</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="mt-3">
        <span className="inline-block bg-forest-50 text-forest-700 border border-forest-200 text-sm font-medium px-4 py-1.5 rounded-lg">
          Enquire for pricing →
        </span>
      </div>
    </div>
  )
}

// Keep BuildState exported for compatibility
export type { BuildState }
