'use client'

import { useState } from 'react'
import EnquiryCTA from '@/components/EnquiryCTA'
import PageEditToolbar from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'
import OptionsList, { type Option } from '@/components/options/OptionsList'
import { HEXA_BASE_2WD_AUD, HEXA_BASE_4WD_AUD, HEXA_POP_TOP_AUD, formatAud } from '@/lib/pricing'

interface Props { content: Record<string, string> }

const HEXA_INCLUSIONS = [
  'Precision-engineered modular bed kit (wood-spring slat base, extends to near semi-double)',
  'Custom-designed mattress',
  'Side cabinet with bamboo top',
  'Hinoki cedar ceiling lining',
  'Floor treatment',
  'Laguna adjustable table',
  'Dimmable LED downlights',
  'Sub-battery system',
  '2000W inverter',
  'AC charging outlets',
]

const HEXA_OPTIONS: Option[] = [
  { name: 'Pop-Top', detail: 'Full standing room. Fibreglass, fitted in Brisbane by DIY RV Solutions.', price: '$13,090', image: null, description: 'Full standing room inside your HEXA. Fibreglass pop-top manufactured and fitted at our Brisbane workshop. Makes the HEXA a true live-in campervan — cook, change, and move around without crouching.' },
  { name: 'Recommended Package', detail: 'Blackout curtains, insect screens, rear insect net, side-window rain covers, MAXXFAN', price: '$3,800', image: null, description: 'Everything you need for comfortable overnight stays. Block out light for sleep-ins, keep the bugs out while you enjoy the breeze, and the MAXXFAN keeps air flowing even in the rain.' },
  { name: 'Roof AC Package', detail: 'Roof AC unit, 200W solar panel, 300Ah lithium battery', price: '$6,950', image: null, description: 'Stay cool anywhere. Roof-mounted air conditioning unit powered by a 300Ah lithium battery bank and 200W solar panel. Ideal for Australian summers or tropical touring.' },
  { name: 'FF Heater Package', detail: 'Webasto forced-air heater + thermal wool insulation', price: '$5,500', image: null, description: 'Stay warm anywhere in Australia. Includes full thermal wool insulation throughout the van walls and ceiling, plus a Webasto diesel-fired heater that runs off your fuel tank.' },
  { name: 'Side Awning', detail: 'Fiamma 3.5M', price: '$2,300', image: null, description: 'Fiamma F45s 3.5 metre awning. Mounts to the side and rolls out in seconds to give you shade or rain cover. Doubles your usable area when parked up.' },
  { name: 'Off-Road Tyres', detail: null, price: '$2,000', image: null, description: 'All-terrain tyres for grip and ground clearance on dirt roads, fire trails, and beach tracks.' },
  { name: 'Half Wrap', detail: null, price: '$3,300', image: null, description: 'Professional vinyl wrap covering the lower half of your van. Protects paintwork from stone chips and completely transforms the look.' },
]

const SPECS = [
  { label: 'Base vehicle', value: 'Toyota Hiace H200 (up to 3 years old, under 50,000km)' },
  { label: 'Engine (Unleaded)', value: '2.7L 2TR-FE' },
  { label: 'Engine (Diesel)', value: '2.8L Turbo GD-FTV' },
  { label: 'Transmission', value: '6-speed automatic' },
  { label: 'Drive', value: '2WD or 4WD (factory-built system)' },
  { label: 'Seatbelts', value: '3' },
  { label: 'Sleeps', value: '2' },
  { label: 'Roof options', value: 'Standard roof, high roof, or pop-top (+$13,090)' },
]

const PIPELINE = [
  { step: 1, label: 'Order confirmed & deposit received', time: null },
  { step: 2, label: 'Vehicle sourced at auction in Japan', time: '1–2 weeks' },
  { step: 3, label: 'HEXA fitout at our Tokyo facility', time: '3–4 weeks' },
  { step: 4, label: 'Shipped to Australia', time: '4–6 weeks' },
  { step: 5, label: 'Pop-top fitment at Brisbane workshop (if selected)', time: '1–2 weeks' },
  { step: 6, label: 'Compliance, registration & handover', time: '1–2 weeks' },
]

const CHECK = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>

