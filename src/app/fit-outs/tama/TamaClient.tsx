'use client'

import { useState } from 'react'
import Link from 'next/link'
import PageEditToolbar, { EditableImage } from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'

const STATIC_HERO = '/images/tama-family-seat.jpg'
const FITOUT_AUD = 47000

export default function TamaClient({ jpyApprox, content: initial }: { jpyApprox: number; content: Record<string, string> }) {
  const [content, setContent] = useState(initial)

  const gallery: string[] = (() => { try { return JSON.parse(content.gallery_images || '[]') } catch { return [] } })()

  return (
    <div className="min-h-screen">
      <PageEditToolbar
        pageSlug="tama"
        pageName="TAMA Pop Top"
        content={content}
        onContentChange={setContent}
        extraImages={[
          { key: 'bed_tama_image', label: 'TAMA Bed Layout' },
          { key: 'bed_nico_image', label: 'NICO Kitchen Layout' },
        ]}
      />

      {/* Hero */}
      <FitoutHero fallbackImage={STATIC_HERO} heroImage={content.hero_image} heroVideo={content.hero_video}>
        <Link href="/fit-outs" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-8 transition-colors">
          ← All Fit-Outs
        </Link>
        <div className="max-w-2xl">
          <span className="inline-block bg-sand text-charcoal text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            From $109,000 Driveaway
          </span>
          <h1 className="text-5xl md:text-6xl text-white mb-3">The TAMA Pop Top</h1>
          <p className="text-sand text-xl mb-8">Premium Handcrafted Campervan</p>
          <a href="tel:0432182892" className="inline-block bg-sand text-charcoal font-semibold px-8 py-3.5 rounded-xl hover:bg-sand transition-colors text-base">
            Book a Test Drive
          </a>
        </div>
      </FitoutHero>

      {/* Key features bar */}
      <section className="bg-charcoal text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: '💺', label: '6 seatbelts maximum' },
              { icon: '🛏', label: 'Sleeps 4 comfortably' },
              { icon: '⚡', label: '200AH lithium + 2000W inverter' },
              { icon: '❄️', label: '40L refrigerator' },
              { icon: '📏', label: '2.07m exterior height' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2.5">
                <span className="text-xl shrink-0">{f.icon}</span>
                <span className="text-sm text-white/80 leading-snug">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery (if images uploaded) */}
      {gallery.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gallery.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt={`TAMA gallery ${i + 1}`} className="w-full h-48 object-cover rounded-xl" />
            ))}
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-cream border border-ocean-light rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-xs font-bold text-ocean uppercase tracking-wider mb-1">Fit-Out Price (fit-out only)</p>
            <p className="text-3xl text-charcoal">${FITOUT_AUD.toLocaleString('en-AU')} AUD</p>
            <p className="text-gray-500 text-sm mt-1">approx. ¥{jpyApprox.toLocaleString('en-AU')} JPY</p>
            <p className="text-xs text-gray-400 mt-3">
              Fit-out price is separate from the base van. Van price depends on the specific vehicle and exchange rate at time of purchase.
            </p>
          </div>
          <Link href="/build" className="btn-primary shrink-0 text-center px-8 py-3.5">Build With TAMA →</Link>
        </div>
      </section>

      {/* About */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl text-charcoal mb-4">About the TAMA</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            The TAMA is a compact, functional campervan available in two body options: standard body and Pop Top,
            with 4 layouts to suit your needs. Versatile and suitable for both everyday use and weekend van life
            adventures. Designed for family trips, pet-friendly travel, remote work, outdoor activities, and
            everyday use — focusing on maximizing living comfort.
          </p>
        </div>
      </section>

      {/* Pop Top Advantage */}
      <section className="bg-cream py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl text-charcoal mb-2">The Pop Top Advantage</h2>
          <p className="text-gray-500 mb-10">Standing room when you need it. Compact when you don&apos;t.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Standing Room When You Want It', desc: 'Waterproof canvas with zip-open insect nets for airflow. Reading light in the ceiling.' },
              { title: 'Lift-Up Bed for Standing Room', desc: 'Bed platform lifts on gas struts to create more standing room and hold bedding.' },
              { title: 'Heavy Duty Pop Top', desc: 'We replace the entire roof for longevity. Streamlined finish with front taper for better aerodynamics.' },
            ].map(c => (
              <div key={c.title} className="bg-white rounded-2xl border border-gray-200 p-7">
                <div className="w-10 h-10 bg-cream rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle & Engine */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl text-charcoal mb-10">Vehicle &amp; Engine</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h3 className="font-semibold text-gray-900 mb-5">Base Options</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              {['2WD: 2.0L petrol engine', '4x4 upgrade: 2.8L Turbo Diesel (+$7,000)', 'Same engine as Land Cruiser Prado', '12% shorter exterior, 10% more rear cabin space vs competitors', '2026 model H200 still available from our Japan factory'].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-ocean mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-charcoal rounded-2xl p-8 flex flex-col justify-between">
            <svg className="w-8 h-8 text-sand mb-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
            <p className="text-white/90 text-base leading-relaxed italic mb-6">
              &ldquo;The 4x4 Tama gives you a real sense of Freedom, being only 4.7m long and 2.09m high,
              you are able to park in town, have a nap at service centres, enter shopping centres and
              even drive it on the beach!&rdquo;
            </p>
            <p className="text-sand font-semibold text-sm">— Jared Campion</p>
          </div>
        </div>
      </section>

      {/* Layout Options */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl text-charcoal mb-2">Layout Options</h2>
          <p className="text-gray-500 mb-10">4 layouts to suit your lifestyle.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { num: '01', title: 'Bed & Galley Kitchen', desc: 'Classic Tama setup — 70cm single bed extending to 110cm double. 40L Engel fridge with walnut countertop, sink, shower attachment. Storage under the bed platform.', imgKey: 'bed_tama_image', fallback: '/images/tama-bed.jpg' },
              { num: '02', title: 'Extra Seat or Toilet Layout', desc: 'Forward-facing seat with 3 seatbelts for passengers, converts to lounge or extra bed. Or choose the vanlife layout with bench seat, slide-out table, hidden toilet and extra storage.', imgKey: null, fallback: '/images/tama-vanlife.jpg' },
              { num: '03', title: 'Hotel on Wheels Layout', desc: 'Fixed full-size double bed with two large slide-out storage drawers. Internal slider for fridge or toilet.', imgKey: null, fallback: null },
              { num: '04', title: 'NICO Kitchen/Dining', desc: 'Inside/outside accessible sink, fresh & grey water tanks, bench seat and dining table for two.', imgKey: 'bed_nico_image', fallback: '/images/tama-nico.jpg' },
            ].map(l => (
              <div key={l.num} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {(l.imgKey || l.fallback) && (
                  <EditableImage
                    src={(l.imgKey ? content[l.imgKey] : null) || l.fallback || null}
                    alt={l.title}
                    className="h-48 w-full"
                    placeholderText={`${l.title} photo coming soon`}
                  />
                )}
                <div className="p-7">
                  <span className="text-4xl text-ocean-light block mb-2">{l.num}</span>
                  <h3 className="font-semibold text-gray-900 mb-2">{l.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Electrical System */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl text-charcoal mb-6">Electrical System</h2>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Standard Inclusions</h3>
            <ul className="space-y-2.5 text-sm text-gray-700">
              {['2000W inverter', '200AH Lithium battery', 'D/C Charger (charges from driving & shore power)', 'Shore Power Charger', 'LED Down Lights + Dimmable LED Light Bar', 'A/C Charging Outlets x2 with USB Type A & C'].map(item => (
                <li key={item} className="flex items-start gap-2.5"><span className="text-ocean shrink-0 mt-0.5">⚡</span>{item}</li>
              ))}
            </ul>
            <div className="mt-5 bg-cream border border-sand rounded-xl px-4 py-3 text-sm text-gray-700">
              <span className="font-semibold text-ocean">Optional:</span> 200W solar panel on roof
            </div>
          </div>
          <div>
            <h2 className="text-3xl text-charcoal mb-6">Interior Specifications</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Standard Fit-Out</h3>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {['3 transforming rear seats', 'Modular bed kit', '40L fridge', 'Walnut countertop, sink & faucet', '10L fresh water tank (optional 40L)', 'Portable table', 'Handcrafted furniture', 'High pressure pump', 'Quick release shower hose'].map(i => (
                    <li key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-ocean rounded-full shrink-0" />{i}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Vehicle Dimensions</h3>
                <div className="space-y-1.5 text-sm text-gray-700">
                  <p>Unleaded: 2,000cc / Diesel: 2,800cc turbo</p>
                  <p>Standard roof: 4,695 × 1,695 × 1,980mm</p>
                  <p>Pop Top: 4,695 × 1,695 × 2,090mm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-charcoal text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl text-white mb-3">Ready to build your TAMA?</h2>
          <p className="text-white/60 mb-8">Configure your dream build or book a test drive to see it in person.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/build" className="bg-sand text-charcoal font-semibold px-8 py-3.5 rounded-xl hover:bg-sand transition-colors text-base text-center">Configure Your Build →</Link>
            <a href="tel:0432182892" className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-base text-center">Book a Test Drive</a>
          </div>
        </div>
      </section>
    </div>
  )
}
