'use client'

import { useState } from 'react'
import Image from 'next/image'
import PageEditToolbar, { EditableImage } from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'
import { formatAud } from '@/lib/pricing'
import OptionsList from '@/components/options/OptionsList'
import EnquiryCTA from '@/components/EnquiryCTA'

interface Props { conversionAud: number; low: number; high: number; jpyRate: number; content: Record<string, string>; vanId?: string | null; vanName?: string | null; vanPriceCents?: number | null }

const KUMA_INCLUSIONS = [
  'Transforming rear seat with ISOFIX (except 2-seater options)',
  'Walnut countertop',
  'Table with adjustable attachment',
  'Modular queen-size bed kit or low bed with storage beneath',
  'Handcrafted furniture',
  'Quality hardware & hinges',
  'Deep sink & faucet',
  'High pressure pump',
  'Quick release shower hose',
  '38L fresh water tank',
  '2 x 100AH lithium battery',
  'D/C charger',
  'LED down lights',
  'Dimmable LED light bar',
  '2000W inverter',
  'A/C charging outlets x2',
  '40L refrigerator',
  'Shore power charger',
]

const KUMA_VEHICLE_SPECS = {
  dimensions: '5,380mm L x 1,880mm W x 2,400mm H',
  transmission: 'Automatic',
  options: [
    { name: '2WD, 2.7L Unleaded Engine (3 front seats)', price: '$120,000' },
    { name: '4x4, 2.8L Turbo Diesel (2 front seats)', price: '$127,000' },
  ],
}

const KUMA_MID_LAYOUTS = [
  { name: 'FAMILY', key: 'layout_family', fallback: '/images/tama/interior-overview.jpg', desc: 'Rear folding seat (2 extra seatbelts, ISOFIX) with high bed. The ideal layout for families who need seating capacity alongside camping facilities.' },
  { name: 'VANLIFE', key: 'layout_vanlife', fallback: '/images/tama/storage-underseat.jpg', desc: 'Rear bench seat with slide-out drawer. Optimised for couples or solo adventurers wanting maximum storage and living space.' },
  { name: 'STORAGE+', key: 'layout_storage', fallback: '/images/tama/kitchen-walnut.jpg', desc: 'Rear bench, slide-out kitchen, 85L fridge/freezer with open door. +$2,000. Maximum kitchen and storage for extended trips.' },
]

const KUMA_BED_LAYOUTS = [
  { name: 'LOW BED', key: 'bed_low', fallback: '/images/tama/bed-blue.jpg', desc: 'Fixed bed with drawer storage underneath. Easy access and practical for everyday use.' },
  { name: 'HIGH BED', key: 'bed_high', fallback: '/images/tama/bed-green.jpg', desc: 'Stow-away panels and open space under the bed. Great for storing bikes, surfboards, or bulky gear.' },
  { name: 'STORAGE+', key: 'bed_storage', fallback: '/images/tama/drawer-slideout.jpg', desc: 'High bed with upper cabinet storage, toilet, and extra cabinet under bed. +$750. The ultimate storage solution.' },
]

