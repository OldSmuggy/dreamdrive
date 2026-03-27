import Link from 'next/link'
import Footer from '@/components/ui/Footer'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'H200 vs H300 Toyota Hiace — Which Should You Import? | Bare Camper',
  description: 'Detailed comparison of the Toyota Hiace H200 and H300 for Australian import and campervan conversion. Dimensions, specs, pros and cons. The H200 packs 9.2% more interior space in a 12% shorter vehicle.',
  url: '/h200-vs-h300-hiace',
})

export default function H200vsH300() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-charcoal text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-ocean text-sm font-semibold uppercase tracking-widest mb-3">Buyer&apos;s Guide</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            H200 vs H300 Hiace —<br className="hidden md:block" /> Which One to Import?
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
            The H200 packs 9.2% more interior space inside a vehicle that is 12% shorter. It&apos;s the only Hiace still made in Japan — and it shares parts with the Hilux and Prado. Here&apos;s how the two compare.
          </p>
        </div>
      </div>

      {/* Verdict banner */}
      <div className="bg-ocean text-white py-5 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-lg">Our recommendation: <span className="text-white">H200 SLWB for most builds</span></p>
          <Link href="/browse" className="bg-white text-ocean font-semibold py-2 px-5 rounded-lg text-sm hover:bg-gray-100 transition-colors whitespace-nowrap">
            Browse H200 Stock
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14">

        {/* Quick verdict */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">The short answer</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            For a campervan conversion in Australia, the <strong className="text-charcoal">H200 is the clear choice</strong> — and it&apos;s the only model we source at Bare Camper. Here&apos;s why:
          </p>
          <ul className="space-y-3">
            {[
              'The H200 is the only Hiace still manufactured in Japan. Every van comes with Japanese build quality — not the Thai-made H300.',
              'It packs 9.2% more usable interior space inside a body that is 12% shorter — making it more manoeuvrable while fitting more inside.',
              'Factory 4x4 is available on the H200. No other modern Hiace offers this.',
              'Parts are shared with the Hilux and Prado — available at every Toyota dealer in Australia. The H300 has a much shorter parts history locally.',
              'The H200 is still in production for the Japanese domestic market, so supply is strong and auction prices are competitive.',
            ].map((point, i) => (
              <li key={i} className="flex gap-3 text-gray-600">
                <span className="text-ocean font-bold mt-0.5">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Side by side specs */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-6">Side by side specs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-gray-50 border border-gray-200 font-semibold text-charcoal"></th>
                  <th className="text-center p-3 bg-ocean/10 border border-gray-200 font-bold text-ocean">H200 Series</th>
                  <th className="text-center p-3 bg-gray-50 border border-gray-200 font-semibold text-gray-500">H300 Series</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Production years', '2004–present', '2019–present'],
                  ['Made in', 'Japan 🇯🇵', 'Thailand 🇹🇭'],
                  ['Available at Bare Camper', '✓ Yes', '✗ No'],
                  ['Factory 4x4 option', '✓ Yes', '✗ No'],
                  ['Petrol engine option', '✓ Yes (2.7L)', '✗ Diesel only'],
                  ['Shares parts with', 'Hilux, Prado', 'Newer platform only'],
                  ['Serviced at Toyota dealers', '✓ Australia-wide', '✓ Australia-wide'],
                  ['Interior space vs H300', '+9.2% more space', 'Baseline'],
                  ['Exterior length (SWB)', '4,695mm', '4,950mm (+255mm)'],
                  ['Pop top / hi-top conversions', 'Full range available', 'Limited options'],
                  ['Typical auction price range', '¥800k–¥3M', '¥2M–¥5M+'],
                  ['Best for', 'Campervan builds', 'Daily driver / newer tech'],
                ].map(([label, h200, h300], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 border border-gray-200 text-gray-500 font-medium">{label}</td>
                    <td className="p-3 border border-gray-200 text-center text-charcoal font-medium bg-ocean/5">{h200}</td>
                    <td className="p-3 border border-gray-200 text-center text-gray-500">{h300}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* H200 variants */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-2">H200 variants — Standard vs Super Long Wide</h2>
          <p className="text-gray-500 text-sm mb-6">Once you&apos;ve chosen the H200, the next decision is wheelbase. Here are the real dimensions from our product catalogue:</p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Standard */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="font-bold text-charcoal">Standard Wheelbase (LWB)</div>
                <div className="text-gray-400 text-xs mt-0.5">Low roof or pop top</div>
              </div>
              <div className="p-5 space-y-2 text-sm">
                {[
                  ['Exterior Length', '4,695mm'],
                  ['Exterior Width', '1,695mm'],
                  ['Exterior Height', '1,980mm (2,240mm high roof)'],
                  ['Interior Length', '3,000mm (behind front seats)'],
                  ['Interior Width', '1,500mm'],
                  ['Interior Height', '1,300mm (1,570mm high roof)'],
                  ['GVM', '3,300kg'],
                  ['Towing Capacity', '1,900kg'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-gray-400">{k}</span>
                    <span className="text-charcoal font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-600">
                  <strong>With pop top:</strong> 180–209cm internal standing height. Good for couples or solo travellers who want a more stealth, lower-profile van.
                </div>
              </div>
            </div>

            {/* SLWB */}
            <div className="border-2 border-ocean rounded-xl overflow-hidden">
              <div className="bg-ocean px-5 py-3">
                <div className="font-bold text-white">Super Long Wide (SLWB)</div>
                <div className="text-white/70 text-xs mt-0.5">Wide high-roof — most popular for builds</div>
              </div>
              <div className="p-5 space-y-2 text-sm">
                {[
                  ['Exterior Length', '5,380mm'],
                  ['Exterior Width', '1,880mm'],
                  ['Exterior Height', '2,285mm (2,400mm with Maxxfan)'],
                  ['Interior Length', '3,395mm (behind front seats)'],
                  ['Interior Width', '1,730mm'],
                  ['Interior Height', '1,600mm'],
                  ['GVM', '3,300kg'],
                  ['Towing Capacity', '1,900kg'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-gray-400">{k}</span>
                    <span className="text-charcoal font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <div className="bg-ocean/10 rounded-lg p-3 text-xs text-gray-600">
                  <strong>Our top pick.</strong> 1,600mm interior height, 1,730mm wide, 3,395mm long load bay. Room for a proper bed, kitchen, and standing space without a roof conversion.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cream rounded-xl p-5 text-sm text-gray-600">
            <strong className="text-charcoal">Which one for a campervan?</strong> The SLWB is the go-to for most builds. At 1,600mm interior height you can sit upright comfortably without a roof conversion — and when you add a pop top or hi-top, the extra width (1,730mm vs 1,500mm) makes a big difference to the feel of the interior. The standard wheelbase works well for solo or couple builds where stealth and ease of parking matter more than space.
          </div>
        </section>

        {/* Why only H200 */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Why we only source the H200</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The H300 is a good van. But for the Bare Camper customer — someone who wants a quality base for a campervan conversion — the H200 is the better choice every time.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            The H300 is built in Thailand. That&apos;s not a deal-breaker, but the H200 is made in Japan — the same factory environment that makes Japanese imports so reliable and consistent. The auction grading system is built around the Japanese domestic market, which means H200 grades are very reliable indicators of condition.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            From a conversion standpoint, the H200 has been the platform of choice for Australian pop top and hi-top manufacturers for 15+ years. DIY RV Solutions, our conversion partner, has a full range of products designed specifically around H200 dimensions. The H300 is newer and conversion kits are limited.
          </p>
          <p className="text-gray-600 leading-relaxed">
            And then there&apos;s the price. A comparable H300 at auction will cost significantly more than an H200, and the extra cost doesn&apos;t translate to extra usable space for a campervan build — in fact the H200 has more of it.
          </p>
        </section>

        {/* Roof options for H200 */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-charcoal mb-4">H200 roof options for campervan conversions</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-charcoal">Low Roof (stock)</div>
                <div className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-1">130cm internal</div>
              </div>
              <p className="text-sm text-gray-500">Standard roof as it comes off the boat. 130cm interior height — you&apos;re on your knees for most things. Best suited to a very basic sleep-and-go build or as a starting point if you plan to add a roof later.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-charcoal">Pop Top Conversion</div>
                <div className="text-xs text-ocean bg-ocean/10 rounded px-2 py-1">180–209cm when open</div>
              </div>
              <p className="text-sm text-gray-500">Fibreglass roof section that lifts up to give full standing height inside. Closed, the van looks completely standard and fits in most car parks and ferries. Ideal for couples or solo travellers who want stealth and versatility. Starting from $13,090 inc GST.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-charcoal">Hi-Top Conversion</div>
                <div className="text-xs text-ocean bg-ocean/10 rounded px-2 py-1">~200cm standing height</div>
              </div>
              <p className="text-sm text-gray-500">Permanent high roof fibreglass conversion. Full standing height at all times, more insulation options, better airflow. Ideal if you plan to spend extended time in the van. The SLWB wide high-roof is 2,285mm exterior height. Starting from $15,090 inc GST.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-charcoal rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to find your H200?</h2>
          <p className="text-gray-300 mb-6 text-sm max-w-md mx-auto">We source H200 LWB and SLWB vans directly from Japanese auction every week. Tell us your spec and we&apos;ll find your van.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/browse" className="btn-primary">Browse Current Stock</Link>
            <Link href="/import-costs" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm">
              See Import Costs
            </Link>
          </div>
          <p className="text-gray-500 text-xs mt-5">Call Jared: 0432 182 892 · hello@barecamper.com.au</p>
        </section>

      </div>
      <Footer />
    </div>
  )
}
