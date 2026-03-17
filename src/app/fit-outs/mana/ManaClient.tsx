'use client'

import { useState } from 'react'
import Link from 'next/link'
import PageEditToolbar from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'

const STATIC_HERO = 'https://images.squarespace-cdn.com/content/v1/6452ed7189507b42ec70bffd/d6b9a9af-7080-46b6-9d0c-03a76d5bf323/IMG_3103.jpeg'
const FITOUT_AUD = 47000

export default function ManaClient({ jpyApprox, content: initial }: { jpyApprox: number; content: Record<string, string> }) {
  const [content, setContent] = useState(initial)

  const gallery: string[] = (() => { try { return JSON.parse(content.gallery_images || '[]') } catch { return [] } })()

  return (
    <div className="min-h-screen">
      <PageEditToolbar
        pageSlug="mana"
        pageName="MANA Pop Top"
        content={content}
        onContentChange={setContent}
      />

      {/* Hero */}
      <FitoutHero fallbackImage={STATIC_HERO} heroImage={content.hero_image} heroVideo={content.hero_video}>
        <Link href="/fit-outs" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-8 transition-colors">
          ← All Fit-Outs
        </Link>
        <div className="max-w-2xl">
          <span className="inline-block bg-sand-400 text-forest-950 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            From $107,000 Driveaway
          </span>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-3">The MANA Pop Top</h1>
          <p className="text-sand-300 text-xl mb-8">Liveable Compact Campervan</p>
          <a href="tel:0432182892"
            className="inline-block bg-sand-400 text-forest-950 font-semibold px-8 py-3.5 rounded-xl hover:bg-sand-300 transition-colors text-base">
            Book a Test Drive
          </a>
        </div>
      </FitoutHero>

      {/* Key features bar */}
      <section className="bg-forest-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: '💺', label: '3 seatbelts' },
              { icon: '🛏', label: 'Sleeps 2 comfortably' },
              { icon: '⚡', label: '200AH lithium + 2000W inverter' },
              { icon: '❄️', label: '75L refrigerator' },
              { icon: '📏', label: '2.10m exterior height' },
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
              <img key={i} src={url} alt={`MANA gallery ${i + 1}`} className="w-full h-48 object-cover rounded-xl" />
            ))}
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-forest-50 border border-forest-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-xs font-bold text-forest-600 uppercase tracking-wider mb-1">Fit-Out Price (fit-out only)</p>
            <p className="font-display text-3xl text-forest-900">${FITOUT_AUD.toLocaleString('en-AU')} AUD</p>
            <p className="text-gray-500 text-sm mt-1">approx. ¥{jpyApprox.toLocaleString('en-AU')} JPY</p>
            <p className="text-xs text-gray-400 mt-3">
              Fit-out price is separate from the base van. Van price depends on the specific vehicle and exchange rate at time of purchase.
            </p>
          </div>
          <Link href="/build" className="btn-primary shrink-0 text-center px-8 py-3.5">
            Build With MANA →
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl text-forest-900 mb-4">About the MANA</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Designed in Australia to meet the demands of life on the road, the MANA maximises living space for
            couples or solo travellers planning long-term adventures. Inside you&apos;ll find everything you need
            for comfortable living — full kitchen, standing height, a convenient toilet, and external shower.
            Larger water tanks for extended off-grid travel.
          </p>
        </div>
      </section>

      {/* Pop Top section */}
      <section className="bg-sand-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-3xl text-forest-900 mb-2">The Pop Top Advantage</h2>
          <p className="text-gray-500 mb-10">More headroom, more airflow, more comfort.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Standing Room When You Want It',
                desc: 'Waterproof canvas with 4 zip-open insect nets. Opening is 2.5m × 1m wide.',
              },
              {
                title: 'Heavy Duty Canvas',
                desc: 'Dynaproofed outback rugged canvas walls built to withstand the harshest Australian conditions.',
              },
              {
                title: 'Streamline Pop Top',
                desc: 'Entire roof replaced for longevity. Streamlined finish with front taper for better airflow.',
              },
            ].map(c => (
              <div key={c.title} className="bg-white rounded-2xl border border-gray-200 p-7">
                <div className="w-10 h-10 bg-forest-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-forest-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
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
        <h2 className="font-display text-3xl text-forest-900 mb-10">Vehicle &amp; Engine</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h3 className="font-semibold text-gray-900 mb-5">Base Options</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              {[
                '2WD: 2.0L petrol engine',
                'AWD upgrade: 2.8L Turbo Diesel (+$8,000)',
                'Same engine as Land Cruiser Prado',
                'Optimised for long-distance touring',
                '2026 model available from our Japan factory',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-forest-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-forest-950 rounded-2xl p-8 flex flex-col justify-between">
            <svg className="w-8 h-8 text-sand-400 mb-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className="text-white/90 text-base leading-relaxed italic mb-6">
              "The 4x4 Tama gives you a real sense of Freedom, being only 4.7m long and 2.09m high,
              you are able to park in town, have a nap at service centres, enter shopping centres and
              even drive it on the beach!"
            </p>
            <p className="text-sand-400 font-semibold text-sm">— Jared Campion</p>
          </div>
        </div>
      </section>

      {/* Living Space */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-3xl text-forest-900 mb-2">Living Space</h2>
          <p className="text-gray-500 mb-10">Everything you need for life on the road.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🍳',
                title: 'The Kitchen',
                desc: 'Complete workstation with handcrafted solid wood countertop, sink & faucet. 2000W inverter handles induction stoves. 55L fresh water tank with high pressure pump.',
              },
              {
                icon: '🚿',
                title: 'Bathroom',
                desc: 'Joolca Gotta Go toilet under the bed/seat, accessible in seconds. Shower on driver side sliding door with optional shower awning.',
              },
              {
                icon: '🛏',
                title: 'Sleeping & Seating',
                desc: '10cm thick trifold mattress transforms from bed to seating. Double mattress: 138cm × 188cm.',
              },
            ].map(c => (
              <div key={c.title} className="bg-white rounded-2xl border border-gray-200 p-7">
                <span className="text-3xl block mb-4">{c.icon}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Storage & Electrical */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-3xl text-forest-900 mb-6">Storage</h2>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              Two large sliding drawers at rear, accessible via internal flap. Kitchen storage under sink.
              Every centimetre optimised for practical living.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl text-forest-900 mb-6">Electrical System</h2>
            <ul className="space-y-2.5 text-sm text-gray-700">
              {[
                '2000W inverter',
                '200AH Lithium battery',
                'D/C Charger (charges from driving & shore power)',
                'Shore Power Charger',
                'LED Down Lights + Dimmable LED Light Bar',
                'A/C Charging Outlets x2 with USB Type A & C',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-forest-600 shrink-0 mt-0.5">⚡</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 bg-sand-50 border border-sand-200 rounded-xl px-4 py-3 text-sm text-gray-700">
              <span className="font-semibold text-forest-700">Optional:</span> 200W solar panel on roof
            </div>
          </div>
        </div>
      </section>

      {/* Interior Specifications */}
      <section className="bg-sand-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-3xl text-forest-900 mb-10">Interior Specifications</h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Standard Fit-Out</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {[
                  'Modular bed kit',
                  '60L or 75L fridge',
                  'Solid wood countertop, sink & faucet',
                  '55L fresh water tank',
                  'Portable table',
                  'Handcrafted furniture',
                  'High pressure pump',
                  'Shower hose',
                  'Joolca toilet',
                  '2 large storage drawers',
                ].map(i => <li key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-forest-500 rounded-full shrink-0" />{i}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Optional Upgrades</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {[
                  'Fiamma Awning',
                  'Shower Awning',
                  'Hot Water System (12V & 240V)',
                  'Half Wrap',
                  'Off-Road Tires',
                  'Curtain/Fan/Window Net/Rain Guard Package',
                ].map(i => <li key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-sand-500 rounded-full shrink-0" />{i}</li>)}
              </ul>
              <div className="mt-6">
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
      <section className="bg-forest-950 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl text-white mb-3">Ready to build your MANA?</h2>
          <p className="text-white/60 mb-8">Configure your dream build or book a test drive to see it in person.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/build" className="bg-sand-400 text-forest-950 font-semibold px-8 py-3.5 rounded-xl hover:bg-sand-300 transition-colors text-base text-center">
              Configure Your Build →
            </Link>
            <a href="tel:0432182892" className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-base text-center">
              Book a Test Drive
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
