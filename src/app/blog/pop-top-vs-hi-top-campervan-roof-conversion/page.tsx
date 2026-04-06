import Link from 'next/link'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Pop Top vs Hi-Top Roof Conversion — Which Is Right for Your Hiace?',
  description: 'Comparing pop top and hi-top roof conversions for Toyota Hiace campervans. Costs, pros, cons, height, weight, stealth factor, and which suits your build style.',
  url: '/blog/pop-top-vs-hi-top-campervan-roof-conversion',
})

export default function PopTopVsHiTopPost() {
  return (
    <div className="min-h-screen bg-cream">
      <article className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-ocean bg-ocean/10 px-2.5 py-1 rounded-full">Buyer Guide</span>
            <span className="text-xs text-gray-400">28 March 2026</span>
            <span className="text-xs text-gray-400">7 min read</span>
          </div>
          <h1 className="text-3xl md:text-4xl text-charcoal leading-snug mb-4">
            Pop Top vs Hi-Top Roof Conversion — Which Is Right for Your Hiace Campervan?
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            If you&apos;re converting a Toyota Hiace into a campervan, the roof is the single
            biggest decision you&apos;ll make. Here&apos;s an honest comparison of the two options
            from someone who builds both every week.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 mb-8">
            <h2 className="text-xl font-bold text-charcoal mb-4 mt-0">Quick summary</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-charcoal mt-0 mb-2">Pop Top — $13,090</h3>
                <ul className="text-sm text-gray-600 space-y-1.5 list-none pl-0">
                  <li>✅ Low profile when closed — looks like a normal van</li>
                  <li>✅ Less wind resistance = better fuel economy</li>
                  <li>✅ Stealth camping friendly</li>
                  <li>✅ Opens for full standing room</li>
                  <li>⚠️ Must pop it up before you can stand</li>
                  <li>⚠️ Can&apos;t drive with it up</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-charcoal mt-0 mb-2">Hi-Top — $15,090</h3>
                <ul className="text-sm text-gray-600 space-y-1.5 list-none pl-0">
                  <li>✅ Permanent standing room — no setup needed</li>
                  <li>✅ More interior volume for storage</li>
                  <li>✅ Can mount roof racks / solar on top</li>
                  <li>✅ Better insulation (solid fibreglass)</li>
                  <li>⚠️ Taller profile — watch for car parks and drive-throughs</li>
                  <li>⚠️ More visible — less stealthy</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-charcoal">What is a pop top?</h2>
          <p className="text-gray-600 leading-relaxed">
            A pop top (also called an elevating roof) replaces the factory roof panel with a
            fibreglass lid that hinges up on gas struts. When closed, the van looks almost
            stock — maybe 30–50mm taller than factory. When popped, you get full standing
            room inside the van (roughly 1.9m internal height on most Hiace builds).
          </p>
          <p className="text-gray-600 leading-relaxed">
            The sides are typically canvas with zip-out windows and mesh insect screens.
            This means you get great ventilation when you&apos;re set up, but the canvas
            sections aren&apos;t as well insulated as solid fibreglass. In practice, most
            Australian campervan owners say this isn&apos;t a dealbreaker — we camp in
            a warm country.
          </p>

          <h2 className="text-2xl font-bold text-charcoal">What is a hi-top?</h2>
          <p className="text-gray-600 leading-relaxed">
            A hi-top is a permanent fibreglass roof extension that&apos;s bonded to the van body.
            It raises the entire roofline by approximately 300mm, giving you permanent standing
            room without any setup. The roof is solid fibreglass all the way around — no canvas,
            no moving parts.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Hi-tops are structurally simple and virtually maintenance-free. The trade-off is that
            your van is permanently taller — which means more wind resistance (slightly higher
            fuel consumption) and you need to be aware of height clearances at car parks,
            drive-throughs, and underground parking.
          </p>

          <h2 className="text-2xl font-bold text-charcoal">The key differences</h2>

          <div className="overflow-x-auto -mx-4 px-4 my-6">
            <table className="w-full text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3 text-gray-500 font-semibold">Feature</th>
                  <th className="text-left py-3 px-3 text-ocean font-semibold">Pop Top</th>
                  <th className="text-left py-3 px-3 text-driftwood font-semibold">Hi-Top</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {[
                  ['Price (installed)', '$13,090', '$15,090'],
                  ['Turnaround time', '10 business days', '10 business days'],
                  ['Standing room', 'When popped up', 'Always'],
                  ['Closed height (SLWB)', '~2,010mm', '~2,300mm'],
                  ['Open/operating height', '~2,500mm', '~2,300mm'],
                  ['Interior head clearance', '~1,900mm', '~1,850mm'],
                  ['Stealth factor', '★★★★★', '★★☆☆☆'],
                  ['Wind resistance', 'Low (when closed)', 'Moderate'],
                  ['Fuel economy impact', 'Negligible', 'Slight increase'],
                  ['Insulation', 'Good (canvas sides)', 'Excellent (full fibreglass)'],
                  ['Ventilation', 'Excellent (canvas + windows)', 'Good (windows only)'],
                  ['Roof rack compatible', '❌ No', '✅ Yes'],
                  ['Solar panel mounting', 'Inside lid (limited)', 'On top (plenty of space)'],
                  ['Maintenance', 'Canvas + zips (occasional)', 'None (solid fibreglass)'],
                  ['Moving parts', 'Gas struts, hinges', 'None'],
                  ['Fits in standard car park', '✅ Yes (when closed)', '⚠️ Usually — check height'],
                ].map(([feature, pop, hi], i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2.5 px-3 font-medium text-charcoal">{feature}</td>
                    <td className="py-2.5 px-3">{pop}</td>
                    <td className="py-2.5 px-3">{hi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold text-charcoal">When to choose a pop top</h2>
          <p className="text-gray-600 leading-relaxed">
            <strong>Choose a pop top if you value stealth.</strong> When closed, your van looks
            like a regular Hiace. You can park in shopping centre car parks, drive through
            height-restricted areas, and camp in suburban streets without drawing attention.
            This is the number one reason most Australian vanlifers choose a pop top.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Pop tops also win on aerodynamics. The near-factory roofline when closed means less
            wind noise on highways and marginally better fuel economy — not a huge difference,
            but it adds up over a long trip.
          </p>
          <p className="text-gray-600 leading-relaxed">
            The daily routine is simple: arrive at camp, pop the roof (takes about 5 seconds with
            gas strut assist), and you&apos;re set. In the morning, push it down, latch it, drive away.
          </p>

          <h2 className="text-2xl font-bold text-charcoal">When to choose a hi-top</h2>
          <p className="text-gray-600 leading-relaxed">
            <strong>Choose a hi-top if you want to walk in and stand up without any setup.</strong> There&apos;s
            something to be said for pulling over, sliding the door open, and being at full height
            immediately. No popping, no latching, no canvas to worry about in the rain.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Hi-tops are also better for permanent solar installations. You can mount panels flat
            on the roof with plenty of space, and run roof racks for kayaks, surfboards, or extra
            storage. With a pop top, the hinged lid limits what you can mount up top.
          </p>
          <p className="text-gray-600 leading-relaxed">
            If you&apos;re planning a full-time live-in build or a mobile workshop, the hi-top&apos;s
            extra fixed volume and solid insulation make it the better choice.
          </p>

          <h2 className="text-2xl font-bold text-charcoal">What most people choose</h2>
          <p className="text-gray-600 leading-relaxed">
            About 70% of our customers choose the pop top. The stealth factor is the main driver —
            most Australians want to be able to park anywhere and not look like they&apos;re in a
            campervan. The $2,000 price saving doesn&apos;t hurt either.
          </p>
          <p className="text-gray-600 leading-relaxed">
            That said, the hi-top buyers are usually very sure about their choice. They tend to be
            people planning longer trips, full-time living, or builds that need maximum interior
            volume (like mobile workshops or photography studios).
          </p>

          <h2 className="text-2xl font-bold text-charcoal">Both options at Bare Camper</h2>
          <p className="text-gray-600 leading-relaxed">
            Our conversion partner DIY RV Solutions builds both pop tops and hi-tops in their
            Brisbane factory. Both are custom-moulded fibreglass, both fit H200 and H300 series
            Hiace, and both have a 10 business day turnaround. The conversion includes the roof,
            interior headliner, LED lighting, and a 12-month warranty.
          </p>
          <p className="text-gray-600 leading-relaxed">
            If you&apos;re importing a van through us, the roof conversion happens right after
            compliance — so by the time you pick up your van, everything&apos;s done.
          </p>

          {/* CTA */}
          <div className="bg-charcoal rounded-2xl p-6 md:p-8 text-white mt-10 not-prose">
            <h3 className="text-xl font-bold mb-2">Ready to choose your roof?</h3>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              Browse our current van stock, or check out the full roof conversion specs and pricing.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/pop-top" className="btn-primary text-sm px-6 py-3">
                See roof options →
              </Link>
              <Link href="/browse" className="text-sm px-6 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors">
                Browse vans
              </Link>
            </div>
          </div>
        </div>

        {/* Back to blog */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link href="/blog" className="text-ocean text-sm font-semibold hover:underline">
            ← Back to all guides
          </Link>
        </div>
      </article>
    </div>
  )
}