export default function HexaProductClient({ content: initial }: Props) {
  const [content, setContent] = useState(initial)

  return (
    <div className="min-h-screen bg-white">
      <PageEditToolbar pageSlug="hexa-product" pageName="HEXA Product" content={content} onContentChange={setContent} extraImages={[]} />

      {/* Hero */}
      <FitoutHero fallbackImage="/images/tama/hero-exterior.jpg" heroImage={content.hero_image} heroVideo={content.hero_video}>
        <div className="pt-16">
          <p className="text-sand text-xs font-semibold tracking-[0.25em] uppercase mb-3">Bare Camper</p>
          <h1 className="text-7xl md:text-9xl text-white leading-none mb-3">HEXA</h1>
          <p className="sr-only">HEXA Modular Adventure Van — Toyota Hiace H200</p>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-2">Modular Adventure Van | Toyota Hiace H200</p>
          <p className="text-white/60 text-base md:text-lg max-w-xl mb-6">Your life, your style, your space.</p>
          <span className="inline-block bg-ocean text-white font-semibold px-5 py-2.5 rounded-full text-lg">From {formatAud(HEXA_BASE_2WD_AUD)}</span>
        </div>
      </FitoutHero>

      {/* Product Description */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">The Brief</p>
        <h2 className="text-4xl text-charcoal mb-8">A Smarter Way to Get on the Road</h2>
        <div className="space-y-6 text-gray-600 leading-relaxed">
          <p>The HEXA is Dream Drive&apos;s modular adventure van — a smarter way to get on the road without the price tag of a full campervan.</p>
          <p>Built on a hand-picked, low-kilometre Toyota Hiace H200 sourced direct from Japan (under 3 years old, under 50,000km), every HEXA is fitted out at our Tokyo facility with a precision-engineered modular interior. The system is designed using 3D CAD, manufactured on CNC machinery, and assembled by hand using aluminium frames and waterproof birch plywood — finished to the millimetre.</p>
          <p>The result is a vehicle that&apos;s more than a bed in a van, but without the complexity and cost of a full conversion. The HEXA gives you a proper sleeping setup (wood-spring slat base that extends to near semi-double), a side cabinet with bamboo top, hinoki cedar ceiling, dimmable LED lighting, a full sub-battery system with 2000W inverter, and genuine standing room with the optional pop-top.</p>
          <p>It&apos;s designed around Euro-standard stackable containers — so your storage system works whether you&apos;re heading out for a weekend surf trip or setting up a mobile workshop.</p>
          <p>The Hiace H200 is the most trusted and serviceable platform in the world. Parts and mechanics are available everywhere. Your choice of 2.7L unleaded or 2.8L turbo diesel, in 2WD or 4WD.</p>
          <p className="text-charcoal font-medium">This is a made-to-order vehicle. No compromises.</p>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Pricing</p>
          <h2 className="text-4xl text-charcoal mb-4">Delivered to You</h2>
          <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">Vehicle: up to 3 years old, under 50,000km. Brand-new modular fitout.</p>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="border border-gray-200 rounded-2xl p-8 bg-white hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">2WD Hiace Unleaded</p>
              <p className="text-4xl text-ocean mb-1">{formatAud(HEXA_BASE_2WD_AUD)}</p>
              <p className="text-gray-400 text-sm">from</p>
            </div>
            <div className="border border-gray-200 rounded-2xl p-8 bg-white hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold tracking-widest text-driftwood uppercase mb-2">4WD Hiace Diesel</p>
              <p className="text-4xl text-ocean mb-1">{formatAud(HEXA_BASE_4WD_AUD)}</p>
              <p className="text-gray-400 text-sm">from</p>
            </div>
          </div>
        </div>
      </section>

      {/* Included Standard */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Everything in the box</p>
        <h2 className="text-4xl text-charcoal mb-12">Included Standard</h2>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
          {HEXA_INCLUSIONS.map(item => (
            <div key={item} className="flex items-start gap-3 py-2 border-b border-gray-200/60">
              <span className="text-ocean mt-0.5 shrink-0">{CHECK}</span>
              <span className="text-gray-700 text-sm leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pop-Top Upgrade */}
      <section className="bg-ocean text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sand text-xs font-semibold tracking-widest uppercase mb-3">Upgrade</p>
          <h2 className="text-4xl mb-4">Add the Pop-Top — {formatAud(HEXA_POP_TOP_AUD)}</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">Full standing room inside. Fibreglass pop-top manufactured and fitted at our Brisbane workshop by DIY RV Solutions. Makes the HEXA a true live-in campervan — cook, change, and move around without crouching.</p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-2">2WD + Pop-Top</p>
              <p className="text-3xl font-semibold">{formatAud(HEXA_BASE_2WD_AUD + HEXA_POP_TOP_AUD)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-2">4WD + Pop-Top</p>
              <p className="text-3xl font-semibold">{formatAud(HEXA_BASE_4WD_AUD + HEXA_POP_TOP_AUD)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Options */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Make it yours</p>
        <h2 className="text-4xl text-charcoal mb-10">Select Options</h2>
        <OptionsList options={HEXA_OPTIONS} source="hexa" />
      </section>

      {/* Specs */}
      <section className="bg-cream py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Specifications</p>
          <h2 className="text-4xl text-charcoal mb-10">Technical Specs</h2>
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            {SPECS.map((spec, i) => (
              <div key={spec.label} className={`flex items-center justify-between px-6 py-4 text-sm ${i < SPECS.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span className="text-gray-500 font-medium">{spec.label}</span>
                <span className="text-charcoal text-right">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline ETA */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Your build timeline</p>
        <h2 className="text-4xl text-charcoal mb-10">From Order to Handover</h2>
        <div className="space-y-0">
          {PIPELINE.map((p, i) => (
            <div key={p.step} className="flex gap-4">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-ocean text-white flex items-center justify-center text-sm font-semibold shrink-0">{p.step}</div>
                {i < PIPELINE.length - 1 && <div className="w-0.5 bg-ocean/20 flex-1 min-h-[40px]" />}
              </div>
              {/* Content */}
              <div className="pb-8">
                <p className="text-charcoal font-medium">{p.label}</p>
                {p.time && <p className="text-gray-400 text-sm mt-0.5">{p.time}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 border border-ocean/20 rounded-2xl p-6 bg-cream">
          <p className="text-ocean font-semibold mb-1">Total: 2–4 months</p>
          <p className="text-gray-500 text-sm">Timelines are indicative and may vary based on vehicle availability and shipping schedules. We&apos;ll keep you updated at every stage.</p>
        </div>
      </section>

      {/* Product Comparison */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Find your fit</p>
          <h2 className="text-4xl text-charcoal mb-10">Compare Our Range</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-2xl overflow-hidden bg-white">
              <thead>
                <tr className="bg-charcoal text-white">
                  <th className="text-left px-4 py-3 font-semibold" />
                  <th className="text-left px-4 py-3 font-semibold">HEXA</th>
                  <th className="text-left px-4 py-3 font-semibold">TAMA</th>
                  <th className="text-left px-4 py-3 font-semibold">MANA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-3 text-gray-500 font-medium">From</td><td className="px-4 py-3 text-ocean font-semibold">$75,000</td><td className="px-4 py-3">~$106,000</td><td className="px-4 py-3">~$105,000</td></tr>
                <tr><td className="px-4 py-3 text-gray-500 font-medium">Vehicle</td><td className="px-4 py-3">Used H200</td><td className="px-4 py-3">Used H200 LWB</td><td className="px-4 py-3">Used H200 LWB</td></tr>
                <tr><td className="px-4 py-3 text-gray-500 font-medium">Pop-Top</td><td className="px-4 py-3">Optional (+$13,090)</td><td className="px-4 py-3">Optional (+$13,090)</td><td className="px-4 py-3">Standard</td></tr>
                <tr><td className="px-4 py-3 text-gray-500 font-medium">Kitchen</td><td className="px-4 py-3">No</td><td className="px-4 py-3">Yes</td><td className="px-4 py-3">Yes</td></tr>
                <tr><td className="px-4 py-3 text-gray-500 font-medium">Toilet</td><td className="px-4 py-3">No</td><td className="px-4 py-3">No</td><td className="px-4 py-3">Yes</td></tr>
                <tr><td className="px-4 py-3 text-gray-500 font-medium">Position</td><td className="px-4 py-3 text-ocean font-medium">Entry-level adventure van</td><td className="px-4 py-3">Family campervan</td><td className="px-4 py-3">Compact liveable campervan</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-4xl text-charcoal mb-3">Ready to build yours?</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Get in touch to configure your HEXA and secure your build slot.</p>
        </div>
        <EnquiryCTA defaultModel="hexa" />
      </section>
    </div>
  )
}
