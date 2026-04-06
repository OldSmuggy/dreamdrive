'use client'

import { useState } from 'react'
import Image from 'next/image'
import EnquiryCTA from '@/components/EnquiryCTA'
import PageEditToolbar from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'
import { manaJpConversionAud, manaAuConversionAud, conversionPriceRange, formatAud } from '@/lib/pricing'
import OptionsList, { UNIVERSAL_OPTIONS } from '@/components/options/OptionsList'

interface Props { jpyRate: number; content: Record<string, string> }

const MANA_INCLUSIONS = [
  'Pop top roof offering standing space', 'Table with adjustable attachment', 'Modular bed kit',
  'Handcrafted furniture', 'Quality hardware & hinges', 'Sink & faucet', 'High pressure pump',
  'Shower hose', '55L fresh water tank', '200AH lithium battery', 'D/C charger', 'LED down lights',
  'Dimmable LED light bar', '2000W inverter', 'A/C charging outlets ×2', '75L upright refrigerator',
  'Shore power charger', 'Toilet under seat/bed', 'Plenty of storage under the bed',
  '10cm thick trifold mattress', '12L grey tank',
]


const MANA_QUALITY = [
  { title: 'Furniture & Hardware', body: 'Carefully finished furniture made using top quality wood and ply, free of harmful VOC and chemical adhesives. Hand crafted by Japanese craftsmen at our Tokyo facility. Walnut kitchen countertops. Quality hinges and hardware sourced from Japan and Europe.' },
  { title: 'Paints & Oils', body: 'Eco-friendly and non-toxic Osmo brand paints and oils. Allows wood to breathe naturally. Fulfils European standards. Safe for children and pets.' },
  { title: 'Quality Electrical', body: '2000W inverter and outlets, 200AH lithium iron phosphate battery, battery display monitor, D/C charger, high quality water pump, 3-way LED down lights, dimmable LED bar, shore power.' },
  { title: 'Safety Features', body: 'Toyota Safety Sense, lane departure alert, pre-collision safety system, panoramic view monitor*, parking sensors*, front driver and passenger airbags*. (*Certain features may not be on all base vehicles)' },
]

