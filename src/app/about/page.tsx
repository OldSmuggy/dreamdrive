import { generateMeta } from '@/lib/seo'
import Footer from '@/components/ui/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMeta({
  title: 'About | Bare Camper',
  description: 'The team behind Bare Camper — end-to-end Toyota Hiace campervan conversions from Japan to your driveway.',
  url: '/about',
})

const STEPS = [
  {
    number: '01',
    title: 'Find your van',
    body: 'Browse quality Hiace vans from Japanese auctions or local stock. Every van is inspected and graded.',
  },
  {
    number: '02',
    title: 'We handle the hard part',
    body: 'Import, shipping, compliance, rego. Fixed price, no surprises.',
  },
  {
    number: '03',
    title: 'Choose your build level',
    body: 'Bare van, roof conversion, or full turnkey. You pick where we stop.',
  },
  {
    number: '04',
    title: 'Get camping',
    body: "Everything's lined up through one team, so you're on the road faster than doing it yourself.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-charcoal text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">About Bare Camper</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            The only end-to-end<br className="hidden md:block" /> Hiace campervan service in Australia
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto">
            Bare Camper is a joint venture between Dream Drive and DIY RV Solutions — both based in
            Capalaba, Queensland. Between us we cover every step: sourcing vans from Japan, bringing them
            into Australia, and converting them into your perfect camper. One address. One handshake.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-5xl mx-auto">
          <p className="text-ocean text-sm font-semibold tracking-widest uppercase mb-3 text-center">The process</p>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal text-center mb-14">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {STEPS.map(step => (
              <div key={step.number} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <span className="text-5xl font-black text-ocean/20 leading-none block mb-4">{step.number}</span>
                <h3 className="text-xl font-bold text-charcoal mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dream Drive — Japan Infrastructure */}
      <section className="py-20 px-4 bg-charcoal text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-3">Dream Drive — Japan</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Real boots on the ground in Japan</h2>
              <p className="text-white/70 leading-relaxed mb-5">
                Most importers buy blind from an auction sheet. Dream Drive has a team physically in Japan —
                attending auctions, inspecting vehicles before bidding, and building relationships with dealers
                to access stock that never hits the open market.
              </p>
              <p className="text-white/70 leading-relaxed mb-5">
                Our agents speak Japanese, know the auction houses, and have the eye to spot what the grade
                sheets don&apos;t tell you. That&apos;s what makes the difference between a good van and a great one.
              </p>
              <ul className="space-y-3">
                {[
                  'Physical inspection before every bid',
                  'Access to dealer and off-auction stock',
                  'Honest condition reports in plain English',
                  'Buying power built over years in market',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-white/80">
                    <svg className="w-5 h-5 text-sand shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden bg-white/5 aspect-[4/3] flex items-center justify-center">
              {/* Replace with Japan team photo */}
              <div className="text-center text-white/30 p-8">
                <svg className="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm">Japan team photo coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIY RV Solutions */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3] flex items-center justify-center">
              {/* Replace with workshop photo */}
              <div className="text-center text-gray-400 p-8">
                <svg className="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm">Workshop photo coming soon</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <p className="text-ocean text-sm font-semibold tracking-widest uppercase mb-3">DIY RV Solutions × Dream Drive — Capalaba QLD</p>
              <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-6">Australia&apos;s Hiace conversion specialists</h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                Dream Drive and DIY RV Solutions share premises in Capalaba, Queensland — which means
                your van goes from the import yard straight into the conversion workshop without leaving
                the block. DIY RV Solutions has been building and converting Toyota Hiace vans for years,
                from fiberglass pop tops and hi-tops to full turnkey campervans.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Every build is done in-house by people who actually use these vehicles. No outsourcing,
                no middlemen — and the same team answers when you call.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Team */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-4xl mx-auto">
          <p className="text-ocean text-sm font-semibold tracking-widest uppercase mb-3 text-center">Who you&apos;re dealing with</p>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal text-center mb-14">The team behind it</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              {
                name: 'Jared Campion',
                role: 'Imports & Sales — Dream Drive',
                bio: 'Jared runs the Japan-side sourcing and handles customer relationships from first enquiry through to delivery. He knows Hiace vans inside out.',
              },
              {
                name: 'Andrew',
                role: 'Builds & Conversions — DIY RV Solutions',
                bio: 'Andrew heads up the workshop at Capalaba. If it involves fiberglass, wiring, or fit-out, Andrew and his team are the ones doing it.',
              },
            ].map(person => (
              <div key={person.name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-20 h-20 rounded-full bg-charcoal/10 mx-auto mb-5 flex items-center justify-center">
                  <svg className="w-10 h-10 text-charcoal/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-charcoal mb-1">{person.name}</h3>
                <p className="text-ocean text-sm font-semibold mb-4">{person.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{person.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact + Map */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-ocean text-sm font-semibold tracking-widest uppercase mb-3 text-center">Get in touch</p>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal text-center mb-14">Find us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-2">Dream Drive &amp; DIY RV Solutions</p>
                <p className="text-gray-600 leading-relaxed">
                  1/10 Jones Road<br />
                  Capalaba QLD 4157<br />
                  Australia
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-2">Contact</p>
                <p className="text-gray-600 leading-relaxed">
                  <a href="mailto:hello@barecamper.com.au" className="text-ocean hover:underline">hello@barecamper.com.au</a><br />
                  <a href="tel:0432182892" className="text-ocean hover:underline">0432 182 892</a>
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-2">Hours</p>
                <p className="text-gray-600 leading-relaxed">
                  Mon – Fri: 8am – 5pm<br />
                  Saturday by appointment
                </p>
              </div>
              <a
                href="mailto:hello@barecamper.com.au"
                className="inline-block bg-ocean text-white font-semibold px-6 py-3 rounded-xl hover:bg-ocean/90 transition-colors"
              >
                Send us a message
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-[4/3]">
              <iframe
                title="Bare Camper location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3539.2!2d153.2135!3d-27.5270!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b9147a00000000%3A0x0!2s1%2F10+Jones+Rd%2C+Capalaba+QLD+4157!5e0!3m2!1sen!2sau!4v1700000000000!5m2!1sen!2sau"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
