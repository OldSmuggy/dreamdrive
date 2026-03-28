import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import { generateMeta } from '@/lib/seo'
import FaqAccordion from './FaqAccordion'

export const metadata = generateMeta({
  title: 'Frequently Asked Questions — Importing a Campervan to Australia',
  description: 'Everything you need to know about importing a Toyota Hiace from Japan, campervan conversions, compliance, costs, timelines, finance, and the Bare Camper build process.',
  url: '/faqs',
})

const CATEGORIES = [
  {
    id: 'import-process',
    label: '🚢 Import Process',
    faqs: [
      {
        q: 'Can I import a Toyota Hiace from Japan to Australia?',
        a: 'Yes. Toyota Hiace vans are one of the most commonly imported vehicles from Japan to Australia. They qualify under the Registered Automotive Workshop Scheme (RAWS) and benefit from 0% import duty under the Japan-Australia Economic Partnership Agreement (JAEPA). You\'ll pay 10% GST on the landed value, plus compliance costs of around $1,800.',
      },
      {
        q: 'How long does the import process take?',
        a: 'Typically 10–14 weeks from auction win to Australian delivery. Roughly: 2–3 weeks Japan-side logistics and export paperwork, 3–4 weeks ocean freight (Yokohama to Brisbane), 1–2 weeks customs and quarantine clearance, then 2–3 weeks at the compliance workshop for inspection, safety certificate, and compliance plate.',
      },
      {
        q: 'What happens after I place the $3,000 deposit?',
        a: 'The $3,000 hold is fully refundable and secures your chosen van while we finalise paperwork. It goes towards your final purchase price. Once you\'re locked in, we handle bidding (or dealer negotiation), payment in yen, export documentation, and shipping. You get progress updates at every stage.',
      },
      {
        q: 'Do I need to do anything during the import?',
        a: 'Nope — we handle everything. Auction bidding, export paperwork, Vehicle Import Approval, shipping, customs, quarantine, compliance, and registration. You just pick your van and your build level, then wait for us to hand over the keys.',
      },
      {
        q: 'Can I import a right-hand drive Hiace?',
        a: 'Yes — this is one of the main advantages of importing from Japan. Japan is right-hand drive, so all Japanese-market Hiace vans are RHD and fully road-legal in Australia without any conversion. They drive identically to Australian-delivered Hiace vans.',
      },
    ],
  },
  {
    id: 'costs-pricing',
    label: '💰 Costs & Pricing',
    faqs: [
      {
        q: 'What does it cost to import a Hiace from Japan?',
        a: 'For a typical H200 LWB Hiace at ¥2,000,000 (~$19,000 AUD), expect: vehicle ~$19,000, Bare Camper sourcing fee $3,000, ocean freight $2,500, GST (10% on landed value) ~$2,150, customs + quarantine ~$360, compliance ~$1,800. Total landed and complied: approximately $28,800–$30,000 AUD. Compare that to the same van from an Australian dealer at $33,000–$38,000.',
      },
      {
        q: 'What is the Bare Camper sourcing fee?',
        a: 'Our flat $3,000 fee covers both sides of the import — the Japan-side buyer\'s agent (auction bidding, dealer negotiation, vehicle inspection, purchase, and export logistics) AND the Australia-side brokerage (Vehicle Import Approval, customs, compliance coordination, and project management from start to finish). Most importers charge separately for the Japan agent and the Australian broker. We\'re the only business that handles both under one fee. No hidden margins on the vehicle price — what you see at auction is what you pay.',
      },
      {
        q: 'Do I pay GST on a Japanese import?',
        a: 'Yes. GST is 10% of the landed value (vehicle purchase price + shipping). There is no import duty on Japanese vehicles under the JAEPA free trade agreement — that 0% duty is a significant saving. You\'ll also pay a customs entry fee (~$110) and BMSB heat treatment (~$250).',
      },
      {
        q: 'What\'s the difference between buying from a dealer and importing direct?',
        a: 'When you buy a Japanese import Hiace from an Australian dealer, you\'re paying the dealer\'s margin on top of the importer\'s margin on top of the auction price. That can add $5,000–$10,000. Importing direct through Bare Camper means you pay the actual auction price plus our flat $3,000 fee. You see the auction grade, photos, and inspection report — and you decide whether to bid.',
      },
      {
        q: 'Are there any hidden fees?',
        a: 'No. We quote you a total landed cost upfront that includes the vehicle, our fee, shipping, GST, customs, and compliance. The only variable is the exchange rate, which can move between quoting and auction day — but we show you the live rate and you can lock in when you\'re ready.',
      },
    ],
  },
  {
    id: 'compliance',
    label: '✅ Compliance & Registration',
    faqs: [
      {
        q: 'What is RAWS compliance?',
        a: 'RAWS (Registered Automotive Workshop Scheme) is the Australian government system for importing and complying used vehicles. A RAWS-approved workshop inspects your van against Australian Design Rules (ADRs), makes any required modifications, issues a safety certificate, and fits a compliance plate. This plate is required before you can register the vehicle.',
      },
      {
        q: 'What does compliance cost?',
        a: 'Compliance for a standard H200 Hiace cargo van is approximately $1,800. This includes the roadworthy inspection, any required modifications (speedometer conversion, headlight beam adjustment, seatbelt check, emissions check), safety certificate, and compliance plate.',
      },
      {
        q: 'How long does compliance take?',
        a: 'Typically 2–3 weeks from when the van arrives at the workshop. We have established relationships with RAWS workshops in QLD, NSW, VIC, and WA, so there\'s minimal wait time.',
      },
      {
        q: 'What modifications are needed for compliance?',
        a: 'Most H200 Hiaces are straightforward. Typical modifications include: speedometer conversion or sticker overlay (km/h), headlight beam adjustment for left-hand traffic if needed, seatbelt compliance check, emissions check, and immobiliser verification. Because they\'re already right-hand drive, there\'s no steering conversion needed.',
      },
      {
        q: 'Can I register in any state?',
        a: 'Yes — once the van has a compliance plate, it can be registered in any Australian state or territory. We handle QLD registration as standard. Interstate registration can be arranged at additional cost, or you can transfer rego to your home state after collection.',
      },
      {
        q: 'What if the van fails compliance?',
        a: 'It\'s extremely rare for a Hiace to fail compliance — they\'re one of the most commonly complied vehicles in Australia and workshops know them well. If an issue does arise, the workshop makes the required modifications as part of the compliance process. We\'ve never had a van that couldn\'t be complied.',
      },
    ],
  },
  {
    id: 'vehicles',
    label: '🚐 Choosing Your Van',
    faqs: [
      {
        q: 'H200 vs H300 Hiace — which should I import?',
        a: 'The H200 (2004–2019) is the most popular choice for campervan conversions. Proven engines, excellent parts availability in Australia, and the best price-to-condition ratio. The H300 (2019–present) has a better driving position and more modern features, but higher prices. For a campervan build, the H200 LWB or SLWB is the go-to.',
      },
      {
        q: 'What\'s the difference between LWB and SLWB?',
        a: 'LWB (Long Wheelbase) is the standard cargo van — roughly 4.7m long with a 3m load bay. SLWB (Super Long Wheelbase) adds about 300mm to the wheelbase and load bay. If you plan to stand up, sleep two adults comfortably, or fit a proper kitchen, the SLWB is worth the small premium. Most of our conversions are built on the SLWB.',
      },
      {
        q: 'What are Japanese auction grades?',
        a: 'Japanese auction houses independently grade every vehicle before sale. The main scale runs from 1 (poor) to 5 (near-perfect), with half grades (3.5, 4.5). Interior is graded A (excellent) to D (poor). We target grade 3.5 and above — you see the grade, photos, and inspection report before we bid.',
      },
      {
        q: 'Diesel or petrol — which is better?',
        a: 'For a campervan, the 3.0L turbo diesel (1KD-FTV) is the most popular choice — better fuel economy, more torque for loaded driving, and widely available in the H200. The 2.7L petrol (2TR-FE) is cheaper to buy but uses more fuel. Both are reliable and well-supported by mechanics Australia-wide.',
      },
      {
        q: 'Can I import a 4WD Hiace?',
        a: 'Yes. Toyota made factory 4WD versions of the H200 Hiace (not the H300). They\'re more expensive at auction but are sought after for off-road camping. The 4WD system is a proper part-time 4WD with low range. They\'re fully compliant for Australian import.',
      },
      {
        q: 'Can I see the van before buying?',
        a: 'Japanese auction vans come with a graded inspection sheet (grade 3–5) with detailed photos. We can also arrange independent inspections at the auction yard for a fee. For dealer-sourced vans, we arrange a full photo and video inspection before you commit.',
      },
    ],
  },
  {
    id: 'conversions',
    label: '🏗️ Conversions & Builds',
    faqs: [
      {
        q: 'What conversion options do you offer?',
        a: 'Three paths: (1) Pop top or hi-top roof conversion only — from $13,090, 10 business days. (2) MANA build — couples adventure van with pop top, kitchen, 75L fridge, toilet, shower, 200Ah lithium. (3) TAMA build — family 6-seater with ISOFIX, galley kitchen, walnut countertops, full electrical. Or just take the van as-is and DIY it.',
      },
      {
        q: 'How long does a conversion take?',
        a: 'Pop top or hi-top roof: 10 business days. Full MANA or TAMA conversion: 8–12 weeks. These timelines start after your van arrives and clears compliance — so total from auction to finished camper is typically 18–26 weeks for a full build.',
      },
      {
        q: 'Who does the conversions?',
        a: 'All conversions are done by DIY RV Solutions at their factory in Brisbane. They\'re our conversion partner and one of Australia\'s most experienced Hiace conversion shops. Pop tops, hi-tops, full fit-outs — they\'ve done hundreds.',
      },
      {
        q: 'Can I supply my own parts or spec?',
        a: 'To a degree — we\'re flexible on finishes and options within our standard builds. For fully custom builds, have a chat with us and we\'ll see what\'s possible. Most buyers find the TAMA or MANA spec covers everything they need.',
      },
      {
        q: 'What warranty do conversions come with?',
        a: 'All Bare Camper conversions (TAMA, MANA, pop top, hi-top) come with a 12-month warranty on the fit-out, electrical, and roof conversion. The compliance work carries a 1-month warranty. The base vehicle doesn\'t come with a manufacturer warranty as it\'s a used import.',
      },
      {
        q: 'Pop top vs hi-top — which should I choose?',
        a: 'Pop top ($13,090): Lower profile when closed, less wind resistance, stealth camping. Opens up for standing room inside. Hi-top ($15,090): Permanent standing room, more headroom, more storage space in the roof area. Slightly taller profile. Most campervan builders choose the pop top for the lower closed profile and all-weather flexibility.',
      },
    ],
  },
  {
    id: 'finance',
    label: '🏦 Finance',
    faqs: [
      {
        q: 'Can I finance my van and conversion?',
        a: 'Yes. Through our finance partner Stratton Finance, we can bundle the van purchase and conversion into a single loan — personal loan or chattel mortgage. Up to 7-year terms with 40+ Australian lenders compared for you.',
      },
      {
        q: 'Do I need a deposit for finance?',
        a: 'The $3,000 hold can serve as your deposit. Beyond that, deposit requirements depend on the lender and your credit profile. Many buyers get approved with no additional deposit.',
      },
      {
        q: 'Personal loan or chattel mortgage — which is better?',
        a: 'Personal loan is best for PAYG employees — fixed repayments, no balloon payment, no asset security required. Chattel mortgage is best for ABN holders — you can claim GST on the purchase, and interest and depreciation are tax-deductible. Our finance team recommends the right fit for your situation.',
      },
      {
        q: 'How quickly can I get approved?',
        a: 'We typically get back to you with tailored options within 24 hours. Formal approval can happen within a few days depending on the lender. No credit check is needed for the initial enquiry.',
      },
    ],
  },
]

