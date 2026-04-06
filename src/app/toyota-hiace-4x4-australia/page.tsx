import Link from 'next/link'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Toyota Hiace 4x4 Australia — Import a Factory 4WD Hiace from Japan | Bare Camper',
  description: 'The factory 4x4 Hiace is only available on the H200 — made in Japan, not sold new in Australia. Import one direct from Japanese auction. Perfect base for a go-anywhere campervan.',
  url: '/toyota-hiace-4x4-australia',
})

const faqs = [
  {
    q: 'Is a factory 4x4 Hiace available in Australia new?',
    a: 'No. Toyota Australia does not sell a factory 4x4 Hiace. The only way to get a genuine factory 4WD Hiace in Australia is to import one from Japan, where Toyota produced 4x4 variants of the H200 series for the domestic market. The newer H300 Hiace (sold new in Australia) does not have a factory 4x4 option at all.',
  },
  {
    q: 'Which Hiace models came with factory 4x4?',
    a: 'The factory 4x4 was only offered on the H200 series (2004–present). Key variants include the TRH214W (2.7L petrol, 4x4), TRH219W (2.7L petrol, 4x4, commuter), KDH206V (3.0L diesel, 4x4) and KDH216V (3.0L diesel, 4x4, LWB). The 4x4 system is a part-time 4WD with low range — properly engineered for off-road use, not a marketing spec.',
  },
  {
    q: 'Is the Hiace 4x4 good off-road?',
    a: 'Yes — more capable than most people expect from a van. The H200 4x4 has a factory locking front differential and low range transfer case. It handles gravel roads, station tracks, river crossings and most fire trails easily. It\'s not a rock crawler, but for Australian outback travel, remote campgrounds, or farm access, it\'s genuinely capable. The longer wheelbase and high ground clearance help too.',
  },
  {
    q: 'What\'s the fuel economy of a Hiace 4x4?',
    a: 'The diesel KDH 4x4 (3.0L 1KD-FTV) returns around 9–11L/100km on the highway — reasonable for a van this size. The petrol TRH 4x4 (2.7L 2TR-FE) is thirstier at around 12–14L/100km. For long-distance touring, the diesel is the preferred choice, but the petrol is more widely serviced in remote areas and shares its engine with the Hilux and Prado.',
  },
  {
    q: 'How much does a factory 4x4 Hiace cost to import?',
    a: 'Expect to pay a premium over a 2WD equivalent. A good condition 4x4 H200 at Japanese auction typically runs ¥1,500,000–¥3,500,000 depending on year, mileage, and spec. Total landed and complied in Australia is typically $30,000–$45,000 AUD. Compare that to having a 2WD van converted to AWD (which costs $15,000–$25,000 and isn\'t a true 4x4), and the import makes a lot of sense.',
  },
  {
    q: 'Can I get a 4x4 Hiace with a campervan conversion?',
    a: 'Yes — and this is the whole point. The H200 4x4 is a brilliant base for a go-anywhere campervan. Same footprint and interior dimensions as the 2WD, so all the same conversion options apply: pop top, hi-top, full fit-out. You end up with a vehicle that can access remote beach camps, high country stations, and fire trail campsites that a 2WD van simply can\'t reach.',
  },
  {
    q: 'What is the towing capacity of a Hiace 4x4?',
    a: '1,900kg braked — same as the 2WD H200. Enough for a small boat, an off-road camper trailer, or a bike trailer. Note that the GVM is 3,300kg, so factor in payload (van + passengers + gear + water) when working out what you can tow.',
  },
  {
    q: 'Does the 4x4 Hiace have the same interior dimensions as the 2WD?',
    a: 'Yes. The 4x4 drivetrain sits under the vehicle without affecting the load bay dimensions. You get the same 3,000mm interior length (LWB), 1,500mm width, and the same roof height options as the 2WD. A 4x4 LWB with a pop top conversion is mechanically identical to a 2WD from the conversion standpoint.',
  },
]

