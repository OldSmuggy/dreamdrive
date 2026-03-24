'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LeadFormModal from '@/components/leads/LeadFormModal'
import PageEditToolbar, { EditableImage } from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'
import OptionsList from '@/components/options/OptionsList'

const EXTRA_IMAGES = [
  { key: 'poptop_image', label: 'Pop Top Section Photo' },
  { key: 'bare_camper_image', label: 'Bare Camper Photo' },
  { key: 'base_van_image', label: 'Base Van Photo' },
  { key: 'electrical_image', label: 'Electrical Cabinet Photo' },
]


export default function DiyClient({ content: initial }: { content: Record<string, string> }) {
  const [content, setContent] = useState(initial)
  const gallery: string[] = (() => { try { return JSON.parse(content.gallery_images || '[]') } catch { return [] } })()

  return (
    <div className="min-h-screen bg-white">
      <PageEditToolbar pageSlug="diy" pageName="DIY Page" content={content} onContentChange={setContent} extraImages={EXTRA_IMAGES} />

      <FitoutHero fallbackImage="/images/diy-poptop.jpg" heroImage={content.hero_image} heroVideo={content.hero_video}>
        <div className="pt-16">
          <p className="text-sand text-xs font-semibold tracking-[0.25em] uppercase mb-3">Bare Camper</p>
          <h1 className="text-7xl md:text-9xl text-white leading-none mb-3">DIY</h1>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-2">We handle the hard stuff. You make it yours.</p>
          <p className="text-white/60 text-base md:text-lg max-w-xl">Professional pop top conversion + modular bed kit. Your interior, your rules.</p>
        </div>
      </FitoutHero>

      {gallery.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gallery.map((url, i) => <div key={i} className="relative h-48 rounded-xl overflow-hidden"><Image src={url} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" /></div>)}
          </div>
        </section>
      )}

      {/* Pop Top */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Step 1</p>
            <h2 className="text-4xl text-charcoal mb-4">Start with a Pop Top</h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Our fibreglass pop top roof conversion gives you standing room, ventilation, and a van that
              still fits in your garage. Installed at our Brisbane factory in 10 business days.
            </p>
            <div className="flex gap-8 mb-8">
              <div><p className="text-3xl text-ocean">$11,900</p><p className="text-gray-400 text-xs mt-0.5">ex GST</p></div>
              <div><p className="text-3xl text-ocean">10 days</p><p className="text-gray-400 text-xs mt-0.5">turnaround</p></div>
              <div><p className="text-3xl text-ocean">+600mm</p><p className="text-gray-400 text-xs mt-0.5">standing height</p></div>
            </div>
            <Link href="/pop-top" className="btn-primary inline-block px-6 py-3 text-sm">See Full Pop Top Details →</Link>
          </div>
          <EditableImage src={content.poptop_image || '/images/diy-poptop.jpg'} alt="Pop Top" className="h-72 rounded-2xl overflow-hidden" placeholderText="Pop Top photo coming soon" />
        </div>
      </section>

      {/* Bare Camper */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <EditableImage src={content.bare_camper_image || '/images/diy-barecamper.jpg'} alt="Bare Camper" className="h-72 rounded-2xl overflow-hidden md:order-first order-last" placeholderText="Bare Camper photo coming soon" />
            <div>
              <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Step 2</p>
              <h2 className="text-4xl text-charcoal mb-4">Bare Camper Bed System — Coming Soon</h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                A modular bed system designed for the Toyota Hiace H200. Simple to install, easy to
                reconfigure. The perfect foundation for a DIY interior — add your own mattress, panels,
                and storage around it.
              </p>
              <p className="text-3xl text-ocean mb-8">From $25,000</p>
              <Link href="/configurator?fitout=grid" className="btn-primary inline-block px-6 py-3 text-sm">Configure Bare Camper →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Base Van */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Step 3</p>
            <h2 className="text-4xl text-charcoal mb-4">Find Your Base Van</h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Browse 200+ Toyota Hiace vans from Japan auctions and dealers. We handle import, shipping,
              and compliance. You get a clean base van ready for your own conversion — no guesswork on
              the paperwork.
            </p>
            <Link href="/browse" className="btn-primary inline-block px-6 py-3 text-sm">Browse Vans →</Link>
          </div>
          <EditableImage src={content.base_van_image || '/images/diy-basevan.jpg'} alt="Base Van" className="h-72 rounded-2xl overflow-hidden" placeholderText="Van photo coming soon" />
        </div>
      </section>

      {/* Electrical */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <EditableImage src={content.electrical_image || '/images/diy-electrical.jpg'} alt="Electrical Cabinet" className="h-72 rounded-2xl overflow-hidden md:order-first order-last" placeholderText="Electrical cabinet photo coming soon" />
            <div>
              <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Optional add-on</p>
              <h2 className="text-4xl text-charcoal mb-4">Standalone Electrical Cabinet</h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Want the electrical done professionally but handling everything else yourself? Our
                wall-mount or under-bed electrical cabinet comes fully wired and ready to install —
                lithium battery, inverter, charger, outlets, and more.
              </p>
              <a href="mailto:hello@barecamper.com.au?subject=Electrical%20Cabinet%20Enquiry" className="btn-primary inline-block px-6 py-3 text-sm">Enquire About Electrical →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Options */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Make it yours</p>
        <h2 className="text-4xl text-charcoal mb-4">Add-On Options</h2>
        <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">These options can be added to any van — whether you&apos;re doing a full DIY build or just want the essentials sorted by a pro.</p>
        <OptionsList source="diy" />
      </section>

      {/* CTA */}
      <section className="bg-charcoal text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-sand text-xs font-semibold tracking-widest uppercase mb-4">Let&apos;s build</p>
          <h2 className="text-4xl md:text-5xl mb-4">Ready to start your DIY build?</h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">Browse available base vans or get in touch to plan your build.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/browse" className="btn-primary text-base px-8 py-4">Browse Base Vans</Link>
            <LeadFormModal trigger="Book a Consultation" source="product_page_diy" className="btn-ghost text-base px-8 py-4" />
          </div>
          <p className="mt-10 text-gray-400 text-sm">
            <a href="mailto:hello@barecamper.com.au" className="text-sand hover:text-sand">hello@barecamper.com.au</a>
            {' · '}<a href="tel:0432182892" className="text-sand hover:text-sand">0432 182 892</a>
          </p>
        </div>
      </section>
    </div>
  )
}
