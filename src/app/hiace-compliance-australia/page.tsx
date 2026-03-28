import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Toyota Hiace Compliance Australia — RAWS Guide for Japanese Imports | Bare Camper',
  description: 'Complete guide to complying a Japanese import Toyota Hiace in Australia. RAWS process, costs, timelines, what gets modified, and how to register in QLD, NSW, VIC and WA.',
  url: '/hiace-compliance-australia',
})

const steps = [
  {
    n: '1',
    title: 'Vehicle Import Approval (VIA)',
    detail: 'Before the van even leaves Japan, we apply for a Vehicle Import Approval through the Australian Border Force. This is a government permit that authorises the import. Without it, customs won\'t release the vehicle. We handle this as part of the $3,000 Bare Camper fee — which covers both the Japan-side buyer\'s agent and the Australia-side brokerage.',
    cost: 'Included in Bare Camper fee',
  },
  {
    n: '2',
    title: 'Ocean freight & arrival',
    detail: 'The van ships from Yokohama to Brisbane (approximately 3–4 weeks). On arrival it goes into a licensed storage facility at the port while customs formalities are processed.',
    cost: '$2,500 shipping + $360 customs/BMSB',
  },
  {
    n: '3',
    title: 'Customs clearance & GST',
    detail: 'Customs entry is lodged, 10% GST is paid on the landed value (vehicle + shipping), and the BMSB (Brown Marmorated Stink Bug) heat treatment certificate from Japan is verified. 0% import duty applies under JAEPA. Clearance typically takes 3–7 business days.',
    cost: '10% GST on landed value + ~$110 entry fee',
  },
  {
    n: '4',
    title: 'Transport to RAWS workshop',
    detail: 'Once customs releases the van, it\'s transported on a truck to the compliance workshop. We coordinate this directly — you don\'t need to arrange anything.',
    cost: 'Included in compliance estimate',
  },
  {
    n: '5',
    title: 'RAWS compliance inspection & modifications',
    detail: 'A Registered Automotive Workshop (RAWS) technician inspects the van against Australian Design Rules (ADRs). Typical modifications on a Hiace include: speedometer conversion or sticker overlay (km/h), headlight beam adjustment for left-hand traffic if needed, seatbelt compliance check, emissions check, immobiliser verification, and any model-specific requirements. Most H200 Hiace vans are straightforward — they\'re right-hand drive already and well-known to compliance workshops.',
    cost: '~$1,800 (standard H200 cargo van)',
  },
  {
    n: '6',
    title: 'Compliance plate fitted',
    detail: 'Once the van passes all checks, the workshop affixes a compliance plate to the vehicle. This plate is the official proof that the van meets Australian Design Rules and is eligible for registration. It lists the VIN, compliance date, and workshop details.',
    cost: 'Included in compliance cost',
  },
  {
    n: '7',
    title: 'Safety certificate / roadworthy',
    detail: 'After compliance plating, the van needs a state-specific safety certificate (Queensland), roadworthy certificate (Victoria), or equivalent before it can be registered. This is typically done at the same workshop or a licensed inspection station.',
    cost: '$100–$200 depending on state',
  },
  {
    n: '8',
    title: 'Registration',
    detail: 'Take the compliance plate certificate, safety certificate, proof of ownership, and ID to your state transport authority (TMR in QLD, Service NSW, VicRoads, etc.) and register the van. First registration of an import is treated the same as a new vehicle registration.',
    cost: 'State registration fees apply',
  },
]

