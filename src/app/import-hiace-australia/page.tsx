import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'How to Import a Toyota Hiace from Japan to Australia | Complete Guide 2026',
  description: 'Everything Australians need to know about importing a Toyota Hiace from Japan. Costs, compliance, auction grades, H200 vs H300, timelines and how to avoid getting ripped off.',
  url: '/import-hiace-australia',
})

const faqs = [
  {
    q: 'Can I import a Toyota Hiace from Japan to Australia?',
    a: 'Yes. Toyota Hiace vans are one of the most commonly imported vehicles from Japan to Australia. They qualify for import under the Registered Automotive Workshop Scheme (RAWS) and benefit from 0% import duty under the Japan-Australia Economic Partnership Agreement (JAEPA). You will pay 10% GST on the landed value, plus compliance costs of around $1,800 through a RAWS-approved workshop.',
  },
  {
    q: 'How long does it take to import a Hiace from Japan?',
    a: 'From auction win to driving it in Australia, allow 10–14 weeks. Roughly: 2–3 weeks for Japan-side logistics and export paperwork, 3–4 weeks ocean freight (Yokohama to Brisbane), 1–2 weeks customs and quarantine clearance, then 2–3 weeks at the compliance workshop for inspection, safety certificate, and compliance plate.',
  },
  {
    q: 'What does it cost to import a Hiace from Japan?',
    a: 'For a typical H200 LWB Hiace at ¥2,000,000 (~$19,000 AUD), expect to pay: vehicle purchase price ~$19,000, Bare Camper sourcing fee $3,000, ocean freight $2,500, GST (10% on landed value) ~$2,155, customs entry + quarantine ~$360, compliance ~$1,800. Total landed and complied: approximately $28,800–$30,000 AUD depending on exchange rate. Compare that to the same quality van from an Australian dealer at $33,000–$38,000.',
  },
  {
    q: 'H200 vs H300 Hiace — which should I import?',
    a: 'The H200 (2004–2019) is the most popular choice for campervan conversions. It has a proven 2.7L petrol or 3.0L diesel engine, excellent parts availability in Australia, and is in the sweet spot for price vs condition. The H300 (2019–present) is a newer platform with a better driving position and more modern features, but prices are higher and there are fewer available. For a campervan build, the H200 LWB or SLWB is the go-to — it\'s what most pop top and hi-top conversions are built around.',
  },
  {
    q: 'What are Japanese auction grades?',
    a: 'Japanese auction houses independently grade every vehicle before it goes to auction. The main scale runs from 1 (poor) to 5 (near-perfect), with half grades (3.5, 4.5) in between. A grade 4 or 4.5 means minor surface marks, no accident history, good mechanicals. Grade 3.5 typically means light wear consistent with age. Interior is graded A (excellent) to D (poor). We target grade 3.5 and above for import — you see the grade, photos, and inspection report before we bid.',
  },
  {
    q: 'What is the difference between LWB and SLWB Hiace?',
    a: 'LWB (Long Wheelbase) is the standard cargo van — roughly 4.7m long with a 3m load bay. SLWB (Super Long Wheelbase) adds about 300mm to the wheelbase and load bay, giving you more interior space for a campervan build. If you plan to stand up, sleep two adults comfortably, or fit a proper kitchen, the SLWB is worth the small premium. Most of our pop top and hi-top conversions are built on the SLWB.',
  },
  {
    q: 'Do I pay GST on a Japanese import Hiace?',
    a: 'Yes. GST is 10% of the landed value (vehicle purchase price + shipping). There is no import duty on Japanese vehicles under the JAEPA free trade agreement — that 0% duty is a significant saving. You\'ll also pay a customs entry fee (~$110) and BMSB (Brown Marmorated Stink Bug) heat treatment (~$250) which is mandatory for vehicles from Japan.',
  },
  {
    q: 'Do I need a compliance plate to register a Japanese import?',
    a: 'Yes. All Japanese imports need a compliance plate from a RAWS-approved workshop before they can be registered in Australia. The compliance process includes a roadworthy inspection, emissions check, safety certificate, and fitment of a compliance plate. We have recommended RAWS workshops in QLD, NSW, VIC, and WA — compliance typically costs around $1,800 and takes 2–3 weeks.',
  },
  {
    q: 'Can I import a right-hand drive Hiace?',
    a: 'Yes — this is one of the main advantages of importing from Japan. Japan is right-hand drive, so all Japanese-market Hiace vans are RHD and fully road-legal in Australia without any conversion. Australian-delivered Hiace vans are also RHD, so a Japanese import drives identically.',
  },
  {
    q: 'What\'s the difference between buying from a dealer and importing direct?',
    a: 'When you buy a Japanese import Hiace from an Australian dealer, you\'re paying the dealer\'s margin on top of the importer\'s margin on top of the auction price. That can add $5,000–$10,000 to the cost of the same quality van. Importing direct through Bare Camper means you pay the actual auction price plus our flat $3,000 fee. You see the auction grade, the photos, the inspection report — and you decide whether to bid.',
  },
  {
    q: 'Can I get a roof conversion done at the same time as the import?',
    a: 'Yes — this is exactly what we do. Once your van clears compliance, it goes straight to our Brisbane factory for the pop top or hi-top conversion. You end up with a complied, registered van with a professional fibreglass roof — ready for your interior fit-out. The whole process is coordinated through one team, which saves time and avoids the usual back-and-forth between an importer, a compliance workshop, and a converter.',
  },
  {
    q: 'What states can I register a Japanese import Hiace in?',
    a: 'All Australian states and territories. RAWS compliance is recognised nationally, so a van complied in Queensland can be registered in Victoria, WA, or anywhere else. We have recommended compliance workshops in QLD, NSW, VIC, and WA, so we can direct the van to the workshop closest to you.',
  },
]

