'use client'

import { useState } from 'react'
import Link from 'next/link'
import PageEditToolbar from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'

const STATIC_HERO = 'https://images.squarespace-cdn.com/content/v1/6452ed7189507b42ec70bffd/1683156338722-2KFOTMHKJGX47F9YGRQD/DSC06470.jpg'

const UPGRADES = [
  { label: 'Fiamma Awning', price: '$2,300' },
  { label: 'Shower Awning', price: '$850' },
  { label: 'Hot Water System', price: null },
  { label: 'Half Wrap', price: null },
  { label: 'Off-Road Tires', price: null },
  { label: 'Curtain/Fan Package', price: null },
  { label: 'Bull Bar', price: null },
  { label: 'Tow Bar', price: null },
  { label: 'Swivel Seats', price: null },
  { label: 'Rear A/C', price: null },
  { label: 'Solar Panels', price: '$2,000' },
]

const FITOUT_AUD = 55000

export default function KumaqClient({ jpyApprox, content: initial }: { jpyApprox: number; content: Record<string, string> }) {
  const [content, setContent] = useState(initial)

  const gallery: string[] = (() => { try { return JSON.parse(content.gallery_images || '[]') } catch { return [] } })()

  return (
    <div className="min-h-screen">
      <PageEditToolbar
        pageSlug="kumaq"
        pageName="KUMAQ"
        content={content}
        onContentChange={setContent}
      />

      {/* Hero */}
      <FitoutHero fallbackImage={STATIC_HERO} heroImage={content.hero_image} heroVideo={content.hero_video}>
        <Link href="/fit-outs" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-8 transition-colors">
          ← All Fit-Outs
        </Link>
        <div className="max-w-2xl">
          <span className="inline-block bg-sand text-charcoal text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            From $10,000 deposit to secure your build
          </span>
          <h1 className="text-5xl md:text-6xl text-white mb-3">The KUMAQ</h1>
          <p className="text-sand text-xl mb-8">The Ultimate Adventure Campervan</p>
          <a href="tel:0432182892"
            className="inline-block bg-sand text-charcoal font-semibold px-8 py-3.5 rounded-xl hover:bg-sand transition-colors text-base">
            Book a Test Drive
          </a>
        </div>
      </FitoutHero>

      {/* Key features bar */}
      <section className="bg-charcoal text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: '💺', label: 'Seats up to 6' },
              { icon: '🛏', label: 'Sleeps 4' },
              { icon: '🚐', label: 'Super Long Wheelbase' },
              { icon: '⚡', label: '240V system, 200AH lithium' },
              { icon: '⛽', label: '70L fuel tank' },
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
              <img key={i} src={url} alt={`KUMAQ gallery ${i + 1}`} className="w-full h-48 object-cover rounded-xl" />
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
          <Link href="/build" className="btn-primary shrink-0 text-center px-8 py-3.5">
            Build With KUMAQ →
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl text-charcoal mb-4">About the KUMAQ</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            The KUMAQ is the ultimate vehicle for road trip adventures. With seating and sleeping for up to 4,
            this campervan has everything you need to hit the road in style and comfort. The versatile layout,
            premium amenities, and dependable Toyota performance make the KUMAQ perfect for families and serious
            adventurers.
          </p>
        </div>
      </section>

      {/* Vehicle specs */}
      <section className="bg-cream py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl text-charcoal mb-10">Vehicle Specifications</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: '4WD Diesel', value: '8–10 km/L' },
              { label: '2WD Unleaded', value: '10–12 km/L' },
              { label: 'Fuel Tank', value: '70L' },
              { label: 'Wheelbase', value: 'Super Long' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-3xl text-ocean mb-1">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-5">Fully compliant with Australian safety regulations.</p>
        </div>
      </section>

      {/* Interior Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl text-charcoal mb-2">Interior Features</h2>
        <p className="text-gray-500 mb-10">Built for serious adventure without sacrificing comfort.</p>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              icon: '💺',
              title: 'Seating',
              desc: 'Bench seats, swivel seats, 2–6 seater arrangements, outdoor slide-out kitchen. Fully configurable for your needs.',
            },
            {
              icon: '🌡️',
              title: 'Climate',
              desc: 'Front A/C standard, optional rear A/C and Webasto FF heater with wool insulation for year-round comfort in any climate.',
            },
            {
              icon: '🍳',
              title: 'Kitchen',
              desc: 'Standard fridge with upgrade options, solid wood countertops, full kitchen setup. Cook anywhere, anytime.',
            },
            {
              icon: '🚿',
              title: 'Bathroom',
              desc: 'Portable and fixed toilet options, outdoor shower, hot water system available. Everything you need off-grid.',
            },
          ].map(c => (
            <div key={c.title} className="bg-white border border-gray-200 rounded-2xl p-7">
              <span className="text-3xl block mb-4">{c.icon}</span>
              <h3 className="font-semibold text-gray-900 mb-2">{c.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Electrical & Water */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl text-charcoal mb-6">Electrical System</h2>
              <ul className="space-y-2.5 text-sm text-gray-700">
                {[
                  '240V system (two 100Ah lithium batteries)',
                  '2000W inverter',
                  'Smart alternator charging',
                  'Shore power connection',
                  'Battery monitoring with fuse box and solar charge controller',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-ocean shrink-0 mt-0.5">⚡</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 bg-cream border border-sand rounded-xl px-4 py-3 text-sm text-gray-700">
                <span className="font-semibold text-ocean">Optional:</span> Solar panels — $2,000 AUD
              </div>
            </div>
            <div>
              <h2 className="text-3xl text-charcoal mb-6">Water System</h2>
              <ul className="space-y-2.5 text-sm text-gray-700">
                {[
                  'Two 19L water tanks standard',
                  'External hose refill connection',
                  'Hot water heater available',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-blue-400 shrink-0 mt-0.5">💧</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Optional Upgrades */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl text-charcoal mb-8">Optional Upgrades</h2>
        <div className="flex flex-wrap gap-3">
          {UPGRADES.map(u => (
            <span key={u.label}
              className="bg-cream border border-ocean-light text-charcoal text-sm font-medium px-4 py-2 rounded-full">
              {u.label}{u.price ? ` — ${u.price}` : ''}
            </span>
          ))}
        </div>
      </section>

      {/* Purchase section */}
      <section className="bg-charcoal text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-4xl text-white mb-6">Secure Your KUMAQ Build</h2>
              <dl className="space-y-4">
                {[
                  { label: 'Deposit to secure', value: '$10,000 AUD' },
                  { label: 'Final balance', value: '1 month before delivery' },
                  { label: 'Early payment discount', value: '70% within 2 weeks = $2,000 off' },
                  { label: 'Build time', value: 'Up to 6 months' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between gap-4 border-b border-white/10 pb-4">
                    <dt className="text-white/60 text-sm">{r.label}</dt>
                    <dd className="text-white font-semibold text-sm text-right">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="bg-white/10 rounded-2xl p-8 text-center">
              <p className="text-white/70 text-sm mb-2">Ready to get started?</p>
              <p className="text-3xl text-white mb-6">$10,000 AUD secures your build slot</p>
              <Link href="/quiz" className="block bg-sand text-charcoal font-semibold px-8 py-3.5 rounded-xl hover:bg-sand transition-colors text-base mb-3">
                Enquire About KUMAQ
              </Link>
              <a href="tel:0432182892" className="block border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-base">
                Book a Test Drive
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-cream border-t border-sand py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl text-charcoal mb-3">Not sure which van is right for you?</h2>
          <p className="text-gray-600 mb-8">Take our quick quiz and we&apos;ll match you with the perfect build.</p>
          <Link href="/quiz" className="btn-primary text-base px-8 py-3 inline-block">
            Take the Van Quiz →
          </Link>
        </div>
      </section>

    </div>
  )
}
