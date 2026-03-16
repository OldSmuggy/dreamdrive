'use client'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { centsToAud, effectivePrice, activeSpecial, sourceLabel, sourceBadgeColor } from '@/lib/utils'
import { listingDisplayPrice, tamaConversionAud, manaJpConversionAud, manaAuConversionAud } from '@/lib/pricing'
import type { Listing, Product } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────
type FitoutSlug = 'tama' | 'mana' | 'grid' | null
type ManaLocation = 'japan' | 'australia'
type BuildLocation = 'japan' | 'australia'

interface Props {
  mode: 'van-first' | 'build-first'
  preSelectedVan: Listing | null
  preSelectedFitout: FitoutSlug
  products: Product[]
  listings: Listing[]
  jpyRate: number
}

interface PriceLine {
  label: string
  price: number | null   // cents, null = "included"
  note?: string
}

// ─── Hardcoded add-on catalog ─────────────────────────────────────────────────
// TODO: Replace with products table rows once addon seeding SQL is run (see below)
interface AddonItem {
  slug: string
  name: string
  detail: string | null
  priceCents: number
  fitouts: (FitoutSlug | 'any')[]
}

const ADDON_CATALOG: AddonItem[] = [
  { slug: 'recommended-package', name: 'Recommended Package',    detail: 'Black-out curtains, insect screens, insect net, rain cover, MAXXFAN',   priceCents: 380000, fitouts: ['tama', 'mana'] },
  { slug: 'solar-package',       name: 'Solar Package',           detail: 'Solar system 175–200W with MPPT controller',                              priceCents: 200000, fitouts: ['tama', 'mana', 'grid'] },
  { slug: 'ff-heater',           name: 'FF Heater Package',       detail: 'Thermal wool insulation + Webasto FF heater',                             priceCents: 550000, fitouts: ['tama'] },
  { slug: 'hot-water',           name: 'Hot Water Package',       detail: 'Duoletto 12V/240V water system + 10L additional storage',                priceCents: 200000, fitouts: ['mana'] },
  { slug: 'awning-fiamma',       name: 'Side Awning (Fiamma 3.5M)', detail: null,                                                                   priceCents: 230000, fitouts: ['tama', 'mana', 'grid', 'any'] },
  { slug: 'shower-awning',       name: 'Shower Awning',           detail: null,                                                                     priceCents:  80000, fitouts: ['mana'] },
  { slug: 'off-road-tires',      name: 'Off-Road Tires',          detail: 'All-terrain tire upgrade',                                               priceCents: 230000, fitouts: ['tama', 'mana', 'grid', 'any'] },
  { slug: 'half-wrap',           name: 'Half Wrap',               detail: 'Colour wrap on lower half of van',                                       priceCents: 330000, fitouts: ['tama', 'mana', 'grid', 'any'] },
  { slug: 'lift-kit',            name: 'Lift Kit 2" Ironman 4×4', detail: '2-inch suspension lift by Ironman 4×4',                                 priceCents: 258000, fitouts: ['tama', 'mana'] },
]