const faqs = [
  {
    q: 'What is RAWS and why does my Hiace need it?',
    a: 'RAWS stands for Registered Automotive Workshop Scheme. It\'s the Australian government\'s system for certifying that imported vehicles meet Australian Design Rules (ADRs) — the safety and emissions standards that all vehicles on Australian roads must comply with. Every Japanese import Hiace must go through a RAWS-approved workshop before it can be registered. The workshop inspects the van, makes any required modifications, and issues a compliance plate certifying it meets ADRs.',
  },
  {
    q: 'What modifications are typically needed on a Japanese Hiace?',
    a: 'The H200 Hiace is well-known to Australian compliance workshops and is generally straightforward. Typical requirements include: speedometer conversion or overlay to km/h (Japanese vans often show both, but an ADR-compliant label may be required), headlight beam pattern check for left-hand traffic, confirmation that seatbelts meet Australian standards, emissions check, and immobiliser verification. Right-hand drive is fine — all Japanese Hiace are RHD. In most cases no major mechanical changes are needed.',
  },
  {
    q: 'How much does Hiace compliance cost in Australia?',
    a: 'For a standard H200 cargo van, expect to pay around $1,800 all-in at a RAWS workshop. This includes the inspection, any required modifications, safety certificate, and compliance plate. More complex models — like the Hiace 4x4, commuter variants, or vans with factory accessories — may cost slightly more ($2,000–$2,500) due to additional inspection requirements. We\'ve built $1,800 into our standard cost estimates as a safe budget.',
  },
  {
    q: 'How long does compliance take?',
    a: 'Typically 2–3 weeks at the workshop, though this varies by workshop workload. Add 1–2 weeks for the customs clearance and transport to the workshop after arrival in Brisbane. From the day the van arrives in port to the day it has a compliance plate, allow 4–5 weeks.',
  },
  {
    q: 'Does a complied Hiace qualify for a full registration (not limited)?',
    a: 'Yes. A RAWS-complied vehicle gets a standard vehicle registration — the same as any Australian new car. There are no mileage restrictions, no restricted use conditions, and no special licence required. You register it, put plates on it, and drive it like any other registered vehicle.',
  },
  {
    q: 'Can I choose which state the compliance is done in?',
    a: 'Yes. RAWS compliance is nationally recognised, so a van complied in Queensland can be registered in Victoria, WA, or anywhere else without re-compliance. We have recommended workshops in QLD, NSW, VIC, and WA — we direct the van to the workshop closest to you or most convenient for your registration state.',
  },
  {
    q: 'What is the RAV (Register of Approved Vehicles)?',
    a: 'The RAV is the Australian government\'s list of vehicle models approved for import. The H200 Toyota Hiace (in its various configurations) is on the RAV, which is why it can be imported and complied. Not all vehicle models are eligible — but Hiace vans have been on the list for years and are a well-trodden path through compliance workshops.',
  },
  {
    q: 'Do I need a Vehicle Import Approval before the van ships?',
    a: 'Yes. A Vehicle Import Approval (VIA) is required before the van can be cleared through Australian customs. It\'s issued by the Department of Infrastructure and is specific to the vehicle (using the VIN). We apply for the VIA on your behalf as part of the import process — it\'s handled alongside the auction purchase and export paperwork in Japan.',
  },
  {
    q: 'Can I register the van in any Australian state?',
    a: 'Yes. Once complied, you register in your home state using the RAWS compliance certificate and a state-specific safety certificate. QLD requires a Safety Certificate (formerly roadworthy), VIC requires a Roadworthy Certificate, NSW requires a Pink Slip. The process is the same as registering any used vehicle — take the paperwork to your state transport office.',
  },
  {
    q: 'What happens if the van fails compliance?',
    a: 'In practice, a well-graded H200 Hiace rarely fails compliance — the model is so well-known that workshops know exactly what to check and what modifications are needed. If additional work is required beyond the standard scope, the workshop will quote you before proceeding. We always target grade 3.5 and above to minimise the risk of unexpected compliance issues.',
  },
]