export default function ImportHiaceGuide() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-charcoal text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-ocean text-sm font-semibold uppercase tracking-widest mb-3">Complete Guide — 2026</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            How to Import a Toyota Hiace<br className="hidden md:block" /> from Japan to Australia
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
            Everything you need to know — costs, compliance, auction grades, H200 vs H300, timelines, and how to avoid paying a dealer premium on the same van you could import direct.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/browse" className="btn-primary">Browse Available Vans</Link>
            <Link href="/import-costs" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-5 rounded-lg transition-colors">
              Cost Calculator
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="bg-ocean text-white py-5 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">0%</div>
            <div className="text-sm text-white/80">Import duty (JAEPA)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">10–14 wks</div>
            <div className="text-sm text-white/80">Auction to driveway</div>
          </div>
          <div>
            <div className="text-2xl font-bold">$3,000</div>
            <div className="text-sm text-white/80">Flat sourcing fee</div>
          </div>
          <div>
            <div className="text-2xl font-bold">$5–10k</div>
            <div className="text-sm text-white/80">Saving vs dealer</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14">

        {/* Why import direct */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Why import direct from Japan?</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Australia has been importing Toyota Hiace vans from Japan for decades. Japan produces far more Hiace vans than its domestic market needs, so low-mileage, well-maintained vans flow out to markets like Australia, New Zealand, and the UK.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            The problem is that most Australians buy these vans from local dealers — paying two margins on top of the auction price. The dealer bought it from an importer, who bought it at a Japanese auction. Every hand it passes through adds cost.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Importing direct means you pay the actual auction price plus transparent fixed fees. For a $19,000 AUD auction van, the total landed and complied cost is typically $28,000–$30,000. The same van from an Australian dealer: $33,000–$38,000.
          </p>
          <div className="bg-cream rounded-xl p-5 border border-gray-100">
            <p className="text-sm font-semibold text-charcoal mb-2">The numbers on a typical H200 LWB Hiace (¥2,000,000 auction)</p>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between"><span>Vehicle (at auction)</span><span>~$19,000</span></div>
              <div className="flex justify-between"><span>Bare Camper sourcing fee</span><span>$3,000</span></div>
              <div className="flex justify-between"><span>Ocean freight (Yokohama → Brisbane)</span><span>$2,500</span></div>
              <div className="flex justify-between"><span>GST (10% on landed value)</span><span>~$2,155</span></div>
              <div className="flex justify-between"><span>Customs + quarantine</span><span>$360</span></div>
              <div className="flex justify-between"><span>Compliance</span><span>$1,800</span></div>
              <div className="flex justify-between font-bold text-charcoal pt-2 border-t border-gray-200 mt-2">
                <span>Total landed &amp; complied</span><span>~$28,800</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">vs $33,000–$38,000 from an Australian dealer for equivalent quality</p>
          </div>
        </section>

        {/* H200 vs H300 */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">H200 vs H300 — which Hiace to import?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="text-ocean font-bold text-lg mb-1">H200 Series</div>
              <div className="text-gray-400 text-sm mb-3">2004–2019 · Most popular for conversions</div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-green-500">✓</span>Proven 2.7L petrol or 3.0L diesel</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Excellent parts availability in Australia</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Best price-to-condition ratio</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Most pop top &amp; hi-top kits designed for H200</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Wide choice of grades and mileage</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="text-ocean font-bold text-lg mb-1">H300 Series</div>
              <div className="text-gray-400 text-sm mb-3">2019–present · Newer platform</div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-green-500">✓</span>Modern driving position and comfort</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>Better safety features</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span>More fuel efficient</li>
                <li className="flex gap-2"><span className="text-yellow-500">~</span>Higher auction prices</li>
                <li className="flex gap-2"><span className="text-yellow-500">~</span>Fewer conversion kits available yet</li>
              </ul>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            For a campervan build, the <strong className="text-charcoal">H200 LWB or SLWB</strong> is the go-to. It&apos;s what our pop top and hi-top conversions are designed around and where you get the best value for a complete build.{' '}
            <Link href="/h200-vs-h300-hiace" className="text-ocean underline">See our full H200 vs H300 comparison →</Link>
          </p>
        </section>

        {/* The process */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-6">The import process — step by step</h2>
          <div className="space-y-4">
            {[
              { n: '1', title: 'Pay deposit & brief us', desc: 'A $3,000 deposit starts the process. Tell us your spec — model, year range, mileage target, budget. This gets applied to your sourcing fee.' },
              { n: '2', title: 'We find your van at auction', desc: 'We monitor Japanese auctions weekly and send you matching vans with full auction reports — grade, mileage, photos, inspection notes. You decide which ones to bid on.' },
              { n: '3', title: 'We win it', desc: 'Once you approve a van, we bid at the next auction. If we win, the van moves to our Japan logistics partner for export preparation.' },
              { n: '4', title: 'Japan-side logistics', desc: 'Export documentation, pre-clean, BMSB quarantine preparation. The van is loaded at Yokohama port. Takes roughly 2–3 weeks.' },
              { n: '5', title: 'Ocean freight', desc: 'Approximately 3–4 weeks from Yokohama to Brisbane. We keep you updated on vessel tracking.' },
              { n: '6', title: 'Customs & quarantine', desc: '0% import duty (JAEPA). 10% GST paid at customs. BMSB heat treatment completed. Typically 1–2 weeks.' },
              { n: '7', title: 'Compliance', desc: 'Van goes to a RAWS-approved workshop. Roadworthy, emissions check, safety cert, compliance plate fitted. 2–3 weeks, ~$1,800.' },
              { n: '8', title: 'Choose your build', desc: 'Bare van delivered to you — or it goes straight to our Brisbane factory for a pop top, hi-top, or full turnkey conversion.' },
            ].map(step => (
              <div key={step.n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-ocean text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</div>
                <div>
                  <div className="font-semibold text-charcoal">{step.title}</div>
                  <div className="text-gray-500 text-sm leading-relaxed">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Auction grades */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Japanese auction grades explained</h2>
          <p className="text-gray-600 leading-relaxed mb-5">
            Every vehicle at a Japanese auction is independently inspected and graded before it goes to the auction floor. This is one of the main reasons Japanese imports are trusted — the grades are consistent and honest.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-charcoal border border-gray-200">Grade</th>
                  <th className="text-left p-3 font-semibold text-charcoal border border-gray-200">Condition</th>
                  <th className="text-left p-3 font-semibold text-charcoal border border-gray-200">What to expect</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { g: '5', cond: 'Excellent', desc: 'Near new. No marks, no repairs. Rare for used vans.' },
                  { g: '4.5', cond: 'Very good', desc: 'Minor surface marks only. No accident history. Our preferred target.' },
                  { g: '4', cond: 'Good', desc: 'Small scratches or light dents. No structural damage. Excellent value.' },
                  { g: '3.5', cond: 'Above average', desc: 'Light wear consistent with age. May have minor paint repairs noted.' },
                  { g: '3', cond: 'Average', desc: 'Visible wear, possible minor repairs. Still driveable, lower price.' },
                  { g: 'R', cond: 'Repaired', desc: 'Has had accident repairs. Can still be good value if repairs are quality.' },
                ].map(row => (
                  <tr key={row.g} className="border-b border-gray-100">
                    <td className="p-3 border border-gray-200 font-bold text-ocean">{row.g}</td>
                    <td className="p-3 border border-gray-200 text-charcoal">{row.cond}</td>
                    <td className="p-3 border border-gray-200 text-gray-500">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-400 text-xs mt-3">Interior is graded A (excellent) to D (poor) alongside the exterior grade. We share the full auction sheet with you before bidding.</p>
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

        {/* CTA */}
        <section className="bg-charcoal rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to get started?</h2>
          <p className="text-gray-300 mb-6 text-sm">Browse current auction stock, or book a free chat with Jared to talk through your spec.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/browse" className="btn-primary">Browse Vans</Link>
            <Link href="tel:0432182892" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm">
              Call 0432 182 892
            </Link>
          </div>
          <p className="text-gray-500 text-xs mt-4">hello@barecamper.com.au</p>
        </section>

      </div>

      <Footer />
    </div>
  )
}