const GRID_SLUG    = 'grid-bed-kit'
const CABINET_SLUG = 'elec-cabinet'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBuildLocation(fitout: FitoutSlug, manaLoc: ManaLocation): BuildLocation {
  if (fitout === 'tama') return 'japan'
  if (fitout === 'mana' && manaLoc === 'japan') return 'japan'
  return 'australia'
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ConfiguratorV2({
  mode, preSelectedVan, preSelectedFitout, products, listings, jpyRate,
}: Props) {
  const isVanFirst = mode === 'van-first'

  // ── State ──────────────────────────────────────────────────────────────────
  const [step,           setStep]           = useState(0)
  const [fitoutSlug,     setFitoutSlug]     = useState<FitoutSlug>(preSelectedFitout)
  const [manaLocation,   setManaLocation]   = useState<ManaLocation>('japan')
  const [electrical,     setElectrical]     = useState<Product | null>(null)
  const [popTop,         setPopTop]         = useState(false)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [selectedVan,    setSelectedVan]    = useState<Listing | null>(preSelectedVan)
  const [isBYO,          setIsBYO]          = useState(false)
  const [leadSent,       setLeadSent]       = useState(false)
  const [savedBuild,     setSavedBuild]     = useState<{ id: string; slug: string } | null>(null)
  const [saving,         setSaving]         = useState(false)
  const [shareToast,     setShareToast]     = useState<string | null>(null)
  const saveAttempted = useRef(false)

  // ── Derived ────────────────────────────────────────────────────────────────
  const buildLocation      = getBuildLocation(fitoutSlug, manaLocation)
  const isJapanBuild       = buildLocation === 'japan'
  const isTama             = fitoutSlug === 'tama'
  const isMana             = fitoutSlug === 'mana'
  const isGrid             = fitoutSlug === 'grid'
  const manaIncludesPopTop = isMana

  // ── Products ───────────────────────────────────────────────────────────────
  const fitoutProduct = useMemo(() => {
    if (!fitoutSlug) return null
    if (fitoutSlug === 'grid') return products.find(p => p.slug === GRID_SLUG || p.slug.startsWith('grid')) ?? null
    return products.find(p => p.slug === fitoutSlug) ?? null
  }, [fitoutSlug, products])

  const electricals = products.filter(p => p.category === 'electrical')
  const allowedElectricals = isGrid
    ? electricals.filter(e => e.slug === CABINET_SLUG || e.slug.includes('cabinet'))
    : electricals
  const poptopProduct = products.find(p => p.category === 'poptop') ?? null

  // ── Add-ons for current fitout ─────────────────────────────────────────────
  const availableAddons = useMemo(() => {
    if (fitoutSlug === null) {
      // van-only / pop-top-only: show generic options
      return ADDON_CATALOG.filter(a => a.fitouts.includes('any'))
    }
    return ADDON_CATALOG.filter(a => a.fitouts.includes(fitoutSlug) || a.fitouts.includes('any'))
  }, [fitoutSlug])

  // ── Van suggestions ────────────────────────────────────────────────────────
  const suggestedVans = useMemo(() =>
    listings.filter(v => isJapanBuild ? v.source !== 'au_stock' : true),
    [listings, isJapanBuild]
  )

  // ── Pricing ────────────────────────────────────────────────────────────────
  const { totalCents, priceLines } = useMemo(() => {
    const lines: PriceLine[] = []
    let total = 0

    // ── Conversion fee (TAMA / MANA / Bare Camper / van-first) ──────────────
    if (isTama) {
      const fee = tamaConversionAud(jpyRate) * 100  // convert to cents
      lines.push({ label: 'TAMA Conversion (¥4,800,000)', price: fee, note: 'Built at our Tokyo facility' })
      total += fee
    } else if (isMana && manaLocation === 'japan') {
      const fee = manaJpConversionAud(jpyRate) * 100
      lines.push({ label: 'MANA Conversion (¥4,500,000)', price: fee, note: 'Built at our Tokyo facility' })
      total += fee
    } else if (isMana && manaLocation === 'australia') {
      const fee = manaAuConversionAud() * 100  // $45,000 in cents
      lines.push({ label: 'MANA Conversion', price: fee, note: 'Built at our Brisbane workshop' })
      total += fee
    } else if (fitoutProduct && isGrid) {
      const fp = effectivePrice(fitoutProduct)
      lines.push({ label: 'Bare Camper', price: fp, note: 'Installed in Australia' })
      total += fp
    }

    // ── Van price (always separate) ──────────────────────────────────────────
    if (isVanFirst) {
      const { priceCents: vp } = selectedVan ? listingDisplayPrice(selectedVan, jpyRate) : { priceCents: 0 }
      lines.push({ label: selectedVan?.model_name ?? 'Your Van', price: vp ?? 0, note: isJapanBuild ? 'Incl. $10,000 import fee' : undefined })
      total += vp ?? 0
    } else if (isTama || (isMana && manaLocation === 'japan')) {
      // Japan build — show van as separate line if selected
      if (selectedVan) {
        const { priceCents: vp } = listingDisplayPrice(selectedVan, jpyRate)
        lines.push({ label: selectedVan.model_name, price: vp ?? 0, note: 'Incl. $10,000 import fee' })
        total += vp ?? 0
      } else {
        lines.push({ label: 'Van', price: null, note: 'To be selected — see price range above' })
      }
    } else if (fitoutSlug !== null) {
      // AU build with fitout (MANA AU, Bare Camper)
      if (!isBYO && selectedVan) {
        const { priceCents: vp } = listingDisplayPrice(selectedVan, jpyRate)
        lines.push({ label: selectedVan.model_name, price: vp ?? 0, note: 'Incl. $10,000 import fee' })
        total += vp ?? 0
      } else if (isBYO) {
        lines.push({ label: 'Your own van', price: null, note: 'BYO — compatibility to be confirmed' })
      } else {
        lines.push({ label: 'Van', price: null, note: 'To be selected — see price range above' })
      }
    }

    // ── Electrical ───────────────────────────────────────────────────────────
    if (electrical) {
      const ep = effectivePrice(electrical)
      lines.push({ label: electrical.name, price: ep })
      total += ep
    }

    // ── Pop Top ──────────────────────────────────────────────────────────────
    if (manaIncludesPopTop) {
      lines.push({ label: 'Pop Top Roof', price: null, note: 'Included with MANA' })
    } else if (popTop && poptopProduct) {
      const pp = effectivePrice(poptopProduct)
      lines.push({ label: 'Pop Top Conversion', price: pp, note: 'Fitted in Brisbane on arrival' })
      total += pp
    }

    // ── Add-ons ──────────────────────────────────────────────────────────────
    selectedAddons.forEach(slug => {
      const addon = ADDON_CATALOG.find(a => a.slug === slug)
      if (addon) {
        lines.push({ label: addon.name, price: addon.priceCents })
        total += addon.priceCents
      }
    })

    return { totalCents: total, priceLines: lines }
  }, [
    isVanFirst, isTama, isMana, isGrid, manaLocation, isBYO, fitoutProduct, fitoutSlug,
    selectedVan, jpyRate, isJapanBuild,
    electrical, manaIncludesPopTop, popTop, poptopProduct, selectedAddons,
  ])

  // ── Callbacks ──────────────────────────────────────────────────────────────
  function handleFitoutChange(slug: FitoutSlug) {
    setFitoutSlug(slug)
    setElectrical(null)
    setPopTop(false)
    setSelectedAddons([])
    setSelectedVan(null)
    setIsBYO(false)
  }

  const toggleAddon = useCallback((slug: string) => {
    setSelectedAddons(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }, [])

  // Auto-save build when customer reaches the summary step
  const finalStep = isVanFirst ? 1 : 5
  useEffect(() => {
    if (step === finalStep && !saveAttempted.current) {
      saveAttempted.current = true
      saveBuildToDb()
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveBuildToDb(): Promise<{ id: string; slug: string } | null> {
    if (savedBuild) return savedBuild
    setSaving(true)
    try {
      const res = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id:        selectedVan?.id ?? null,
          fitout_product_id: fitoutProduct?.id ?? null,
          elec_product_id:   electrical?.id ?? null,
          poptop_product_id: (popTop && poptopProduct && !manaIncludesPopTop) ? poptopProduct.id : null,
          poptop_japan:      false,
          total_aud_min:     totalCents,
          total_aud_max:     totalCents,
          build_location:    buildLocation,
          mana_location:     isMana ? manaLocation : null,
          entry_mode:        mode,
          is_byo:            isBYO,
        }),
      })
      const data = await res.json()
      if (data?.id) {
        const result = { id: data.id, slug: data.share_slug }
        setSavedBuild(result)
        return result
      }
    } catch { /* swallow */ }
    finally { setSaving(false) }
    return null
  }

  async function handleShare() {
    const build = savedBuild ?? await saveBuildToDb()
    if (!build) return
    const url = `${window.location.origin}/build/${build.slug}`
    try {
      await navigator.clipboard.writeText(url)
      setShareToast('Link copied! Share it with anyone.')
    } catch {
      setShareToast(url)
    }
    setTimeout(() => setShareToast(null), 4000)
  }

  async function handleLeadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    // Use already-saved build or save now
    const build = savedBuild ?? await saveBuildToDb()

    const isDepositCTA = selectedVan?.source === 'auction' || selectedVan?.source === 'au_stock'
    const leadType = isDepositCTA ? 'deposit_intent' : 'consultation'

    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:            isDepositCTA ? 'interest' : 'consultation',
        lead_type:       leadType,
        name:            fd.get('name'),
        email:           fd.get('email'),
        phone:           fd.get('phone') || null,
        listing_id:      selectedVan?.id ?? null,
        build_id:        build?.id ?? null,
        build_slug:      build?.slug ?? null,
        estimated_value: totalCents,
        source:          'configurator_v2',
        notes:           [
          `Fitout: ${fitoutSlug ?? 'none'}`,
          `Build location: ${buildLocation}`,
          isBYO && 'BYO van',
          selectedAddons.length && `Add-ons: ${selectedAddons.join(', ')}`,
          fd.get('notes') && `Notes: ${fd.get('notes')}`,
        ].filter(Boolean).join(' | '),
      }),
    })

    setLeadSent(true)
  }

  // ── Step arrays ────────────────────────────────────────────────────────────
  const buildSteps = ['Choose Build', 'Electrical', 'Pop Top', 'Add-Ons', 'Find Your Van', 'Summary']
  const vanSteps   = ['Configure', 'Summary']
  const steps      = isVanFirst ? vanSteps : buildSteps

  // Sticky bar visibility: always show after first interaction
  const showStickyBar = step > 0 || (isVanFirst && popTop)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-4xl mx-auto px-4 py-10 ${showStickyBar ? 'pb-28' : ''}`}>
      <h1 className="font-display text-4xl text-forest-900 mb-2">
        {isVanFirst ? 'Build This Van' : 'Design Your Build'}
      </h1>
      <p className="text-gray-500 mb-8">
        {isVanFirst
          ? 'Customise your chosen van. Every option is optional.'
          : 'Configure your complete build step by step. Every step is optional.'}
      </p>

      {/* ── Progress tabs ── */}
      <div className="flex gap-1.5 mb-10 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => i < step && setStep(i)}
            className={`shrink-0 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
              i === step   ? 'bg-forest-600 text-white'
              : i < step   ? 'bg-forest-100 text-forest-700 hover:bg-forest-200'
              :               'bg-gray-100 text-gray-400 cursor-default'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          VAN-FIRST FLOW
      ════════════════════════════════════════════════════════ */}

      {isVanFirst && step === 0 && (
        <StepPanel title="Your Van" onNext={() => setStep(1)}>
          {selectedVan && <VanSummaryCard listing={selectedVan} showPrice />}

          {/* Pop Top toggle */}
          {poptopProduct && (
            <div className="mt-8">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Add to your van</p>
              <div
                onClick={() => setPopTop(v => !v)}
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${
                  popTop ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-base mb-1">Pop Top Roof Conversion</p>
                    <p className="text-sm text-gray-500 mb-2">+600mm standing height. Fits in your garage when lowered.</p>
                    <ul className="text-xs text-gray-400 space-y-0.5">
                      <li>• 10–15 second pop-up</li>
                      <li>• Fibreglass shell · Grey canvas · 3–4 windows</li>
                      <li>• Fitted in Brisbane. 10 business day turnaround.</li>
                    </ul>
                  </div>
                  <div className="ml-4 text-right shrink-0">
                    <p className="font-display text-forest-700 text-2xl">{centsToAud(effectivePrice(poptopProduct))}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Ex GST</p>
                    <div className={`mt-3 w-6 h-6 rounded border-2 flex items-center justify-center ml-auto ${
                      popTop ? 'bg-forest-600 border-forest-600 text-white' : 'border-gray-300'
                    }`}>
                      {popTop && <Checkmark />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upsell to full builds */}
          <div className="mt-8 bg-sand-50 border border-sand-200 rounded-2xl p-6">
            <p className="font-semibold text-forest-900 mb-1">Want a full campervan conversion?</p>
            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
              Explore TAMA (6-seat family) or MANA (2-person campervan) — choose your conversion, then add your van.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/configurator?fitout=tama" className="btn-primary text-sm px-5 py-2.5">Explore TAMA</Link>
              <Link href="/configurator?fitout=mana" className="btn-secondary text-sm px-5 py-2.5">Explore MANA</Link>
            </div>
          </div>
        </StepPanel>
      )}

      {isVanFirst && step === 1 && (
        <SummaryStep
          priceLines={priceLines}
          totalCents={totalCents}
          selectedVan={selectedVan}
          isBYO={false}
          buildLocation={null}
          isVanFirst
          fitoutSlug={fitoutSlug}
          manaLocation={manaLocation}
          electrical={electrical}
          popTop={popTop}
          manaIncludesPopTop={manaIncludesPopTop}
          selectedAddons={selectedAddons}
          savedBuild={savedBuild}
          saving={saving}
          shareToast={shareToast}
          onShare={handleShare}
          leadSent={leadSent}
          onLeadSubmit={handleLeadSubmit}
          onBack={() => setStep(0)}
          onReset={() => { handleFitoutChange(null); setStep(0); saveAttempted.current = false; setSavedBuild(null) }}
        />
      )}

      {/* ════════════════════════════════════════════════════════
          BUILD-FIRST FLOW
      ════════════════════════════════════════════════════════ */}

      {/* Step 0 — Choose Build */}
      {!isVanFirst && step === 0 && (
        <StepPanel title="Choose Your Build" onNext={() => setStep(1)}>
          <div className="grid sm:grid-cols-2 gap-4">

            {/* TAMA */}
            <BuildOption
              title="TAMA"
              subtitle="6-Seat Family Campervan"
              detail="Built at our Tokyo facility. Rear seat folds to bed. Galley kitchen, sink, fridge."
              fromPrice={`Conversion ~$${(tamaConversionAud(jpyRate)).toLocaleString('en-AU')}`}
              badge="Japan Build"
              badgeColor="bg-forest-600"
              selected={fitoutSlug === 'tama'}
              onSelect={() => handleFitoutChange('tama')}
            />

            {/* MANA — with location chooser */}
            <div>
              <BuildOption
                title="MANA"
                subtitle="Compact 2-Person Campervan"
                detail="Full standing room, pop top included, 75L fridge, toilet, external shower."
                fromPrice={manaLocation === 'australia'
                  ? `Conversion $${manaAuConversionAud().toLocaleString('en-AU')}`
                  : `Conversion ~$${manaJpConversionAud(jpyRate).toLocaleString('en-AU')}`}
                badge={fitoutSlug === 'mana'
                  ? (manaLocation === 'japan' ? 'Japan Build' : 'AU Build')
                  : 'Japan or AU'}
                badgeColor={fitoutSlug === 'mana' && manaLocation === 'australia'
                  ? 'bg-blue-600' : 'bg-forest-600'}
                selected={fitoutSlug === 'mana'}
                onSelect={() => handleFitoutChange('mana')}
              />
              {fitoutSlug === 'mana' && (
                <div className="mt-3 border border-gray-200 rounded-xl p-4 bg-white">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Where is your MANA built?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'japan',     label: 'Built in Japan',     note: 'Van arrives fully converted. Japan vans only.', color: 'forest' },
                      { val: 'australia', label: 'Built in Australia',  note: 'Van arrives bare, converted in Brisbane. BYO option available.', color: 'blue' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setManaLocation(opt.val as ManaLocation)}
                        className={`rounded-xl p-3 border-2 text-sm text-left transition-colors ${
                          manaLocation === opt.val
                            ? opt.color === 'forest' ? 'border-forest-500 bg-forest-50' : 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold text-gray-900 mb-0.5">{opt.label}</p>
                        <p className="text-xs text-gray-500 leading-snug">{opt.note}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bare Camper */}
            {(() => {
              const gridProduct = products.find(p => p.slug === GRID_SLUG || p.slug.startsWith('grid'))
              return (
                <BuildOption
                  title="Bare Camper"
                  subtitle="Modular Bed System by Skybridge"
                  detail="Installed in Australia. Compatible with Toyota Hiace H200 LWB — or bring your own."
                  fromPrice={gridProduct ? `From ${centsToAud(effectivePrice(gridProduct))}` : 'Contact for price'}
                  badge="AU Build"
                  badgeColor="bg-blue-600"
                  selected={fitoutSlug === 'grid'}
                  onSelect={() => handleFitoutChange('grid')}
                />
              )
            })()}

            {/* No fit-out */}
            <div
              onClick={() => handleFitoutChange(null)}
              className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${
                fitoutSlug === null ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-800">No Fit-Out</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Just the van, or add a pop top and electrical system. Arrange your own interior.
              </p>
              <p className="font-display text-forest-600 text-xl mt-3">$0</p>
            </div>
          </div>

          {/* Build location note */}
          {fitoutSlug && (
            <div className={`mt-4 flex gap-2 rounded-xl px-4 py-3 text-sm ${
              isJapanBuild ? 'bg-forest-50 border border-forest-200 text-forest-800'
                           : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <span className="shrink-0">{isJapanBuild ? '🇯🇵' : '🇦🇺'}</span>
              <p>
                {isTama && 'TAMA is built at our Tokyo facility. Van must be sourced from Japan auction or dealer.'}
                {isMana && manaLocation === 'japan' && 'MANA Japan build: van sourced from Japan, arrives fully converted.'}
                {isMana && manaLocation === 'australia' && 'MANA AU build: van arrives bare, converted at our Brisbane workshop. BYO van option available.'}
                {isGrid && 'Bare Camper is installed in Australia. All van sources and BYO available.'}
              </p>
            </div>
          )}
        </StepPanel>
      )}

      {/* Step 1 — Electrical */}
      {!isVanFirst && step === 1 && (
        <StepPanel title="Electrical & Battery System" onBack={() => setStep(0)} onNext={() => setStep(2)}>
          {(isTama || isMana) && (
            <div className="flex gap-3 bg-forest-50 border border-forest-300 rounded-xl px-4 py-3 text-sm text-forest-800 mb-5">
              <span className="shrink-0 mt-0.5">✓</span>
              <p>
                <strong>Electrical included</strong> — Your {isTama ? 'TAMA' : 'MANA'} includes 200AH lithium battery,
                2000W inverter, DC charger, shore power, and LED lighting. Upgrade below or keep the standard system.
              </p>
            </div>
          )}
          {isGrid && (
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-5">
              <span className="shrink-0 mt-0.5">⚠</span>
              <p>
                <strong>Bare Camper does not include electrical</strong> — Compatible with Electrical Cabinet only.
                For full systems, consider a TAMA or MANA build.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {allowedElectricals.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                selected={electrical?.id === p.id}
                onSelect={() => setElectrical(prev => prev?.id === p.id ? null : p)}
              />
            ))}
            <div
              onClick={() => setElectrical(null)}
              className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${
                !electrical ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {(isTama || isMana) ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">Keep Included System</p>
                    <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded font-medium">Recommended</span>
                  </div>
                  <p className="text-sm text-gray-500">Already included in your build price</p>
                  <p className="font-display text-forest-600 text-lg mt-3">
                    $0 <span className="text-xs font-sans text-gray-400">(included)</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-800">No Electrical</p>
                  <p className="text-sm text-gray-500 mt-1">Arrange your own</p>
                  <p className="font-display text-forest-600 text-lg mt-3">$0</p>
                </>
              )}
            </div>
          </div>
        </StepPanel>
      )}

      {/* Step 2 — Pop Top */}
      {!isVanFirst && step === 2 && (
        <StepPanel title="Pop Top Roof" onBack={() => setStep(1)} onNext={() => setStep(3)}>
          {manaIncludesPopTop && (
            <div className="flex gap-3 bg-forest-50 border border-forest-300 rounded-xl px-4 py-3 text-sm text-forest-800 mb-5">
              <span className="shrink-0 mt-0.5">✓</span>
              <p>
                <strong>Pop top included with your MANA</strong> — included in your build price.
                Fitted at our Brisbane factory on arrival.
              </p>
            </div>
          )}
          {poptopProduct && !manaIncludesPopTop && (
            <div
              onClick={() => setPopTop(v => !v)}
              className={`border-2 rounded-2xl p-6 cursor-pointer transition-colors mb-4 ${
                popTop ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-lg mb-1">Add Pop Top Conversion</p>
                  {poptopProduct.description && (
                    <p className="text-sm text-gray-500 mb-3">{poptopProduct.description}</p>
                  )}
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• +600mm internal height when raised</li>
                    <li>• Fits nearly all car parks when lowered</li>
                    <li>• 10–15 second setup</li>
                    <li>• Fibreglass shell · Grey canvas · 3–4 windows</li>
                    <li>• Made &amp; installed in Brisbane factory</li>
                  </ul>
                </div>
                <div className="ml-4 text-right shrink-0">
                  <p className="font-display text-forest-700 text-2xl">{centsToAud(effectivePrice(poptopProduct))}</p>
                  {activeSpecial(poptopProduct) && poptopProduct.special_price_aud && (
                    <p className="text-xs text-gray-400 line-through mt-0.5">{centsToAud(poptopProduct.rrp_aud)}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">Ex GST</p>
                  <div className={`mt-3 w-6 h-6 rounded border-2 flex items-center justify-center ml-auto ${
                    popTop ? 'bg-forest-600 border-forest-600 text-white' : 'border-gray-300'
                  }`}>
                    {popTop && <Checkmark />}
                  </div>
                </div>
              </div>
            </div>
          )}
          {!manaIncludesPopTop && !popTop && (
            <button onClick={() => setStep(3)} className="text-gray-400 text-sm hover:underline mt-2">
              Skip — no pop top →
            </button>
          )}
        </StepPanel>
      )}

      {/* Step 3 — Add-Ons */}
      {!isVanFirst && step === 3 && (
        <StepPanel title="Select Options" onBack={() => setStep(2)} onNext={() => setStep(4)}>
          {availableAddons.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No add-on options for this selection. Continue to the next step.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
              {availableAddons.map(addon => {
                const isSelected = selectedAddons.includes(addon.slug)
                return (
                  <div
                    key={addon.slug}
                    onClick={() => toggleAddon(addon.slug)}
                    className={`flex items-start justify-between gap-4 px-5 py-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-forest-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-forest-600 border-forest-600 text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <Checkmark />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-forest-900 text-sm">{addon.name}</p>
                        {addon.detail && <p className="text-gray-500 text-xs mt-0.5">{addon.detail}</p>}
                      </div>
                    </div>
                    <p className="font-display text-forest-700 text-base shrink-0">{centsToAud(addon.priceCents)}</p>
                  </div>
                )
              })}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">All add-ons installed in Australia. Prices AUD.</p>
          <button onClick={() => setStep(4)} className="text-gray-400 text-sm hover:underline mt-2 block">
            Skip add-ons →
          </button>
        </StepPanel>
      )}

      {/* Step 4 — Find Your Van */}
      {!isVanFirst && step === 4 && (
        <StepPanel title="Find Your Van" onBack={() => setStep(3)} onNext={() => setStep(5)}>
          {isJapanBuild ? (
            <div className="bg-forest-50 border border-forest-200 rounded-xl px-4 py-3 text-sm text-forest-800 mb-6 flex gap-3">
              <span className="shrink-0">🇯🇵</span>
              <p>
                Your {isTama ? 'TAMA' : 'MANA'} is built in Japan — showing Japan auction and dealer vans.
                The van price is added separately to the conversion fee.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 mb-6 flex gap-3">
              <span className="shrink-0">🇦🇺</span>
              <p>
                Your build is done in Australia — you can source a Japan van through us, use our AU stock,
                or bring your own Hiace.
              </p>
            </div>
          )}

          {/* BYO option for AU builds */}
          {!isJapanBuild && (
            <div className="mb-6">
              <div
                onClick={() => { setIsBYO(v => !v); setSelectedVan(null) }}
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${
                  isBYO ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">Bring Your Own Van (BYO)</p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Already own a Hiace? We can convert your van. Contact us to confirm compatibility.
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Compatible: Toyota Hiace H200 LWB (MANA/Bare Camper). H200, 300 Series, VW T5, Mercedes Vito/Sprinter (pop top).
                    </p>
                  </div>
                  <div className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isBYO ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                  }`}>
                    {isBYO && <Checkmark />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Van listing cards */}
          {!isBYO && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                {isJapanBuild ? 'Matching Japan Vans' : 'Available Vans'}
              </p>
              {suggestedVans.length > 0 ? (
                <div className="space-y-3">
                  {suggestedVans.slice(0, 6).map(van => (
                    <div
                      key={van.id}
                      onClick={() => setSelectedVan(prev => prev?.id === van.id ? null : van)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-colors flex items-center gap-4 ${
                        selectedVan?.id === van.id
                          ? 'border-forest-500 bg-forest-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                        {van.photos[0]
                          ? <img src={van.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">🚐</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{van.model_name}</p>
                        <p className="text-xs text-gray-500">
                          {van.model_year} · {van.drive} · {van.mileage_km?.toLocaleString() ?? '—'} km
                        </p>
                        <span className={`inline-block mt-1 text-white text-xs font-bold px-1.5 py-0.5 rounded ${sourceBadgeColor(van.source)}`}>
                          {sourceLabel(van.source)}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        {(() => {
                          const { priceCents, isEstimate } = listingDisplayPrice(van, jpyRate)
                          return (
                            <>
                              <p className="font-display text-forest-700 text-base">
                                {priceCents ? `${isEstimate ? '~' : ''}${centsToAud(priceCents)}` : 'POA'}
                              </p>
                              {isEstimate && priceCents && (
                                <p className="text-xs text-gray-400">est. incl. import</p>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-4">No matching vans right now.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/browse${isJapanBuild ? '?source=auction' : ''}`} className="btn-secondary text-sm px-4 py-2.5">
                  Browse All Vans →
                </Link>
                {!selectedVan && (
                  <button onClick={() => setStep(5)} className="text-gray-400 text-sm hover:underline">
                    Skip — find a van later
                  </button>
                )}
              </div>
            </>
          )}
        </StepPanel>
      )}

      {/* Step 5 — Summary */}
      {!isVanFirst && step === 5 && (
        <SummaryStep
          priceLines={priceLines}
          totalCents={totalCents}
          selectedVan={selectedVan}
          isBYO={isBYO}
          buildLocation={buildLocation}
          isVanFirst={false}
          fitoutSlug={fitoutSlug}
          manaLocation={manaLocation}
          electrical={electrical}
          popTop={popTop}
          manaIncludesPopTop={manaIncludesPopTop}
          selectedAddons={selectedAddons}
          savedBuild={savedBuild}
          saving={saving}
          shareToast={shareToast}
          onShare={handleShare}
          leadSent={leadSent}
          onLeadSubmit={handleLeadSubmit}
          onBack={() => setStep(4)}
          onReset={() => { handleFitoutChange(null); setStep(0); saveAttempted.current = false; setSavedBuild(null) }}
        />
      )}

      {/* ════════════════════════════════════════════════════════
          STICKY SUMMARY BAR
      ════════════════════════════════════════════════════════ */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-forest-950 text-white py-3 px-4 z-50 border-t border-white/10 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Your build</p>
              <p className="text-sm font-medium truncate">
                {[
                  fitoutSlug === 'tama' && 'TAMA',
                  fitoutSlug === 'mana' && 'MANA',
                  fitoutSlug === 'grid' && 'Bare Camper',
                  electrical?.name,
                  (popTop && !manaIncludesPopTop) && 'Pop Top',
                  manaIncludesPopTop && 'Pop Top (incl.)',
                  selectedAddons.length > 0 && `${selectedAddons.length} add-on${selectedAddons.length > 1 ? 's' : ''}`,
                ].filter(Boolean).join(' + ') || 'Configure your build →'}
              </p>
            </div>
            <div className="text-right shrink-0">
              {totalCents > 0 ? (
                <p className="font-display text-sand-400 text-xl">{centsToAud(totalCents)}</p>
              ) : (
                <p className="font-display text-sand-400 text-xl">—</p>
              )}
            </div>
            <button
              onClick={() => setStep(steps.length - 1)}
              className="shrink-0 bg-sand-400 text-forest-950 font-semibold text-xs px-3 py-2 rounded-lg hover:bg-sand-300 transition-colors"
            >
              Summary
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StepPanel({
  title, children, onBack, onNext,
}: {
  title: string
  children: React.ReactNode
  onBack?: () => void
  onNext?: () => void
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-forest-900 mb-6">{title}</h2>
      {children}
      <div className="flex gap-3 mt-8">
        {onBack && (
          <button onClick={onBack} className="btn-secondary">← Back</button>
        )}
        {onNext && (
          <button onClick={onNext} className="btn-primary ml-auto">Continue →</button>
        )}
      </div>
    </div>
  )
}

function BuildOption({
  title, subtitle, detail, fromPrice, badge, badgeColor, selected, onSelect,
}: {
  title: string; subtitle: string; detail: string; fromPrice: string
  badge: string; badgeColor: string; selected: boolean; onSelect: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${
        selected ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-display text-2xl text-forest-900">{title}</h3>
        <span className={`${badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded shrink-0`}>{badge}</span>
      </div>
      <p className="font-medium text-gray-700 text-sm mb-1">{subtitle}</p>
      <p className="text-gray-500 text-xs leading-relaxed mb-4">{detail}</p>
      <p className="font-display text-forest-700 text-xl">{fromPrice}</p>
    </div>
  )
}

function ProductCard({
  product, selected, onSelect,
}: { product: Product; selected: boolean; onSelect: () => void }) {
  const isSpecial = activeSpecial(product)
  const price     = effectivePrice(product)
  return (
    <div
      onClick={onSelect}
      className={`border-2 rounded-2xl p-5 cursor-pointer transition-colors ${
        selected ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <p className="font-semibold text-gray-900">{product.name}</p>
        {isSpecial && product.special_label && (
          <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">{product.special_label}</span>
        )}
      </div>
      {product.description && (
        <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
      )}
      <p className="font-display text-forest-700 text-xl mt-3">
        {price === 0 ? 'Contact for price' : centsToAud(price)}
      </p>
      {isSpecial && product.rrp_aud > 0 && (
        <p className="text-sm text-gray-400 line-through">{centsToAud(product.rrp_aud)}</p>
      )}
    </div>
  )
}

function VanSummaryCard({ listing, showPrice = false }: { listing: Listing; showPrice?: boolean }) {
  const photo = listing.photos[0]
  return (
    <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="w-20 h-16 rounded-lg bg-gray-200 overflow-hidden shrink-0">
        {photo
          ? <img src={photo} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">🚐</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{listing.model_name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {listing.model_year} · {listing.drive ?? '—'} · {listing.mileage_km?.toLocaleString() ?? '—'} km
        </p>
        {listing.inspection_score && (
          <p className="text-xs text-gray-400 mt-0.5">Grade {listing.inspection_score}</p>
        )}
      </div>
      {showPrice && (
        <div className="text-right shrink-0">
          <p className="font-display text-forest-700 text-lg">
            {listing.au_price_aud
              ? centsToAud(listing.au_price_aud)
              : listing.aud_estimate
              ? `~${centsToAud(listing.aud_estimate)}`
              : 'POA'}
          </p>
        </div>
      )}
    </div>
  )
}

function SummaryStep({
  priceLines, totalCents, selectedVan, isBYO, buildLocation, isVanFirst, fitoutSlug,
  manaLocation, electrical, popTop, manaIncludesPopTop, selectedAddons,
  savedBuild, saving, shareToast, onShare,
  leadSent, onLeadSubmit, onBack, onReset,
}: {
  priceLines: PriceLine[]
  totalCents: number
  selectedVan: Listing | null
  isBYO: boolean
  buildLocation: BuildLocation | null
  isVanFirst: boolean
  fitoutSlug: FitoutSlug
  manaLocation: ManaLocation
  electrical: Product | null
  popTop: boolean
  manaIncludesPopTop: boolean
  selectedAddons: string[]
  savedBuild: { id: string; slug: string } | null
  saving: boolean
  shareToast: string | null
  onShare: () => void
  leadSent: boolean
  onLeadSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onBack: () => void
  onReset: () => void
}) {
  const isDepositCTA = selectedVan?.source === 'auction' || selectedVan?.source === 'au_stock'
  const depositLeadType = isDepositCTA ? 'deposit_intent' : 'consultation'
  const ctaLabel = selectedVan?.source === 'auction'  ? 'Hold This Van — $500 Deposit'
    : selectedVan?.source === 'au_stock'              ? 'Reserve Now — $500 Deposit'
    : selectedVan                                     ? 'Express Interest — Book a Call'
    : isBYO                                           ? 'Book a Consultation'
    :                                                   'Save My Build & Find a Van'

  const fitoutLabel = fitoutSlug === 'tama' ? 'TAMA' : fitoutSlug === 'mana' ? 'MANA' : fitoutSlug === 'grid' ? 'Bare Camper' : 'No Fit-Out'
  const electricalLabel = electrical?.name ?? null
  const popTopLabel = popTop ? 'Pop Top' : null

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-secondary text-sm">← Back</button>
        <h2 className="font-display text-2xl text-forest-900">Your Build Summary</h2>
      </div>

      <div className="lg:grid lg:grid-cols-5 lg:gap-8 lg:items-start">

        {/* ── LEFT COLUMN (3/5): Build details ── */}
        <div className="lg:col-span-3 space-y-4 mb-6 lg:mb-0">

          {/* Build location banner */}
          {buildLocation && (
            <div className={`flex gap-3 rounded-xl px-4 py-3 text-sm ${
              buildLocation === 'japan'
                ? 'bg-forest-50 border border-forest-200 text-forest-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <span className="shrink-0 text-base">{buildLocation === 'japan' ? '🇯🇵' : '🇦🇺'}</span>
              <p>
                {buildLocation === 'japan'
                  ? 'Converted at our Tokyo facility and shipped to Australia. Pop top fitted in Brisbane after arrival.'
                  : 'Converted at our Brisbane workshop.'}
              </p>
            </div>
          )}

          {/* Van section */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Van</h3>
            </div>
            <div className="px-5 py-4">
              {isBYO ? (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚐</span>
                  <div>
                    <p className="font-semibold text-gray-900">Your Own Van (BYO)</p>
                    <p className="text-sm text-gray-500 mt-0.5">Compatibility confirmed at consultation.</p>
                  </div>
                </div>
              ) : selectedVan ? (
                <div className="flex items-start gap-3">
                  {selectedVan.photos?.[0] && (
                    <img src={selectedVan.photos[0]} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 leading-tight">{selectedVan.model_name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {selectedVan.model_year && `${selectedVan.model_year} · `}
                      {selectedVan.mileage_km ? `${selectedVan.mileage_km.toLocaleString()} km` : ''}
                    </p>
                    {selectedVan.source === 'auction' && (
                      <span className="badge-auction text-xs mt-1 inline-block">Auction</span>
                    )}
                    {selectedVan.source === 'au_stock' && (
                      <span className="badge-au-stock text-xs mt-1 inline-block">AU Stock</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No van selected yet — to be sourced.</p>
              )}
            </div>
          </div>

          {/* Fit-out section */}
          {fitoutSlug && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Conversion</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{fitoutLabel}</p>
                    {fitoutSlug === 'tama' && <p className="text-xs text-gray-500 mt-0.5">6-seat family campervan · Japan build</p>}
                    {fitoutSlug === 'mana' && <p className="text-xs text-gray-500 mt-0.5">Premium adventure van · {manaLocation === 'japan' ? 'Japan build' : 'AU build'}</p>}
                    {fitoutSlug === 'grid' && <p className="text-xs text-gray-500 mt-0.5">Off-grid specialist · Brisbane workshop</p>}
                  </div>
                </div>
                {electricalLabel && (
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                    <span className="text-gray-600">⚡ {electricalLabel}</span>
                  </div>
                )}
                {(popTopLabel || manaIncludesPopTop) && (
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                    <span className="text-gray-600">
                      {manaIncludesPopTop ? '🔼 Pop Top — included with MANA' : `🔼 ${popTopLabel}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {selectedAddons.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Add-Ons</h3>
              </div>
              <div className="px-5 py-4">
                <ul className="space-y-2">
                  {selectedAddons.map(id => {
                    const addon = ADDON_CATALOG.find(a => a.slug === id)
                    return addon ? (
                      <li key={id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{addon.name}</span>
                        <span className="text-gray-500 font-medium">{centsToAud(addon.priceCents)}</span>
                      </li>
                    ) : null
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Indicative Timeline</h3>
            </div>
            <div className="px-5 py-4">
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-forest-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <div><p className="font-medium text-gray-800">Consultation &amp; deposit</p><p className="text-gray-500 text-xs">Confirm spec, sign off, lock in slot</p></div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-forest-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <p className="font-medium text-gray-800">{buildLocation === 'japan' ? 'Van sourced &amp; converted in Japan' : 'Van sourced &amp; converted in Brisbane'}</p>
                    <p className="text-gray-500 text-xs">{buildLocation === 'japan' ? '6–10 weeks build + 4–6 weeks shipping' : '4–8 weeks'}</p>
                  </div>
                </li>
                {buildLocation === 'japan' && (popTopLabel || manaIncludesPopTop) && (
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-forest-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <div><p className="font-medium text-gray-800">Pop top fitted in Brisbane</p><p className="text-gray-500 text-xs">After van arrives from Japan</p></div>
                  </li>
                )}
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-sand-400 text-white text-xs font-bold flex items-center justify-center shrink-0">{buildLocation === 'japan' && (popTopLabel || manaIncludesPopTop) ? '4' : '3'}</span>
                  <div><p className="font-medium text-gray-800">Handover &amp; on the road</p><p className="text-gray-500 text-xs">QLD rego, full walk-through</p></div>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (2/5): Price card + CTAs ── */}
        <div className="lg:col-span-2 lg:sticky lg:top-24 space-y-4">

          {/* Price breakdown card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-forest-950 text-white px-5 py-4">
              <h3 className="font-display text-xl">Price Breakdown</h3>
              <p className="text-white/60 text-xs mt-0.5">Estimates — confirmed at consultation</p>
            </div>
            <div className="divide-y divide-gray-100">
              {priceLines.map((line, i) => (
                <div key={i} className="flex justify-between items-start px-5 py-3">
                  <div>
                    <p className="font-medium text-gray-700 text-sm">{line.label}</p>
                    {line.note && <p className="text-xs text-gray-400 mt-0.5">{line.note}</p>}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm ml-4 shrink-0">
                    {line.price === null ? 'Included' : centsToAud(line.price)}
                  </span>
                </div>
              ))}
              {priceLines.length === 0 && (
                <div className="px-5 py-3 text-gray-400 text-sm">No items selected yet.</div>
              )}
            </div>
            <div className="bg-forest-50 px-5 py-4 flex justify-between items-center">
              <span className="font-display text-lg text-forest-900">Estimated Total</span>
              <span className="font-display text-2xl text-forest-700">
                {totalCents > 0 ? centsToAud(totalCents) : '—'}
              </span>
            </div>
            <p className="px-5 pb-4 text-xs text-gray-400 leading-relaxed">
              {fitoutSlug === 'tama' || fitoutSlug === 'mana'
                ? 'Base price includes van + full conversion.'
                : 'Van price estimated from current exchange rates.'}
              {' '}All prices AUD incl. GST.
            </p>
          </div>

          {/* Share button */}
          <div className="space-y-2">
            <button
              onClick={onShare}
              disabled={saving}
              className="btn-secondary w-full py-3 text-sm disabled:opacity-60"
            >
              {saving ? 'Saving…' : savedBuild ? '🔗 Copy Share Link' : '🔗 Share My Build'}
            </button>
            {shareToast && (
              <p className="text-center text-xs text-forest-700 font-medium">{shareToast}</p>
            )}
          </div>

          {/* Lead capture */}
          {!leadSent ? (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-display text-lg text-forest-900">{ctaLabel}</h3>
                {isDepositCTA && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    No payment here — we&apos;ll contact you to arrange the $500 refundable deposit.
                  </p>
                )}
              </div>
              <form onSubmit={onLeadSubmit} className="px-5 py-4 space-y-3">
                <input name="name"  required placeholder="Your name"     className="input-field" />
                <input name="email" type="email" required placeholder="Email address"  className="input-field" />
                <input name="phone" type="tel"   placeholder="Phone (optional)" className="input-field" />
                <button type="submit" className="btn-primary w-full py-3">
                  {ctaLabel} →
                </button>
                <p className="text-center text-xs text-gray-400">
                  Or email{' '}
                  <a href="mailto:jared@dreamdrive.life" className="text-forest-600 hover:underline">
                    jared@dreamdrive.life
                  </a>
                </p>
              </form>
            </div>
          ) : (
            <div className="bg-forest-50 border border-forest-200 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-display text-lg text-forest-800">We&apos;ll be in touch!</h3>
              <p className="text-forest-600 text-sm mt-1">
                Jared will reach out within 24 hours to confirm your build and next steps.
              </p>
            </div>
          )}

          {/* Reset */}
          <button
            onClick={onReset}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  )
}

function Checkmark() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
