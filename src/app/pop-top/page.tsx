import Link from 'next/link'
import LeadFormModal from '@/components/leads/LeadFormModal'

export const metadata = {
  title: 'Pop Top Roof Conversion — From $11,900 | DIY RV Solutions',
  description:
    'Professional fiberglass pop top conversion for Toyota Hiace and more. Standing room in 15 seconds. Fits in your garage. Brisbane factory. 10 business day turnaround.',
}

export default function PopTopPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-forest-950 min-h-[60vh] flex items-end overflow-hidden">
        {/* TODO: Add Pop Top hero photo */}
        <div className="absolute inset-0 bg-forest-900 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/30 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-16 pt-32 w-full">
          <p className="text-sand-400 text-xs font-semibold tracking-[0.25em] uppercase mb-3">DIY RV Solutions</p>
          <h1 className="font-display text-5xl md:text-7xl text-white leading-tight mb-3">
            Pop Top Roof Conversion
          </h1>
          <p className="text-white/80 text-xl md:text-2xl font-light mb-2">
            Standing room in 15 seconds. Fits in your garage when lowered.
          </p>
          <p className="text-white/60 text-base md:text-lg max-w-xl">
            Proudly designed, manufactured, and installed in our Brisbane factory.
          </p>
        </div>
      </section>

      {/* ─── PRICING & BOOKING ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-10">The numbers</p>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="border border-gray-200 rounded-2xl p-10 hover:shadow-md transition-shadow">
            <p className="font-display text-5xl text-forest-700 mb-3">$11,900</p>
            <p className="text-gray-500 text-sm font-medium">ex GST</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-10 hover:shadow-md transition-shadow">
            <p className="font-display text-5xl text-forest-700 mb-3">$4,000</p>
            <p className="text-gray-500 text-sm font-medium">deposit to schedule your build slot</p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-10 hover:shadow-md transition-shadow">
            <p className="font-display text-5xl text-forest-700 mb-3">10 days</p>
            <p className="text-gray-500 text-sm font-medium">turnaround from when we receive your van</p>
          </div>
        </div>
      </section>

      {/* ─── WHAT'S INCLUDED ──────────────────────────────────── */}
      <section className="bg-sand-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">No surprises</p>
          <h2 className="font-display text-4xl text-forest-900 mb-10">What&apos;s Included in Your Conversion</h2>
          <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden bg-white">
            {POPTOP_INCLUSIONS.map(item => (
              <div key={item.label} className="px-6 py-5">
                <div className="flex flex-col sm:flex-row sm:gap-8">
                  <p className="font-semibold text-forest-900 text-sm sm:w-52 shrink-0 mb-1 sm:mb-0">{item.label}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENEFITS ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Why pop top?</p>
        <h2 className="font-display text-4xl text-forest-900 mb-10">Benefits of a Pop Top</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {POPTOP_BENEFITS.map(b => (
            <div key={b.title} className="border border-gray-200 rounded-2xl p-8 hover:shadow-md transition-shadow">
              <h3 className="font-display text-xl text-forest-900 mb-3">{b.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ADD-ON OPTIONS ───────────────────────────────────── */}
      <section className="bg-sand-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Go further</p>
          <h2 className="font-display text-4xl text-forest-900 mb-10">Add-On Options</h2>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
            {POPTOP_ADDONS.map(opt => (
              <div key={opt.name} className="flex items-start justify-between gap-4 px-6 py-5 hover:bg-sand-50 transition-colors">
                <p className="font-semibold text-forest-900 text-sm">{opt.name}</p>
                <p className="font-display text-forest-700 text-lg shrink-0">{opt.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPATIBLE VEHICLES ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sand-500 text-xs font-semibold tracking-widest uppercase mb-3">Compatibility</p>
        <h2 className="font-display text-4xl text-forest-900 mb-4">Compatible Vehicles</h2>
        <p className="text-gray-500 text-sm mb-8 max-w-2xl">
          We have 4 different moulds which we can fit onto various different size vehicles.
        </p>
        <div className="flex flex-wrap gap-3">
          {COMPATIBLE_VEHICLES.map(v => (
            <span key={v} className="border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 bg-white">
              {v}
            </span>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="bg-forest-900 text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-sand-400 text-xs font-semibold tracking-widest uppercase mb-4">Ready to go</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Book Your Build Slot</h2>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            Get in touch to secure your spot. $4,000 deposit locks in your 10-business-day turnaround.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <LeadFormModal
              trigger="Get in Touch"
              source="product_page_poptop"
              leadType="pop_top_booking"
              className="btn-primary text-base px-8 py-4"
            />
            <Link href="/build" className="btn-ghost text-base px-8 py-4">
              Add Pop Top to My Van Build
            </Link>
          </div>
          <div className="mt-10 space-y-1 text-sm text-gray-400">
            <p>
              Jared Campion
              {' · '}
              <a href="tel:0432182892" className="text-sand-400 hover:text-sand-300">0432 182 892</a>
              {' · '}
              <a href="mailto:poptops@diyrvsolutions.com.au" className="text-sand-400 hover:text-sand-300">poptops@diyrvsolutions.com.au</a>
            </p>
            <p>1/10 Jones Road, Capalaba, QLD 4157</p>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Static data ───────────────────────────────────────────────────────────────
const POPTOP_INCLUSIONS = [
  { label: 'Fibreglass Shell', detail: 'Custom-made fibreglass base and roof (white finish only, colour matched to Toyota or various shades)' },
  { label: 'Standing Height', detail: 'Adds approximately 600mm of extra internal height when raised' },
  { label: 'Internal Space', detail: 'H200 LWB: 1.2m wide × 2.45m long, 1.9m standing room. Canvas measures 1.3m × 2.9m width. 300 series LWB: 1m wide × 2.25m long.' },
  { label: 'Mechanism', detail: '3 spring-assisted canopy lifters (scissor lifts) for effortless raising and lowering' },
  { label: 'Canvas', detail: 'Grey canvas sleeve with choice of 3 or 4 windows' },
  { label: 'Ventilation', detail: 'YKK zippers and fine gauge fly screens for sand fly protection' },
  { label: 'Insulation', detail: 'Fully insulated roof section' },
  { label: 'Finish', detail: 'Internal headlining for a professional finish' },
  { label: 'Hardware', detail: '2 grab handles, 4 bonnet clamps, pinch weld, boot seal, bungee cord' },
]

const POPTOP_BENEFITS = [
  {
    title: 'Daily Driver Friendly',
    body: 'When lowered, only adds approximately 140mm to the exterior height. Fits in nearly all standard car parks and home garages.',
  },
  {
    title: 'Fuel Efficiency',
    body: 'Lowered roof reduces wind resistance while driving, improving handling and fuel efficiency compared to fixed high-tops.',
  },
  {
    title: 'Rapid Setup',
    body: 'Super fast to set up, generally taking only 10–15 seconds to pop up and gain full standing room.',
  },
  {
    title: 'Superior Ventilation',
    body: 'Large surrounding canvas windows provide unmatched 360-degree ventilation for comfortable summer touring.',
  },
]

const POPTOP_ADDONS = [
  { name: 'Internal LED Down Lights', price: '$900' },
  { name: 'Solar Panel Installation (customer supplied)', price: '$1,800' },
  { name: 'Solar Panel Installation (Renogy 200W)', price: '$2,200' },
  { name: 'Main Awning Installation (customer supplied)', price: '$900' },
  { name: 'Shower Awning Installation (customer supplied)', price: '$900' },
  { name: 'Carpeted Trim to Walls', price: '$2,400' },
]

const COMPATIBLE_VEHICLES = [
  'Toyota Hiace H200',
  'Toyota Hiace 300 Series LWB',
  'Toyota Hiace SLWB H200',
  'VW T5',
  'Mercedes Vito',
  'Mercedes Sprinter',
]
