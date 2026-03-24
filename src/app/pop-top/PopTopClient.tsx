'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PageEditToolbar from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'
import LeadFormModal from '@/components/leads/LeadFormModal'

const STATIC_HERO = '/images/poptop/300-slwb-poptop-side.jpg'

export default function PopTopClient({ content: initial }: { content: Record<string, string> }) {
  const [content, setContent] = useState(initial)
  const [expandedOption, setExpandedOption] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <PageEditToolbar
        pageSlug="pop-top"
        pageName="Standing Room"
        content={content}
        onContentChange={setContent}
      />

      {/* Hero */}
      <FitoutHero fallbackImage={content.hero_image || STATIC_HERO} heroImage={content.hero_image} heroVideo={content.hero_video}>
        <p className="text-sand text-xs font-semibold tracking-[0.25em] uppercase mb-3">Bare Camper</p>
        <h1 className="text-5xl md:text-7xl text-white leading-tight mb-3">
          Standing Room
        </h1>
        <p className="text-white/80 text-xl md:text-2xl font-light mb-2">
          Just give me standing room.
        </p>
        <p className="text-white/60 text-base md:text-lg max-w-xl">
          Professional fiberglass pop top and hi-top roof conversions. Handmade in our Brisbane factory.
        </p>
      </FitoutHero>

      {/* The Numbers */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-10">The numbers</p>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="border border-gray-200 rounded-2xl p-10 hover:shadow-md transition-shadow">
            <p className="text-5xl text-ocean mb-3">$13,090</p>
            <p className="text-gray-500 text-sm font-medium">incl. GST — all models, same price</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-10 hover:shadow-md transition-shadow">
            <p className="text-5xl text-ocean mb-3">$5,000</p>
            <p className="text-gray-500 text-sm font-medium">deposit to schedule your build slot</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-10 hover:shadow-md transition-shadow">
            <p className="text-5xl text-ocean mb-3">10 days</p>
            <p className="text-gray-500 text-sm font-medium">turnaround from when we receive your van</p>
          </div>
        </div>
      </section>

      {/* Choose Your Roof */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Choose your roof</p>
          <h2 className="text-4xl text-charcoal mb-4">Pop Top or Hi-Top?</h2>
          <p className="text-gray-500 text-sm mb-12 max-w-2xl">
            Two ways to get standing room. One folds down for daily driving, the other stays up for maximum livability. Both are custom-made fiberglass, installed in our Brisbane factory.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pop Top Card */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="relative h-72">
                <Image src="/images/poptop/h200-lwb-threequarter.jpg" alt="Pop top roof raised on H200 LWB Hiace" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl text-charcoal mb-3">Pop Top</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Raises and lowers in 15 seconds. When lowered, adds only 140mm — fits in your garage, car parks, and drive-throughs. Canvas sides with windows give you 360-degree ventilation. The best of both worlds: daily driver and campervan.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Standing height added</span><span className="font-semibold text-charcoal">+600mm when raised</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">When lowered</span><span className="font-semibold text-charcoal">+140mm (fits garages)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Setup time</span><span className="font-semibold text-charcoal">10–15 seconds</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Available for</span><span className="font-semibold text-charcoal">All models (LWB + SLWB)</span></div>
                </div>
              </div>
            </div>

            {/* Hi-Top Card */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="relative h-72">
                <Image src="/images/hitop/300-slwb-hitop-front.jpg" alt="Hi-top roof conversion on 300 Series SLWB" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl text-charcoal mb-3">Hi-Top</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Permanent fixed fiberglass shell. Always standing room, no setup. Better insulation, more secure, and supports heavier roof loads like air-con, larger solar panels, and carry racks. The trade-off? Won&apos;t fit in standard garages.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">H200 SLWB height</span><span className="font-semibold text-charcoal">1.82m total (+20cm)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">300 Series SLWB height</span><span className="font-semibold text-charcoal">2.0m total (+40cm)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Setup time</span><span className="font-semibold text-charcoal">None — always ready</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Available for</span><span className="font-semibold text-charcoal">SLWB only</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interior Standing Room Photo */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="relative h-80 md:h-[500px] rounded-2xl overflow-hidden">
          <Image src="/images/poptop/h200-lwb-interior.jpg" alt="Interior view showing standing room with pop top raised" fill className="object-cover" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-8 left-8">
            <p className="text-white text-2xl md:text-3xl font-light">Standing room changes everything.</p>
            <p className="text-white/70 text-sm mt-2">Interior view with pop top raised — H200 LWB</p>
          </div>
        </div>
      </section>

      {/* Choose Your Van */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Choose your van</p>
          <h2 className="text-4xl text-charcoal mb-4">Which Hiace Do You Have?</h2>
          <p className="text-gray-500 text-sm mb-12 max-w-2xl">
            We fit pop tops and hi-tops to all Toyota Hiace models. Same price, same quality, same 10-day turnaround.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VAN_OPTIONS.map(van => (
              <div key={van.name} className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <Image src={van.image} alt={van.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg text-charcoal font-semibold mb-2">{van.name}</h3>
                  <div className="space-y-1 text-xs text-gray-500">
                    {van.roofOptions.map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-ocean shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included — Pop Top */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">No surprises</p>
        <h2 className="text-4xl text-charcoal mb-10">What&apos;s Included</h2>
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden bg-white">
          {POPTOP_INCLUSIONS.map(item => (
            <div key={item.label} className="px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:gap-8">
                <p className="font-semibold text-charcoal text-sm sm:w-52 shrink-0 mb-1 sm:mb-0">{item.label}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GALLERY_IMAGES.map((img, i) => (
            <div key={i} className="relative h-48 md:h-64 rounded-xl overflow-hidden">
              <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
            </div>
          ))}
        </div>
      </section>

      {/* Roof-Specific Add-Ons */}
      <section className="bg-cream py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">While we have your van</p>
          <h2 className="text-4xl text-charcoal mb-4">Roof Add-Ons</h2>
          <p className="text-gray-500 text-sm mb-10 max-w-2xl">
            Add these during your roof conversion — saves time and money doing it all at once.
          </p>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
            {ROOF_ADDONS.map(opt => (
              <button
                key={opt.name}
                onClick={() => setExpandedOption(expandedOption === opt.name ? null : opt.name)}
                className="w-full text-left px-6 py-5 hover:bg-cream transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {opt.image && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                        <Image src={opt.image} alt={opt.name} fill className="object-cover" sizes="48px" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-charcoal text-sm">{opt.name}</p>
                      {opt.subtitle && <p className="text-gray-400 text-xs mt-0.5">{opt.subtitle}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-ocean text-lg shrink-0">{opt.price}</p>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedOption === opt.name ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                {expandedOption === opt.name && opt.description && (
                  <p className="text-gray-500 text-sm mt-3 pl-16 leading-relaxed">{opt.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* General Options */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">Make it yours</p>
        <h2 className="text-4xl text-charcoal mb-4">Select Options</h2>
        <p className="text-gray-500 text-sm mb-10 max-w-2xl">
          These options can be added to any van — during your roof conversion or later.
        </p>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
          {GENERAL_OPTIONS.map(opt => (
            <button
              key={opt.name}
              onClick={() => setExpandedOption(expandedOption === opt.name ? null : opt.name)}
              className="w-full text-left px-6 py-5 hover:bg-cream transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {opt.image && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <Image src={opt.image} alt={opt.name} fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-charcoal text-sm">{opt.name}</p>
                    {opt.subtitle && <p className="text-gray-400 text-xs mt-0.5">{opt.subtitle}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-ocean text-lg shrink-0">{opt.price}</p>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedOption === opt.name ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {expandedOption === opt.name && opt.description && (
                <p className="text-gray-500 text-sm mt-3 pl-16 leading-relaxed">{opt.description}</p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-charcoal text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-sand text-xs font-semibold tracking-widest uppercase mb-4">Ready to stand up in your van?</p>
          <h2 className="text-4xl md:text-5xl mb-4">Book Your Build Slot</h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            $5,000 deposit locks in your 10-business-day turnaround. We&apos;ll contact you to schedule your drop-off date.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <LeadFormModal
              trigger="Get in Touch"
              source="product_page_standing_room"
              leadType="roof_conversion_booking"
              className="btn-primary text-base px-8 py-4"
            />
            <Link href="/vans" className="btn-ghost text-base px-8 py-4">
              Browse Vans
            </Link>
          </div>
          <div className="mt-10 space-y-1 text-sm text-gray-400">
            <p>
              Jared Campion
              {' · '}
              <a href="tel:0432182892" className="text-sand hover:text-sand">0432 182 892</a>
              {' · '}
              <a href="mailto:hello@barecamper.com.au" className="text-sand hover:text-sand">hello@barecamper.com.au</a>
            </p>
            <p>DIY RV Solutions · 1/10 Jones Road, Capalaba, QLD 4157</p>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Static data ───────────────────────────────────────────────────────────────

const VAN_OPTIONS = [
  {
    name: 'H200 LWB',
    image: '/images/poptop/h200-lwb-side.jpg',
    roofOptions: ['Pop Top'],
  },
  {
    name: 'H200 SLWB',
    image: '/images/poptop/h200-slwb-poptop.jpg',
    roofOptions: ['Pop Top', 'Hi-Top'],
  },
  {
    name: '300 Series LWB',
    image: '/images/poptop/three-quarter-up.jpg',
    roofOptions: ['Pop Top'],
  },
  {
    name: '300 Series SLWB',
    image: '/images/poptop/300-slwb-poptop-side.jpg',
    roofOptions: ['Pop Top', 'Hi-Top'],
  },
]

const GALLERY_IMAGES = [
  { src: '/images/poptop/h200-lwb-threequarter.jpg', alt: 'H200 LWB pop top raised at golden hour' },
  { src: '/images/hitop/300-slwb-hitop-rear.jpg', alt: '300 Series SLWB hi-top rear view with door' },
  { src: '/images/poptop/h200-lwb-interior.jpg', alt: 'Interior standing room with pop top raised' },
  { src: '/images/poptop/sunset-window.jpg', alt: 'Sunset through canvas window' },
  { src: '/images/hitop/300-slwb-hitop-front.jpg', alt: '300 Series SLWB hi-top front view' },
  { src: '/images/poptop/seal-detail.jpg', alt: 'Fiberglass seal detail showing quality' },
]

const POPTOP_INCLUSIONS = [
  { label: 'Fibreglass Shell', detail: 'Custom-made fibreglass base and roof (white finish, colour matched to Toyota or various shades). Handmade to order in our Brisbane factory.' },
  { label: 'Standing Height', detail: 'Pop top adds approximately 600mm of extra internal height when raised. Hi-top adds 20cm (H200) or 40cm (300 Series) permanently.' },
  { label: 'Internal Space', detail: 'H200 LWB: 1.2m wide × 2.45m long, 1.9m standing room. Canvas measures 1.3m × 2.9m. 300 Series LWB: 1m wide × 2.25m long.' },
  { label: 'Mechanism (Pop Top)', detail: '3 spring-assisted canopy lifters (scissor lifts) for effortless raising and lowering. 10–15 seconds to full height.' },
  { label: 'Canvas (Pop Top)', detail: 'Grey canvas sleeve with choice of 3 or 4 windows. YKK zippers and fine gauge fly screens for sand fly protection.' },
  { label: 'Insulation', detail: 'Fully insulated roof section. Hi-tops offer superior insulation and noise reduction — warmer in winter than canvas.' },
  { label: 'Interior Finish', detail: 'Internal headlining and finished trimming for a professional, seamless look.' },
  { label: 'Durability', detail: 'Made of durable fibreglass — less likely to suffer from spot rust than the original roof.' },
  { label: 'Hardware', detail: '2 grab handles, 4 bonnet clamps, pinch weld, boot seal, and bungee cord for secure closing.' },
]

const ROOF_ADDONS = [
  {
    name: 'Internal LED Down Lights',
    price: '$990',
    subtitle: 'Professional cabin lighting',
    image: null,
    description: 'Installation of high-quality LED downlights in the cabin area. Warm, even lighting that makes the interior feel like home.',
  },
  {
    name: 'Solar Panel Installation (Customer Supplied)',
    price: '$1,980',
    subtitle: 'We fit your panel',
    image: '/images/products/solar-panel.jpg',
    description: 'Professional fitting and wiring of a solar panel you supply. Mounted securely to the roof with weatherproof connections.',
  },
  {
    name: 'Solar Panel Installation (Renogy 200W)',
    price: '$2,420',
    subtitle: 'Supply + fit included',
    image: '/images/products/solar-panel.jpg',
    description: 'Includes supply and professional fitting of a Renogy 200W solar panel. Everything you need to start charging off-grid.',
  },
  {
    name: 'Main Awning Installation',
    price: '$990',
    subtitle: 'Customer supplies awning',
    image: '/images/products/awning.jpg',
    description: 'Professional fitting of a main side awning. You supply the awning, we mount it securely to the roof rails.',
  },
  {
    name: 'Shower Awning Installation',
    price: '$990',
    subtitle: 'Customer supplies awning',
    image: null,
    description: 'Professional fitting of a shower awning or tent. Great for outdoor showers and extra sheltered space.',
  },
  {
    name: 'Maxxfan',
    price: '$1,650',
    subtitle: 'Supply + fit',
    image: '/images/products/maxxfan.jpg',
    description: 'Supply and fit of a Maxxfan ventilation fan. Rain-proof, thermostat-controlled, and whisper quiet. Essential for comfortable sleeping.',
  },
  {
    name: 'Carpeted Trim to Walls',
    price: '$2,640',
    subtitle: 'Insulated interior finish',
    image: null,
    description: 'Professional installation of durable carpeted trim for a finished, insulated interior on the van walls. Reduces condensation and improves acoustics.',
  },
]

const GENERAL_OPTIONS = [
  {
    name: 'Recommended Package',
    price: '$3,800',
    subtitle: 'Curtains, screens, nets, MAXXFAN',
    image: '/images/products/curtains.jpg',
    description: 'Black-out curtains, insect screens, insect net rear door, side-window rain cover, and MAXXFAN. The essentials for comfortable van life.',
  },
  {
    name: 'Starter Pack — 12V Electrical',
    price: '$5,000',
    subtitle: '200AH lithium, solar-ready',
    image: null,
    description: '200AH lithium battery, solar-ready 12V system. No shore power needed — no need to encase the battery. Simple, reliable power for lights, fans, and charging.',
  },
  {
    name: 'Off-Grid Pro — Power Boss',
    price: 'Get a Quote',
    subtitle: 'Full electrical, professionally installed',
    image: null,
    description: 'Complete electrical system professionally installed by a qualified electrician. Includes shore power, inverter, solar, battery management — the works. Price depends on your setup, so get in touch for a custom quote.',
  },
  {
    name: 'FF Heater Package',
    price: '$5,500',
    subtitle: 'Thermal insulation + Webasto heater',
    image: '/images/products/heater.jpg',
    description: 'Thermal wool insulation throughout plus a Webasto forced-air heater. Stay warm anywhere in Australia — essential for winter camping and highland trips.',
  },
  {
    name: 'Side Awning',
    price: '$2,300',
    subtitle: 'Fiamma 3.5M',
    image: '/images/products/awning.jpg',
    description: 'Fiamma 3.5M side awning. Quick to deploy, gives you a shaded outdoor living area. Rolls up neatly when driving.',
  },
  {
    name: 'Half Wrap',
    price: '$3,300',
    subtitle: 'Custom vinyl wrap',
    image: '/images/products/half-wrap.jpg',
    description: 'Custom vinyl half wrap to protect your paint and make your van stand out. Choose your colour and design.',
  },
]