export default function ManaProductClient({ jpyRate, content: initial }: Props) {
  const [content, setContent] = useState(initial)
  const gallery: string[] = (() => { try { return JSON.parse(content.gallery_images || '[]') } catch { return [] } })()

  const jpConversionAud = manaJpConversionAud(jpyRate)
  const auConversionAud = manaAuConversionAud()
  const jpRange = conversionPriceRange(jpConversionAud)
  const auRange = conversionPriceRange(auConversionAud)

  return (
    <div className="min-h-screen bg-white">
      <PageEditToolbar pageSlug="mana-product" pageName="MANA Product" content={content} onContentChange={setContent} />

      <FitoutHero fallbackImage="/images/mana/hero-interior.jpg" heroImage={content.hero_image} heroVideo={content.hero_video}>
        <div className="pt-16">
          <p className="text-sand text-xs font-semibold tracking-[0.25em] uppercase mb-3">Bare Camper</p>
          <h1 className="text-7xl md:text-9xl text-white leading-none mb-3">MANA</h1>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-2">Liveable Compact Campervan</p>
          <p className="text-white/60 text-base md:text-lg max-w-xl">Built for two. Designed for the long road.</p>
        </div>
      </FitoutHero>

      {/* Photo Gallery */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { src: '/images/mana/interior-full.jpg', alt: 'MANA interior with pop top, fridge and bed' },
            { src: '/images/mana/kitchen-forward.jpg', alt: 'MANA kitchen and table looking forward' },
            { src: '/images/mana/seating-toilet.jpg', alt: 'MANA seating area with toilet compartment' },
            { src: '/images/mana/storage-open.jpg', alt: 'MANA under-bench storage' },
            { src: '/images/mana/rear-platform.jpg', alt: 'MANA rear platform and bed area' },
            { src: '/images/mana/walnut-poptop.jpg', alt: 'MANA walnut trim with pop top' },
          ].map((img, i) => (
            <div key={i} className="relative h-48 md:h-64 rounded-xl overflow-hidden">
              <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
            </div>
          ))}
        </div>
      </section>

      {/* Overview */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Overview</p>
        <h2 className="text-4xl text-charcoal mb-6">Built for the long haul</h2>
        <p className="text-gray-500 max-w-3xl mb-8 leading-relaxed text-lg">
          The MANA Campervan is the ultimate vehicle for reliable, long-term adventures on the road.
          Built on the globally trusted, easy-to-maintain Toyota Hiace H200 platform. Designed in Australia
          for a comfortable life on the road, the interior boasts a liveable space for 2 with full standing
          room, a kitchen, toilet, and external shower. Larger water tanks for extended off-grid travel.
          3 seatbelts. Choice of 2.7L unleaded or 2.8L turbo diesel engine, including factory-built AWD option.
        </p>
        <p className="text-sm text-gray-400">4,695mm L × 1,695mm W × 2,100mm H (approx)</p>
      </section>

      {/* Pricing */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Pricing</p>
          <h2 className="text-4xl text-charcoal mb-4">What Does a MANA Cost?</h2>
          <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">Choose whether your MANA is built in Japan or Australia — each has a different conversion fee and timeline. The van is priced separately.</p>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-charcoal text-white px-6 py-4"><p className="text-xs font-semibold tracking-wider text-sand uppercase mb-1">Japan Build</p><p className="text-2xl">MANA — Tokyo Facility</p></div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Conversion fee</span><span className="font-semibold text-gray-900">~{formatAud(jpConversionAud)} <span className="text-xs text-gray-400">(¥4,500,000)</span></span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Van + import</span><span className="font-semibold text-gray-900">$25,000 – $50,000</span></div>
                <div className="flex justify-between text-sm border-t border-gray-100 pt-3"><span className="font-semibold text-gray-800">Total estimate</span><span className="text-ocean text-lg">~{formatAud(jpRange.low)} – {formatAud(jpRange.high)}</span></div>
                <p className="text-xs text-gray-400">Pop top included. Van arrives fully converted.</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-blue-800 text-white px-6 py-4"><p className="text-xs font-semibold tracking-wider text-blue-200 uppercase mb-1">Australia Build</p><p className="text-2xl">MANA — Brisbane Workshop</p></div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Conversion fee</span><span className="font-semibold text-gray-900">{formatAud(auConversionAud)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Van + import</span><span className="font-semibold text-gray-900">$25,000 – $50,000 <span className="text-xs text-gray-400">or BYO</span></span></div>
                <div className="flex justify-between text-sm border-t border-gray-100 pt-3"><span className="font-semibold text-gray-800">Total estimate</span><span className="text-blue-700 text-lg">{formatAud(auRange.low)} – {formatAud(auRange.high)}</span></div>
                <p className="text-xs text-gray-400">BYO Hiace: conversion only {formatAud(auConversionAud)}. Pop top included.</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">Japan conversion based on today&apos;s JPY/AUD rate ({jpyRate.toFixed(4)}). Final pricing confirmed at consultation.</p>
        </div>
      </section>

      {/* Included */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Everything in the box</p>
        <h2 className="text-4xl text-charcoal mb-12">Included Standard</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4">
          {MANA_INCLUSIONS.map(item => (
            <div key={item} className="flex items-start gap-3 py-2 border-b border-gray-200/60">
              <span className="text-ocean mt-0.5 shrink-0"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>
              <span className="text-gray-700 text-sm leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Options */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Make it yours</p>
          <h2 className="text-4xl text-charcoal mb-10">Select Options</h2>
          <OptionsList source="mana" />
        </div>
      </section>

      {/* Quality */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Built to last</p>
        <h2 className="text-4xl text-charcoal mb-10">Quality You Can Feel</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {MANA_QUALITY.map(card => (
            <div key={card.title} className="border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-shadow">
              <h3 className="text-xl text-charcoal mb-3">{card.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <EnquiryCTA defaultModel="mana" />
      </section>
    </div>
  )
}
