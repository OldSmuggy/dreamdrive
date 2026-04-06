'use client'

import { useState } from 'react'
import Image from 'next/image'
import EnquiryCTA from '@/components/EnquiryCTA'
import PageEditToolbar, { EditableImage } from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'
import { formatAud } from '@/lib/pricing'
import OptionsList, { UNIVERSAL_OPTIONS } from '@/components/options/OptionsList'

interface Props { conversionAud: number; low: number; high: number; jpyRate: number; content: Record<string, string>; vanId?: string | null; vanName?: string | null; vanPriceCents?: number | null }

const TAMA_INCLUSIONS = [
  'Transforming rear seat with ISOFIX (except 2-seater options)', 'Walnut countertop',
  'Table with adjustable attachment', 'Fixed full-length bed with removable panel for extra seating',
  'Handcrafted furniture', 'Quality hardware & hinges', 'Deep sink & faucet', 'High pressure pump',
  'Quick release shower hose', '38L fresh water tank', '2 × 100AH lithium battery', 'D/C charger',
  'LED down lights', 'Dimmable LED light bar', '2000W inverter', 'A/C charging outlets ×2',
  '40L refrigerator', 'Shore power charger',
]

const TAMA_LAYOUTS = [
  { name: 'FAMILY SEAT', key: 'layout_family', fallback: '/images/tama/interior-overview.jpg', desc: 'Rear folding seat with 3 extra seatbelts and ISOFIX child seat anchors. The ideal layout for families who need full seating capacity alongside all camping facilities.' },
  { name: 'VANLIFE', key: 'layout_vanlife', fallback: '/images/tama/storage-underseat.jpg', desc: 'Rear bench seat with slide-out drawer, toilet and pantry space under the bench seat. Optimised for couples or solo adventurers wanting maximum storage and living space.' },
]

const TAMA_BEDS = [
  { name: 'TAMA', key: 'bed_tama', fallback: '/images/tama/bed-blue.jpg', desc: 'Semi double bed, galley kitchen with sink, 40L fridge and cupboard for storage. A well-rounded setup that balances sleeping comfort with kitchen functionality.' },
  { name: 'NICO', key: 'bed_nico', fallback: '/images/tama/bed-green.jpg', desc: 'Full width bed with fixed mattress and integrated storage. Features 2 slide-out drawers with table tops — great for those who prioritise a large, comfortable sleeping area.' },
]