export default function HiaceComplianceGuide() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <div className="bg-charcoal text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-ocean text-sm font-semibold uppercase tracking-widest mb-3">Compliance Guide — Australia</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            How to Comply a Japanese<br className="hidden md:block" /> Hiace in Australia
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
            Every Japanese import needs a compliance plate before it can be registered. Here&apos;s exactly what happens, what it costs, and how long it takes — from port arrival to plates on the van.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/import-costs" className="btn-primary">Full Cost Calculator</Link>
            <Link href="/import-hiace-australia" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm">
              Full Import Guide
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="bg-ocean text-white py-5 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">~$1,800</div>
            <div className="text-sm text-white/80">Typical compliance cost</div>
          </div>
          <div>
            <div className="text-2xl font-bold">2–3 weeks</div>
            <div className="text-sm text-white/80">At the workshop</div>
          </div>
          <div>
            <div className="text-2xl font-bold">0%</div>
            <div className="text-sm text-white/80">Import duty (JAEPA)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">QLD · NSW · VIC · WA</div>
            <div className="text-sm text-white/80">Our workshop network</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14">

        {/* What is compliance */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">What is compliance — and why does every import need it?</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Australian Design Rules (ADRs) are the national standards that every vehicle on Australian roads must meet — covering safety, emissions, lighting, and other requirements. Vehicles sold new in Australia are certified at the factory. Imported second-hand vehicles have to be certified after arrival, by a Registered Automotive Workshop (RAWS).
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            The compliance process involves a licensed workshop inspecting the van, making any required modifications, and issuing a compliance plate. That plate is the official proof the van meets ADRs. Without it, no Australian state will register the vehicle.
          </p>
          <p className="text-gray-600 leading-relaxed">
            For the H200 Toyota Hiace, compliance is well-understood and straightforward. The model has been imported into Australia for 20+ years. Every RAWS workshop knows the Hiace well, the required modifications are minimal, and the process is predictable.
          </p>
        </section>

        {/* Step by step */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-6">The full compliance process — step by step</h2>
          <div className="space-y-5">
            {steps.map(step => (
              <div key={step.n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-ocean text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.n}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <div className="font-semibold text-charcoal">{step.title}</div>
                    <div className="text-xs text-ocean bg-ocean/10 rounded px-2 py-0.5 whitespace-nowrap">{step.cost}</div>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cost summary */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Full cost summary — compliance and registration</h2>
          <div className="bg-cream rounded-xl p-5 border border-gray-100">
            <div className="space-y-2 text-sm text-gray-600">
              {[
                ['RAWS compliance inspection & modifications', '~$1,800'],
                ['Safety certificate / roadworthy', '$100–$200'],
                ['State registration (first year, QLD example)', '~$800–$1,200'],
                ['CTP insurance (compulsory third party)', 'Varies by state'],
              ].map(([label, cost]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span>{label}</span>
                  <span className="font-medium text-charcoal whitespace-nowrap">{cost}</span>
                </div>
              ))}
              <div className="flex justify-between gap-4 pt-2 border-t border-gray-200 mt-2 font-bold text-charcoal">
                <span>Compliance + rego budget</span>
                <span>~$2,800–$3,400</span>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-3">Registration costs vary by state, vehicle weight, and CTP provider. QLD example shown. NSW and VIC are comparable.</p>
        </section>

        {/* State differences */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Registering in your state</h2>
          <p className="text-gray-600 leading-relaxed mb-5">
            RAWS compliance is nationally recognised — a van complied anywhere in Australia can be registered in any state. The registration process after compliance is handled state-by-state:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-charcoal border border-gray-200">State</th>
                  <th className="text-left p-3 font-semibold text-charcoal border border-gray-200">Safety cert required</th>
                  <th className="text-left p-3 font-semibold text-charcoal border border-gray-200">Register at</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['QLD', 'Safety Certificate', 'Transport and Main Roads (TMR)'],
                  ['NSW', 'Pink Slip (e-Safety Check)', 'Service NSW'],
                  ['VIC', 'Roadworthy Certificate (RWC)', 'VicRoads'],
                  ['WA', 'Vehicle Inspection', 'Department of Transport'],
                  ['SA', 'Vehicle Safety Check', 'Service SA'],
                  ['Other states', 'Equivalent inspection', 'State transport authority'],
                ].map(([state, cert, authority], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 border border-gray-200 font-semibold text-charcoal">{state}</td>
                    <td className="p-3 border border-gray-200 text-gray-600">{cert}</td>
                    <td className="p-3 border border-gray-200 text-gray-500">{authority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-400 text-xs mt-3">
            We direct vans to RAWS workshops in QLD, NSW, VIC, and WA depending on your home state. Tell us where you want to register and we&apos;ll route accordingly.
          </p>
        </section>

        {/* How Bare Camper handles it */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">How Bare Camper handles compliance for you</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            One of the main reasons people use Bare Camper rather than going direct is that we handle the compliance end-to-end. You don&apos;t need to find a RAWS workshop, organise transport from the port, or figure out what&apos;s needed.
          </p>
          <div className="space-y-3">
            {[
              { title: 'VIA application', desc: 'We apply for the Vehicle Import Approval before the van leaves Japan. Included in your sourcing fee.' },
              { title: 'Port release & transport', desc: 'We manage customs clearance and arrange transport from the Brisbane port to the compliance workshop.' },
              { title: 'RAWS coordination', desc: 'We work with recommended workshops in QLD, NSW, VIC, and WA. We tell them what\'s coming, they know the Hiace, it moves quickly.' },
              { title: 'Updates throughout', desc: 'We keep you informed at each stage. You know when the van lands, when it clears customs, when it\'s at the workshop, and when it\'s ready.' },
              { title: 'Direct to conversion (optional)', desc: 'If you\'re getting a pop top or hi-top, the van can go from the compliance workshop straight to our Brisbane factory. One flow, no gaps.' },
            ].map(item => (
              <div key={item.title} className="flex gap-3">
                <span className="text-ocean font-bold mt-0.5">✓</span>
                <div>
                  <span className="font-semibold text-charcoal">{item.title} — </span>
                  <span className="text-gray-500 text-sm">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-6">Frequently asked questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-100 pb-6">
                <h3 className="font-semibold text-charcoal mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related guides */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-charcoal mb-4">More guides</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'Full Hiace import guide', href: '/import-hiace-australia' },
              { label: 'Import cost calculator', href: '/import-costs' },
              { label: 'H200 vs H300 comparison', href: '/h200-vs-h300-hiace' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-gray-200 rounded-xl p-4 text-sm font-medium text-ocean hover:bg-ocean/5 transition-colors"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-charcoal rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">We handle compliance end-to-end</h2>
          <p className="text-gray-300 mb-6 text-sm max-w-md mx-auto">
            From VIA application in Japan to a compliance-plated, registered van at your door. Get in touch to talk through the process.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/browse" className="btn-primary">Browse Vans</Link>
            <Link href="tel:0432182892" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm">
              Call 0432 182 892
            </Link>
          </div>
          <p className="text-gray-500 text-xs mt-5">hello@barecamper.com.au</p>
        </section>

      </div>
      <Footer />
    </div>
  )
}