export default function KumaQProductClient({ conversionAud, low, high, jpyRate, content: initial, vanId, vanName, vanPriceCents }: Props) {
  const [content, setContent] = useState(initial)

  const configuratorUrl = vanId
    ? `https://configure.barecamper.com.au/?model=kuma-q&source=barecamper&van_id=${vanId}&van_name=${encodeURIComponent(vanName ?? '')}&van_price=${vanPriceCents ? Math.round(vanPriceCents / 100) : ''}`
    : 'https://configure.barecamper.com.au/?model=kuma-q'

  const extraImages = [
    ...KUMA_MID_LAYOUTS.map(l => ({ key: l.key + '_image', label: l.name + ' Photo' })),
    ...KUMA_BED_LAYOUTS.map(b => ({ key: b.key + '_image', label: b.name + ' Photo' })),
  ]

  return (
    <div className="min-h-screen bg-white">
      <PageEditToolbar pageSlug="kuma-q-product" pageName="KUMA-Q Product" content={content} onContentChange={setContent} extraImages={extraImages} />

      {/* Hero */}
      <FitoutHero fallbackImage="/images/kuma/exterior-side.jpg" heroImage={content.hero_image} heroVideo={content.hero_video}>
        <div className="pt-16">
          <p className="text-sand text-xs font-semibold tracking-[0.25em] uppercase mb-3">Bare Camper</p>
          <h1 className="text-7xl md:text-9xl text-white leading-none mb-3">KUMA-Q</h1>
          <p className="sr-only">KUMA-Q Super Long Campervan Conversion — Toyota Hiace</p>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-2">The Ultimate Road Trip Campervan</p>
          <p className="text-white/60 text-base md:text-lg max-w-xl">Toyota Hiace H200 Super Long Wheelbase. Seating and sleeping for up to 4. Everything you need to hit the road in style.</p>
        </div>
      </FitoutHero>

      {/* Photo Gallery */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { src: '/images/kuma/interior-dining.jpg', alt: 'KUMA-Q interior with dining table and seats' },
            { src: '/images/kuma/interior-kitchen.jpg', alt: 'KUMA-Q galley kitchen with walnut countertop' },
            { src: '/images/kuma/interior-bed.jpg', alt: 'KUMA-Q queen bed layout' },
            { src: '/images/kuma/exterior-front.jpg', alt: 'KUMA-Q front exterior with khaki wrap' },
            { src: '/images/kuma/interior-rear.jpg', alt: 'KUMA-Q rear interior view' },
            { src: '/images/kuma/exterior-rear.jpg', alt: 'KUMA-Q rear exterior view' },
          ].map((img, i) => (
            <div key={i} className="relative h-48 md:h-64 rounded-xl overflow-hidden">
              <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
            </div>
          ))}
        </div>
      </section>

      {/* Vehicle Specs */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Choice of Vehicle</p>
        <h2 className="text-4xl text-charcoal mb-4">Toyota Hiace H200 — Super Long Wheelbase</h2>
        <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">The H200 is the only model Hiace sold in Japan where the cabin-over-engine design maximises space in the cabin. SLWB dimensions: {KUMA_VEHICLE_SPECS.dimensions}. Automatic transmission.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {KUMA_VEHICLE_SPECS.options.map(opt => (
            <div key={opt.name} className="flex items-center justify-between border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <span className="text-gray-700">{opt.name}</span>
              <span className="text-2xl font-bold text-ocean">{opt.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Included Standard */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Everything in the box</p>
          <h2 className="text-4xl text-charcoal mb-12">Included Standard</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4">
            {KUMA_INCLUSIONS.map(item => (
              <div key={item} className="flex items-start gap-3 py-2 border-b border-gray-200/60">
                <span className="text-ocean mt-0.5 shrink-0"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>
                <span className="text-gray-700 text-sm leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid Section Layout */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Tailored for you</p>
        <h2 className="text-4xl text-charcoal mb-10">Choice of Mid Section Layout</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {KUMA_MID_LAYOUTS.map(opt => (
            <div key={opt.name} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <EditableImage src={content[opt.key + '_image'] || opt.fallback} alt={opt.name} className="h-48" placeholderText={`${opt.name} photo coming soon`} />
              <div className="p-5">
                <p className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">{opt.name}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{opt.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bed Layout */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Sleep your way</p>
          <h2 className="text-4xl text-charcoal mb-10">Choice of Bed Layout</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {KUMA_BED_LAYOUTS.map(opt => (
              <div key={opt.name} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                <EditableImage src={content[opt.key + '_image'] || opt.fallback} alt={opt.name} className="h-48" placeholderText={`${opt.name} photo coming soon`} />
                <div className="p-5">
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
        <OptionsList source="kuma-q" />
      </section>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <EnquiryCTA defaultModel="kuma-q" />
      </div>
    </div>
  )
}
