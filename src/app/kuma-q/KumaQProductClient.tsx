'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LeadFormModal from '@/components/leads/LeadFormModal'
import PageEditToolbar, { EditableImage } from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'
import { formatAud } from '@/lib/pricing'
import OptionsList from '@/components/options/OptionsList'

interface Props { conversionAud: number; low: number; high: number; jpyRate: number; content: Record<string, string>; vanId?: string | null; vanName?: string | null; vanPriceCents?: number | null }

const KUMA_INCLUSIONS = [
  'Queen-size bed with premium mattress', 'Galley kitchen with deep sink & faucet',
  'Walnut countertop', 'High pressure water pump', 'Quick release shower hose',
  '38L fresh water tank', '2 x 100AH lithium battery', 'D/C charger',
  'LED down lights', 'Dimmable LED light bar', '2000W inverter',
  'A/C charging outlets x2', '40L refrigerator', 'Shore power charger',
  'Handcrafted furniture with quality hardware', 'Full-length interior fit-out',
  '4-seat dining layout with table', 'Under-bed storage throughout',
]

const KUMA_FEATURES = [
  { name: 'QUEEN BED', key: 'feature_bed', fallback: '/images/tama/bed-blue.jpg', desc: 'Full queen-size bed that spans the entire width of the SLWB Hiace. No compromises on sleep quality — wake up refreshed and ready for the next adventure.' },
  { name: 'GALLEY KITCHEN', key: 'feature_kitchen', fallback: '/images/tama/kitchen-walnut.jpg', desc: 'Full galley kitchen with walnut countertop, deep sink, 40L fridge, and ample storage. Everything you need to cook a proper meal on the road.' },
]

export default function KumaQProductClient({ conversionAud, low, high, jpyRate, content: initial, vanId, vanName, vanPriceCents }: Props) {
  const [content, setContent] = useState(initial)

  const configuratorUrl = vanId
    ? `https://configure.barecamper.com.au/?model=kuma-q&source=barecamper&van_id=${vanId}&van_name=${encodeURIComponent(vanName ?? '')}&van_price=${vanPriceCents ? Math.round(vanPriceCents / 100) : ''}`
    : 'https://configure.barecamper.com.au/?model=kuma-q'

  const extraImages = KUMA_FEATURES.map(f => ({ key: f.key + '_image', label: f.name + ' Photo' }))

  return (
    <div className="min-h-screen bg-white">
      <PageEditToolbar pageSlug="kuma-q-product" pageName="KUMA-Q Product" content={content} onContentChange={setContent} extraImages={extraImages} />

      {/* Hero */}
      <FitoutHero fallbackImage="/images/tama/hero-exterior.jpg" heroImage={content.hero_image} heroVideo={content.hero_video}>
        <div className="pt-16">
          <p className="text-sand text-xs font-semibold tracking-[0.25em] uppercase mb-3">Bare Camper</p>
          <h1 className="text-7xl md:text-9xl text-white leading-none mb-3">KUMA-Q</h1>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-2">The Full-Length Adventure Van</p>
          <p className="text-white/60 text-base md:text-lg max-w-xl">Super Long Wheelbase Hiace. Queen bed. Full kitchen. Room to move.</p>
        </div>
      </FitoutHero>

      {/* Photo Gallery */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { src: '/images/tama/interior-overview.jpg', alt: 'KUMA-Q interior with full kitchen and bed' },
            { src: '/images/tama/bed-blue.jpg', alt: 'Queen bed spanning full width' },
            { src: '/images/tama/kitchen-walnut.jpg', alt: 'Walnut countertop and galley kitchen' },
            { src: '/images/tama/drawer-slideout.jpg', alt: 'Slide-out storage drawers' },
            { src: '/images/tama/electrical-outlets.jpg', alt: 'Power outlets and USB charging' },
            { src: '/images/tama/hero-side-open.jpg', alt: 'KUMA-Q side view with doors open' },
          ].map((img, i) => (
            <div key={i} className="relative h-48 md:h-64 rounded-xl overflow-hidden">
              <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Pricing</p>
        <h2 className="text-4xl text-charcoal mb-4">What Does a KUMA-Q Cost?</h2>
        <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">The van and conversion are priced separately. The KUMA-Q is built on the Super Long Wheelbase HiAce — more space, more comfort.</p>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">Conversion Fee</p>
            <p className="text-3xl text-ocean mb-1">{formatAud(conversionAud)}</p>
            <p className="text-gray-400 text-sm">5,395,000 at today&apos;s rate</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">Base Vehicle + Import</p>
            <p className="text-3xl text-ocean mb-1">$25,000 -- $55,000</p>
            <p className="text-gray-400 text-sm">SLWB Hiace from Japan (+$2k shipping)</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-8 bg-cream border-ocean-light hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold tracking-widest text-ocean uppercase mb-2">Total Estimate</p>
            <p className="text-3xl text-ocean mb-1">~{formatAud(low)} -- {formatAud(high)}</p>
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
            {KUMA_INCLUSIONS.map(item => (
              <div key={item} className="flex items-start gap-3 py-2 border-b border-gray-200/60">
                <span className="text-ocean mt-0.5 shrink-0"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>
                <span className="text-gray-700 text-sm leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Built for living</p>
        <h2 className="text-4xl text-charcoal mb-10">Key Features</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {KUMA_FEATURES.map(opt => (
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

      {/* Options */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Make it yours</p>
          <h2 className="text-4xl text-charcoal mb-10">Select Options</h2>
          <OptionsList source="kuma-q" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-charcoal text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-sand text-xs font-semibold tracking-widest uppercase mb-4">Get started</p>
          <h2 className="text-4xl md:text-5xl mb-4">Ready to build your KUMA-Q?</h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">The ultimate Super Long Wheelbase campervan. Browse available SLWB Hiaces, customise your build, or book a free consultation.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href={configuratorUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-base px-8 py-4">Customise in 3D</a>
            <LeadFormModal trigger="Book a Free Consultation" source="product_page_kuma_q" className="btn-ghost text-base px-8 py-4" />
          </div>
          <p className="mt-10 text-gray-400 text-sm">
            <a href="mailto:hello@barecamper.com.au" className="text-sand hover:text-sand">hello@barecamper.com.au</a>
            {' . '}<a href="tel:0432182892" className="text-sand hover:text-sand">0432 182 892</a>
          </p>
        </div>
      </section>
    </div>
  )
}
