'use client'

import { useState } from 'react'
import Link from 'next/link'

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
  storage:            'Storage in Japan',
  design_approval:    'Design Approval',
  van_building:       'Van Building',
  shipping:           'Shipping',
  compliance:         'Compliance',
  pop_top_install:    'Pop Top Installation',
  ready_for_delivery: 'Ready for Delivery',
  delivered:          'Delivered',
}

const STAGE_MESSAGES: Record<string, string> = {
  vehicle_selection:  "We're finding the perfect van for your build.",
  bidding:            "Your van is going to auction. We'll let you know the result.",
  purchase:           'Congratulations! Your van has been secured.',
  storage:            'Your van is safely stored in Japan, waiting for its transformation.',
  design_approval:    "Your build design is being finalised. We'll share the details soon.",
  van_building:       'Our craftsmen are building your dream van right now.',
  shipping:           'Your van is on the water, heading to Australia!',
  compliance:         'Your van is going through Australian import compliance.',
  pop_top_install:    'Your pop top is being fitted at our Brisbane workshop.',
  ready_for_delivery: 'Your van is ready! Time to start your adventure.',
  delivered:          "You're on the road! Welcome to the Bare Camper family.",
}

const BUILD_INFO: Record<string, { name: string; tagline: string; description: string; inclusions: string[] }> = {
  tama: {
    name: 'TAMA',
    tagline: 'The Family Adventure Van',
    description: 'A 6-seat people mover with walnut countertop, galley kitchen, and full electrical system. Built at our Tokyo facility by expert craftsmen.',
    inclusions: [
      'Transforming rear seat with ISOFIX',
      'Walnut countertop',
      '40L refrigerator',
      'Galley kitchen with sink & water system',
      '2 x 100AH lithium batteries',
      '2000W inverter',
      'Full LED lighting',
      'USB-C charging points',
      'Roof-mounted storage',
      'Premium upholstery',
    ],
  },
  mana_japan: {
    name: 'MANA',
    tagline: 'The Ultimate Touring Van',
    description: 'Built in Japan. A premium touring setup designed for extended road trips and off-grid living.',
    inclusions: [
      'Full kitchen with gas cooktop',
      'Fridge/freezer combo',
      'Expandable bed system',
      'Hot water system',
      'Full electrical with solar',
      'External shower',
      'Premium cabinetry',
      'LED lighting throughout',
    ],
  },
  mana_australia: {
    name: 'MANA',
    tagline: 'The Ultimate Touring Van',
    description: 'Built in Australia at our Brisbane facility. Same premium MANA specifications, fitted locally.',
    inclusions: [
      'Full kitchen with gas cooktop',
      'Fridge/freezer combo',
      'Expandable bed system',
      'Hot water system',
      'Full electrical with solar',
      'External shower',
      'Premium cabinetry',
      'LED lighting throughout',
    ],
  },
  bare_camper: {
    name: 'Bare Camper',
    tagline: 'Your Blank Canvas',
    description: 'A clean, insulated shell ready for your own custom build or a DIY fit-out.',
    inclusions: ['Full insulation', 'Carpet lining', 'Basic electrical hookup', 'Rear barn door conversion'],
  },
  pop_top_only: {
    name: 'Pop Top',
    tagline: 'Sleep Under the Stars',
    description: 'A pop top roof conversion fitted at our Brisbane workshop, adding a comfortable sleeping area above.',
    inclusions: ['Pop top roof conversion', 'Double mattress', 'Mesh ventilation panels', 'Interior LED lights'],
  },
}