// Generate Schema.org FAQPage structured data
const allFaqs = CATEGORIES.flatMap(cat => cat.faqs)
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: allFaqs.map(faq => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
}

export default function FaqsPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section style={{ backgroundColor: '#2C2C2A' }} className="text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">FAQ</p>
          <h1 className="text-4xl md:text-5xl leading-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-300 text-lg max-w-xl leading-relaxed">
            Everything you need to know about importing a Toyota Hiace from Japan,
            campervan conversions, compliance, costs, and finance.
          </p>
        </div>
      </section>

      {/* Category quick links */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 -mx-4 px-4 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="shrink-0 text-sm px-3 py-2 rounded-lg text-gray-600 hover:text-ocean hover:bg-ocean/5 transition-colors whitespace-nowrap"
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      <section className="bg-cream py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-12">
            {CATEGORIES.map(cat => (
              <div key={cat.id} id={cat.id} className="scroll-mt-32">
                <h2 className="text-2xl font-bold text-charcoal mb-6">{cat.label}</h2>
                <FaqAccordion faqs={cat.faqs} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still have questions? */}
      <section className="bg-white py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl text-charcoal mb-4">Still have questions?</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            We&apos;re happy to chat — no pressure, no sales pitch. Just honest answers
            about importing and converting campervans.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/61431770087?text=Hey%20Jared%2C%20I%20have%20a%20question%20about%20importing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-base px-8 py-4"
            >
              Chat on WhatsApp →
            </a>
            <Link href="/how-it-works" className="inline-block text-base px-8 py-4 border border-charcoal text-charcoal rounded-lg hover:bg-charcoal hover:text-white transition-colors">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