export default function Hiace4x4() {
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
          <p className="text-ocean text-sm font-semibold uppercase tracking-widest mb-3">Import Guide</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Toyota Hiace 4x4 —<br className="hidden md:block" /> The Van Toyota Won&apos;t Sell You Here
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
            Toyota Australia doesn&apos;t sell a factory 4x4 Hiace. Never has. The only way to get one is to import it from Japan — where Toyota built 4WD H200 variants specifically for the Japanese market. And it makes a brilliant base for a go-anywhere campervan.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/browse" className="btn-primary">Browse Stock</Link>
            <Link href="/import-costs" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm">
              Import Cost Calculator
            </Link>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="bg-ocean text-white py-5 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">H200 only</div>
            <div className="text-sm text-white/80">Factory 4x4 available</div>
          </div>
          <div>
            <div className="text-2xl font-bold">Low range</div>
            <div className="text-sm text-white/80">Proper 4WD, not marketing</div>
          </div>
          <div>
            <div className="text-2xl font-bold">1,900kg</div>
            <div className="text-sm text-white/80">Towing capacity</div>
          </div>
          <div>
            <div className="text-2xl font-bold">Japan-made</div>
            <div className="text-sm text-white/80">H200 only, not H300</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14">

        {/* Why 4x4 */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Why a 4x4 Hiace?</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Australia has a lot of places a 2WD van simply can&apos;t go. Remote beach camping, high country station tracks, fire trail campsites, national park access roads — if you want to explore properly, 4WD opens up a different category of travel entirely.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Most people solving this problem look at a Land Cruiser wagon or a Defender and try to live out of it. The factory 4x4 Hiace gives you the same go-anywhere capability with a proper van interior — a full-size bed, kitchen, storage, and standing room. You&apos;re not sleeping in the back of a wagon; you&apos;re living in a van that happens to have 4WD.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            The alternative is buying a 2WD Hiace and converting it to AWD — kits exist, but they&apos;re $15,000–$25,000 on top of the van price, they&apos;re not a true low-range 4x4, and they void your drivetrain warranty. The factory Japanese 4x4 has been engineered from the ground up for off-road use and costs significantly less all-in.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {[
              { icon: '🏔️', title: 'High country access', desc: 'Alpine station tracks, fire trails, 4WD-only campgrounds' },
              { icon: '🏖️', title: 'Beach driving', desc: 'Soft sand, beach camping, remote coastal access' },
              { icon: '🌿', title: 'Outback touring', desc: 'Station roads, river crossings, remote properties' },
            ].map(item => (
              <div key={item.title} className="bg-cream rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-semibold text-charcoal text-sm mb-1">{item.title}</div>
                <div className="text-gray-400 text-xs">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 4x4 models */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Which 4x4 Hiace models are available?</h2>
          <p className="text-gray-600 leading-relaxed mb-5">
            The factory 4x4 was only produced for the H200 series. Key variants we source from Japanese auction:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-charcoal border border-gray-200">Model Code</th>
                  <th className="text-left p-3 font-semibold text-charcoal border border-gray-200">Engine</th>
                  <th className="text-left p-3 font-semibold text-charcoal border border-gray-200">Wheelbase</th>
                  <th className="text-left p-3 font-semibold text-charcoal border border-gray-200">Drive</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['TRH214W', '2.7L Petrol (2TR-FE)', 'Standard LWB', 'Part-time 4WD + low range'],
                  ['TRH219W', '2.7L Petrol (2TR-FE)', 'Commuter LWB', 'Part-time 4WD + low range'],
                  ['KDH206V', '3.0L Diesel (1KD-FTV)', 'Standard LWB', 'Part-time 4WD + low range'],
                  ['KDH216V', '3.0L Diesel (1KD-FTV)', 'LWB', 'Part-time 4WD + low range'],
                ].map(([code, engine, wb, drive], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 border border-gray-200 font-mono text-ocean font-semibold">{code}</td>
                    <td className="p-3 border border-gray-200 text-gray-600">{engine}</td>
                    <td className="p-3 border border-gray-200 text-gray-600">{wb}</td>
                    <td className="p-3 border border-gray-200 text-gray-600">{drive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-400 text-xs mt-3">
            The petrol TRH engine shares components with the Hilux (2TR-FE) and is widely serviced across Australia including remote areas. The diesel KDH (1KD-FTV) offers better fuel economy for highway touring.
          </p>
        </section>

        {/* 4x4 vs 2WD */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Factory 4x4 vs aftermarket AWD conversion</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-gray-50 border border-gray-200 font-semibold text-charcoal"></th>
                  <th className="text-center p-3 bg-ocean/10 border border-gray-200 font-bold text-ocean">Factory 4x4 H200 import</th>
                  <th className="text-center p-3 bg-gray-50 border border-gray-200 font-semibold text-gray-500">2WD + aftermarket conversion</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Low range 4WD', '✓ Yes', '✗ Usually AWD only, no low range'],
                  ['Factory locking diff', '✓ Yes', '✗ No'],
                  ['Drivetrain warranty', '✓ Engineered from factory', '⚠️ Voided on converted parts'],
                  ['Additional cost', '✓ Nil — included in van', '✗ $15,000–$25,000 extra'],
                  ['Reliability', '✓ 20+ years proven', '⚠️ Depends on conversion quality'],
                  ['Resale value', '✓ Higher — genuine 4x4', '⚠️ Lower — converted'],
                  ['Ground clearance', '✓ Factory rated', '⚠️ Varies'],
                  ['Parts availability', '✓ Toyota Hilux / Prado shared', '⚠️ Conversion-specific parts'],
                ].map(([label, factory, aftermarket], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 border border-gray-200 text-gray-500 font-medium">{label}</td>
                    <td className="p-3 border border-gray-200 text-center text-charcoal font-medium bg-ocean/5">{factory}</td>
                    <td className="p-3 border border-gray-200 text-center text-gray-500">{aftermarket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cost */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">What does it cost to import a 4x4 Hiace?</h2>
          <p className="text-gray-600 leading-relaxed mb-5">
            The 4x4 commands a premium at Japanese auction — expect to pay ¥500,000–¥1,000,000 more than an equivalent 2WD. Here&apos;s a realistic example:
          </p>
          <div className="bg-cream rounded-xl p-5 border border-gray-100">
            <p className="text-sm font-semibold text-charcoal mb-3">Example: KDH206V diesel 4x4, grade 4, 120,000km (¥2,500,000)</p>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between"><span>Vehicle at auction</span><span>~$23,800</span></div>
              <div className="flex justify-between"><span>Bare Camper fee ($2,500 + GST)</span><span>$2,750</span></div>
              <div className="flex justify-between"><span>Ocean freight (Yokohama → Brisbane)</span><span>$2,500</span></div>
              <div className="flex justify-between"><span>GST (10% on landed value)</span><span>~$2,630</span></div>
              <div className="flex justify-between"><span>Customs + quarantine</span><span>$360</span></div>
              <div className="flex justify-between"><span>Compliance</span><span>$1,800</span></div>
              <div className="flex justify-between font-bold text-charcoal pt-2 border-t border-gray-200 mt-2">
                <span>Total landed &amp; complied</span><span>~$34,090</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Add a pop top from $13,090 or hi-top from $15,090 and you have a capable 4WD campervan from ~$47,000 — significantly less than buying an equivalent setup any other way.
            </p>
          </div>
        </section>

        {/* As a campervan */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">The 4x4 Hiace as a campervan base</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The interior dimensions are identical to the 2WD H200 — the 4x4 drivetrain sits completely underneath and doesn&apos;t affect the load bay at all. That means every conversion option available for the 2WD works the same way on the 4x4.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Pop top + 4x4',
                desc: 'The most popular combo. Stealth height when driving, full standing room at camp. Access beach and bush camps most vans can\'t reach. From ~$47,000 landed, complied, and converted.',
              },
              {
                title: 'Hi-top + 4x4',
                desc: 'Permanent standing height, better insulation, more airflow. Ideal for extended remote touring where you\'re spending weeks at a time off-grid.',
              },
              {
                title: 'Full turnkey + 4x4',
                desc: 'Van + conversion + complete fit-out. Bed, kitchen, solar, water. Ready to drive away and camp anywhere in Australia.',
              },
              {
                title: 'Bare van 4x4',
                desc: 'Take the van and do your own fit-out. The DIY community has a full range of kits designed for the H200 platform — or build from scratch.',
              },
            ].map(item => (
              <div key={item.title} className="border border-gray-200 rounded-xl p-5">
                <div className="font-semibold text-charcoal mb-2">{item.title}</div>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
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

        {/* Related links */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-charcoal mb-4">More guides</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'H200 vs H300 comparison', href: '/h200-vs-h300-hiace' },
              { label: 'Full import guide', href: '/import-hiace-australia' },
              { label: 'Import cost calculator', href: '/import-costs' },
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
          <h2 className="text-2xl font-bold mb-2">Looking for a 4x4 Hiace?</h2>
          <p className="text-gray-300 mb-6 text-sm max-w-md mx-auto">
            Tell us your spec — diesel or petrol, year range, budget — and we&apos;ll watch the Japanese auctions for matching 4x4 vans and send you options.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/browse" className="btn-primary">Browse Current Stock</Link>
            <Link href="tel:0432182892" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm">
              Call 0432 182 892
            </Link>
          </div>
          <p className="text-gray-500 text-xs mt-5">hello@barecamper.com.au</p>
        </section>

      </div>
    </div>
  )
}