export default function TamaProductClient({ conversionAud, low, high, jpyRate, content: initial, vanId, vanName, vanPriceCents }: Props) {
  const [content, setContent] = useState(initial)

  const configuratorUrl = vanId
    ? `https://configure.barecamper.com.au/?model=tama&source=barecamper&van_id=${vanId}&van_name=${encodeURIComponent(vanName ?? '')}&van_price=${vanPriceCents ? Math.round(vanPriceCents / 100) : ''}`
    : 'https://configure.barecamper.com.au/?model=tama'
  const gallery: string[] = (() => { try { return JSON.parse(content.gallery_images || '[]') } catch { return [] } })()

  const extraImages = [
    ...TAMA_LAYOUTS.map(l => ({ key: l.key + '_image', label: l.name + ' Photo' })),
    ...TAMA_BEDS.map(b => ({ key: b.key + '_image', label: b.name + ' Bed Photo' })),
  ]

  return (
    <div className="min-h-screen bg-white">
      <PageEditToolbar pageSlug="tama-product" pageName="TAMA Product" content={content} onContentChange={setContent} extraImages={extraImages} />

      {/* Hero */}
      <FitoutHero fallbackImage="/images/tama/hero-exterior.jpg" heroImage={content.hero_image} heroVideo={content.hero_video}>
        <div className="pt-16">
          <p className="text-sand text-xs font-semibold tracking-[0.25em] uppercase mb-3">Bare Camper</p>
          <h1 className="text-7xl md:text-9xl text-white leading-none mb-3">TAMA</h1>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-2">The Family Adventure Van</p>
          <p className="text-white/60 text-base md:text-lg max-w-xl">6-seat people mover by day. Fully equipped campervan by night.</p>
        </div>
      </FitoutHero>

      {/* Photo Gallery */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { src: '/images/tama/interior-overview.jpg', alt: 'TAMA interior with bench seat and kitchen' },
            { src: '/images/tama/bed-blue.jpg', alt: 'TAMA bed laid out with timber ceiling' },
            { src: '/images/tama/kitchen-walnut.jpg', alt: 'Walnut countertop detail' },
            { src: '/images/tama/drawer-slideout.jpg', alt: 'Slide-out kitchen drawer' },
            { src: '/images/tama/electrical-outlets.jpg', alt: 'Power outlets and USB charging' },
            { src: '/images/tama/hero-side-open.jpg', alt: 'TAMA side view with pop top and door open' },
          ].map((img, i) => (
            <div key={i} className="relative h-48 md:h-64 rounded-xl overflow-hidden">
              <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
            </div>
          ))}
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gallery.map((url, i) => <div key={i} className="relative h-48 rounded-xl overflow-hidden"><Image src={url} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" /></div>)}
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Pricing</p>
        <h2 className="text-4xl text-charcoal mb-4">What Does a TAMA Cost?</h2>
        <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">The van and conversion are priced separately — because every Japan-sourced Hiace is unique. You choose the van; we do the conversion.</p>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">Conversion Fee</p>
            <p className="text-3xl text-ocean mb-1">{formatAud(conversionAud)}</p>
            <p className="text-gray-400 text-sm">¥4,800,000 at today&apos;s rate</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">Base Vehicle + Import</p>
            <p className="text-3xl text-ocean mb-1">$25,000 – $50,000</p>
            <p className="text-gray-400 text-sm">Hiace from Japan auction or dealer</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-8 bg-cream border-ocean-light hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold tracking-widest text-ocean uppercase mb-2">Total Estimate</p>
            <p className="text-3xl text-ocean mb-1">~{formatAud(low)} – {formatAud(high)}</p>
            <p className="text-gray-500 text-sm">+ $13,090 for pop top (optional)</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">Conversion fee based on today&apos;s JPY/AUD rate ({jpyRate.toFixed(4)}). Final pricing confirmed at consultation.</p>
      </section>

      {/* Included */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Everything in the box</p>
          <h2 className="text-4xl text-charcoal mb-12">Included Standard</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4">
            {TAMA_INCLUSIONS.map(item => (
              <div key={item} className="flex items-start gap-3 py-2 border-b border-gray-200/60">
                <span className="text-ocean mt-0.5 shrink-0"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>
                <span className="text-gray-700 text-sm leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Layouts */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Tailored for you</p>
        <h2 className="text-4xl text-charcoal mb-10">Choice of Layout</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {TAMA_LAYOUTS.map(opt => (
            <div key={opt.name} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <EditableImage src={content[opt.key + '_image'] || opt.fallback} alt={opt.name} className="h-52" placeholderText={`${opt.name} photo coming soon`} />
              <div className="p-6">
                <p className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">{opt.name}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{opt.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Beds */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Sleep the way you want</p>
          <h2 className="text-4xl text-charcoal mb-10">Choice of Bed</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {TAMA_BEDS.map(opt => (
              <div key={opt.name} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                <EditableImage src={content[opt.key + '_image'] || opt.fallback} alt={opt.name} className="h-52" placeholderText={`${opt.name} photo coming soon`} />
                <div className="p-6">
                  <p className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">{opt.name}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Options */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Make it yours</p>
        <h2 className="text-4xl text-charcoal mb-10">Select Options</h2>
        <OptionsList source="tama" />
      </section>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <EnquiryCTA defaultModel="tama" />
      </div>
    </div>
  )
}