const LOCATION_BADGE: Record<string, { label: string; bg: string }> = {
  in_japan:     { label: 'IN JAPAN',     bg: 'bg-red-500' },
  on_ship:      { label: 'ON SHIP',      bg: 'bg-orange-500' },
  in_brisbane:  { label: 'IN BRISBANE',  bg: 'bg-green-600' },
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderStage {
  id: string; stage: string; status: 'completed' | 'current' | 'upcoming'
  notes: string | null; entered_at: string | null; completed_at: string | null
  planned_date: string | null; forecast_date: string | null
}
interface Build {
  id: string; build_type: string; build_location: string | null; pop_top: boolean
  addon_slugs: string[]; custom_description: string | null; total_quoted_aud: number | null; notes: string | null
}
interface Listing {
  id: string; model_name: string; model_year: number | null; grade: string | null
  chassis_code: string | null; photos: string[]; mileage_km: number | null; drive: string | null
}
interface Document {
  id: string; name: string; file_url: string; file_type: string | null
  file_size_bytes: number | null; document_type: string; created_at: string
}
interface Props {
  customer: { first_name: string; last_name: string | null } | null
  vehicle: { id: string; vehicle_status: string; vehicle_description: string | null; build_date: string | null }
  listing: Listing | null
  stages: OrderStage[]
  build: Build | null
  documents: Document[]
  addonProducts: { slug: string; name: string }[]
  forSale: { price: number | null; notes: string | null } | null
  locationStatus: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtShortDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function fmtEstDate(iso: string | null) {
  if (!iso) return ''
  return 'Est. ' + new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function centsToAud(cents: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(cents / 100)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MyVanClient({ customer, vehicle, listing, stages, build, documents, addonProducts, forSale, locationStatus }: Props) {
  const [showAllInclusions, setShowAllInclusions] = useState(false)
  const [question, setQuestion] = useState('')
  const [questionSent, setQuestionSent] = useState(false)
  const [sendingQuestion, setSendingQuestion] = useState(false)

  const hasPoptop = build?.pop_top ?? false
  const visibleStageKeys = STAGE_ORDER.filter(s => {
    if (s === 'pop_top_install' && !hasPoptop) return false
    if (s === 'design_approval' && !stages.find(st => st.stage === s)) return false
    return true
  })
  const sortedStages = visibleStageKeys.map(k => stages.find(s => s.stage === k)).filter((s): s is OrderStage => !!s)
  const currentStage = sortedStages.find(s => s.status === 'current')
  const currentIdx   = currentStage ? visibleStageKeys.indexOf(currentStage.stage) : -1
  const pctComplete  = sortedStages.length > 0 ? Math.round(((currentIdx + 1) / sortedStages.length) * 100) : 0

  const buildInfo = build ? BUILD_INFO[build.build_type] ?? null : null
  const heroPhoto = listing?.photos?.[0] ?? null
  const vanLabel  = listing
    ? `${listing.model_year ?? ''} Toyota HiAce ${listing.grade ?? ''} ${listing.drive ?? ''}`.trim()
    : vehicle.vehicle_description || 'Your Van'

  const buildLabel = buildInfo
    ? `${buildInfo.name} Build${build?.build_location ? ` \u2022 Built in ${build.build_location === 'japan' ? 'Japan' : 'Australia'}` : ''}`
    : build?.build_type === 'custom' ? 'Custom Build' : ''

  const locBadge = LOCATION_BADGE[locationStatus] ?? LOCATION_BADGE.in_japan

  const sendQuestion = async () => {
    if (!question.trim()) return
    setSendingQuestion(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'consultation',
          name: customer ? `${customer.first_name} ${customer.last_name ?? ''}`.trim() : null,
          source: 'my_van',
          notes: `Question from /my-van/${vehicle.id}:\n${question}`,
        }),
      })
      setQuestionSent(true)
      setQuestion('')
    } catch { /* ignore */ }
    setSendingQuestion(false)
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="relative overflow-hidden">
        {heroPhoto ? (
          <div className="relative h-[340px] md:h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroPhoto} alt={vanLabel} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-12">
              <Link href="/" className="inline-flex items-center gap-2 text-white/70 text-sm mb-4 hover:text-white">
                Dream Drive
              </Link>
              <h1 className="text-3xl md:text-4xl text-white leading-tight">
                Your Bare Camper
              </h1>
              <p className="text-white/80 mt-2 text-sm md:text-base">{vanLabel}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {buildLabel && <span className="inline-block bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full">{buildLabel}</span>}
                <span className={`inline-block ${locBadge.bg} text-white text-xs font-bold px-3 py-1 rounded-full`}>{locBadge.label}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-charcoal px-6 md:px-12 py-12 md:py-16">
            <Link href="/" className="inline-flex items-center gap-2 text-white/70 text-sm mb-6 hover:text-white">
              Dream Drive
            </Link>
            <h1 className="text-3xl md:text-4xl text-white leading-tight">
              Your Bare Camper
            </h1>
            <p className="text-white/80 mt-2 text-sm md:text-base">{vanLabel}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {buildLabel && <span className="inline-block bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full">{buildLabel}</span>}
              <span className={`inline-block ${locBadge.bg} text-white text-xs font-bold px-3 py-1 rounded-full`}>{locBadge.label}</span>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-3xl mx-auto px-5 md:px-8 py-10 space-y-12">

        {/* ── 1. Stage Tracker ── */}
        <section>
          <h2 className="text-2xl text-charcoal mb-1">Your Journey</h2>
          {currentStage && (
            <p className="text-sm text-gray-500 mb-5">
              Stage {currentIdx + 1} of {sortedStages.length} — {STAGE_LABELS[currentStage.stage]}
            </p>
          )}

          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
            <div className="h-full bg-ocean rounded-full transition-all duration-700" style={{ width: `${pctComplete}%` }} />
          </div>

          {/* Vertical timeline */}
          <div className="space-y-0">
            {sortedStages.map((stage, i) => {
              const done     = stage.status === 'completed'
              const active   = stage.status === 'current'
              const upcoming = stage.status === 'upcoming'
              const isLast   = i === sortedStages.length - 1
              const forecast = stage.forecast_date ?? stage.planned_date

              return (
                <div key={stage.stage} className="relative flex gap-4">
                  {/* Vertical line + dot */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                      done   ? 'bg-ocean border-ocean text-white' :
                      active ? 'bg-white border-ocean text-ocean ring-4 ring-cream' :
                               'bg-gray-50 border-gray-200 text-gray-300'
                    }`}>
                      {done ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : active ? (
                        <span className="relative">
                          <span className="text-sm font-bold">{i + 1}</span>
                          <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-sand rounded-full animate-pulse" />
                        </span>
                      ) : (
                        <span className="text-sm font-bold">{i + 1}</span>
                      )}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 min-h-[20px] ${done ? 'bg-ocean' : 'bg-gray-200'}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                    <p className={`font-semibold leading-tight ${active ? 'text-charcoal text-base' : done ? 'text-gray-800 text-sm' : 'text-gray-400 text-sm'}`}>
                      {STAGE_LABELS[stage.stage]}
                    </p>

                    {done && stage.completed_at && (
                      <p className="text-xs text-ocean mt-0.5">Completed {fmtDate(stage.completed_at)}</p>
                    )}
                    {active && stage.entered_at && (
                      <p className="text-xs text-ocean mt-0.5">
                        Since {fmtDate(stage.entered_at)}
                        {forecast && <span className="text-gray-400 ml-2">{fmtEstDate(forecast)}</span>}
                      </p>
                    )}
                    {upcoming && forecast && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">{fmtEstDate(forecast)}</p>
                    )}
                    {upcoming && !forecast && (
                      <p className="text-xs text-gray-300 mt-0.5 italic">Coming soon</p>
                    )}

                    {/* Current stage message */}
                    {active && STAGE_MESSAGES[stage.stage] && (
                      <div className="mt-2 bg-cream border border-cream rounded-xl px-4 py-3">
                        <p className="text-sm text-charcoal">{STAGE_MESSAGES[stage.stage]}</p>
                      </div>
                    )}

                    {/* Stage notes (admin-written) */}
                    {(done || active) && stage.notes && (
                      <div className="mt-2 bg-cream border border-sand rounded-xl px-4 py-2.5">
                        <p className="text-xs text-gray-600">{stage.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── 2. Your Build ── */}
        {build && build.build_type !== 'none' && (
          <section>
            <h2 className="text-2xl text-charcoal mb-5">Your Build</h2>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
              <div className="p-6">
                {buildInfo ? (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cream text-ocean flex items-center justify-center text-2xl shrink-0">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.59-5.59a2 2 0 010-2.83l.83-.83a2 2 0 012.83 0L15.17 11.42M20 20l-4.24-4.24" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl text-charcoal">{buildInfo.name}</h3>
                        <p className="text-sm text-gray-500 italic">{buildInfo.tagline}</p>
                        <p className="text-sm text-gray-700 mt-2">{buildInfo.description}</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What&apos;s included</p>
                      <ul className="space-y-1.5">
                        {(showAllInclusions ? buildInfo.inclusions : buildInfo.inclusions.slice(0, 5)).map(item => (
                          <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-ocean shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                      {buildInfo.inclusions.length > 5 && (
                        <button onClick={() => setShowAllInclusions(v => !v)} className="mt-2 text-xs text-ocean hover:underline font-medium">
                          {showAllInclusions ? 'Show less' : `See all ${buildInfo.inclusions.length} inclusions`}
                        </button>
                      )}
                    </div>
                  </>
                ) : build.build_type === 'custom' && build.custom_description ? (
                  <div>
                    <h3 className="text-xl text-charcoal mb-1">Custom Build</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{build.custom_description}</p>
                  </div>
                ) : (
                  <h3 className="text-xl text-charcoal">{build.build_type}</h3>
                )}

                {/* Add-ons */}
                {(addonProducts.length > 0 || build.pop_top) && (
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add-ons</p>
                    <ul className="space-y-1.5">
                      {build.pop_top && (
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-ocean shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Pop Top Roof Conversion
                        </li>
                      )}
                      {addonProducts.map(p => (
                        <li key={p.slug} className="flex items-start gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-ocean shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Total */}
                {build.total_quoted_aud && (
                  <div className="mt-5 pt-5 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">Build Total</span>
                    <span className="text-lg text-charcoal">{centsToAud(build.total_quoted_aud)}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── 3. Documents ── */}
        {documents.length > 0 && (
          <section>
            <h2 className="text-2xl text-charcoal mb-5">Documents</h2>
            <div className="space-y-2">
              {documents.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => window.open(doc.file_url, '_blank')}
                  className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl px-4 py-3 transition-colors text-left"
                >
                  <span className="text-2xl shrink-0">{doc.file_type === 'pdf' ? '\uD83D\uDCC4' : doc.file_type === 'image' ? '\uD83D\uDCF8' : '\uD83D\uDCCE'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">{fmtShortDate(doc.created_at)}{doc.file_size_bytes ? ` \u00B7 ${(doc.file_size_bytes / 1024).toFixed(0)} KB` : ''}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Ask a Question ── */}
        <section>
          <h2 className="text-2xl text-charcoal mb-4">Ask a Question</h2>
          {questionSent ? (
            <div className="bg-cream border border-cream rounded-2xl px-6 py-5 text-center">
              <p className="text-charcoal font-semibold">Thanks! We&apos;ll get back to you shortly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Type your question here..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent"
              />
              <button
                onClick={sendQuestion}
                disabled={!question.trim() || sendingQuestion}
                className="text-sm px-5 py-2.5 bg-ocean text-white rounded-xl hover:bg-ocean disabled:opacity-50 font-medium"
              >
                {sendingQuestion ? 'Sending...' : 'Send Question'}
              </button>
            </div>
          )}
        </section>

        {/* ── For Sale Banner ── */}
        {forSale && (
          <section className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-6 py-6">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-xl text-amber-900 mb-1">This Build is Available for Purchase</h3>
                <p className="text-sm text-amber-800 mb-3">This van and build package is available for transfer to a new owner.</p>
                {forSale.notes && <p className="text-sm text-amber-700 mb-3">{forSale.notes}</p>}
                {forSale.price && (
                  <p className="text-lg text-amber-900 mb-4">Asking price: {centsToAud(forSale.price)}</p>
                )}
                <p className="text-sm text-amber-800 font-medium">Interested? Get in touch:</p>
                <div className="mt-2 space-y-1">
                  <a href="mailto:jared@dreamdrive.life" className="text-sm text-ocean hover:underline block">jared@dreamdrive.life</a>
                  <a href="tel:0432182892" className="text-sm text-ocean hover:underline block">0432 182 892</a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Contact Footer ── */}
        <section className="bg-charcoal text-white rounded-2xl px-6 py-8 text-center">
          <h3 className="text-xl mb-2">Questions about your build?</h3>
          <p className="text-white/60 text-sm mb-4">We&apos;re always happy to help.</p>
          <div className="space-y-1.5 text-sm text-white/80">
            <p>Questions? Call Jared: <a href="tel:0432182892" className="hover:text-white font-medium">0432 182 892</a></p>
            <p>Email: <a href="mailto:jared@dreamdrive.life" className="hover:text-white font-medium">jared@dreamdrive.life</a></p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <Link href="/" className="text-sand text-lg hover:text-sand">Bare Camper</Link>
            <p className="text-white/40 text-xs mt-1">Find it. Build it. Drive it.</p>
          </div>
        </section>

      </div>
    </div>
  )
}
