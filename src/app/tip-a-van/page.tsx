import { generateMeta } from '@/lib/seo'
import VanTipForm from './VanTipForm'

export const metadata = generateMeta({
  title: 'Tip a Van — Earn $200 Finders Fee | Bare Camper',
  description: 'Spotted a great Hiace online? Send us the link. If it sells through Bare Camper, we\'ll pay you a $200 finders fee. No limit on tips.',
  url: '/tip-a-van',
})

export default function TipAVanPage() {
  return (
    <div className="min-h-screen">
      {/* ─── Hero ──────────────────────────────────────── */}
      <section className="bg-charcoal text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Finders Fee Programme</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Spot a van. Earn $200.</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto leading-relaxed">
            Spotted a Hiace online? Send us the link. If we list it and a customer purchases it through Bare Camper, we&apos;ll pay you a <strong className="text-sand">$200 AUD finders fee</strong>. Simple as that.
          </p>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────── */}
      <section className="py-16 bg-cream">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-bold text-charcoal mb-2">You spot a van</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Anywhere online — Goo-net, Car Sensor, Yahoo Auctions, Facebook Marketplace, wherever.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="text-3xl mb-3">📬</div>
              <h3 className="font-bold text-charcoal mb-2">You send us the link</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Drop the URL and any notes in the form below. Takes 30 seconds.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-bold text-charcoal mb-2">We pay you $200</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                If we list it and a customer buys it, you get $200 AUD transferred directly to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Form ──────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl text-charcoal font-bold mb-3">Submit your tip</h2>
            <p className="text-gray-500 leading-relaxed">
              No limit on submissions. Every van you tip could earn you $200.
            </p>
          </div>
          <VanTipForm />
        </div>
      </section>

      {/* ─── Fine print / FAQ ──────────────────────────── */}
      <section className="py-12 bg-cream border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-lg font-bold text-charcoal mb-6">A few things to know</h2>
          <div className="space-y-4 text-sm text-gray-500 leading-relaxed">
            <p>
              <strong className="text-charcoal">What vans qualify?</strong> Any Toyota Hiace H200 or H300 — standard wheelbase, long wheelbase, or super long wheelbase. Pop tops are a bonus. Diesel preferred. We're not interested in window vans or commuter configs.
            </p>
            <p>
              <strong className="text-charcoal">Where can the van be listed?</strong> Anywhere — Japanese dealer sites (Goo-net, Car Sensor, BeForward), Yahoo Auctions Japan, Australian dealers, Facebook Marketplace, Gumtree, private sales. If it&apos;s a Hiace that&apos;s suitable for conversion, send it through.
            </p>
            <p>
              <strong className="text-charcoal">When do I get paid?</strong> Once the sale is settled and the van has been purchased by a customer through Bare Camper. We&apos;ll email you when it&apos;s matched and again when the fee is being processed.
            </p>
            <p>
              <strong className="text-charcoal">Which tips qualify for the fee?</strong> We pay the finders fee for <strong>Japanese-sourced vans</strong> that are purchased by a Bare Camper customer, and for <strong>Australian-sourced vans</strong> where the buyer goes on to get a Bare Camper conversion (pop top, hi-top, or full fit-out). Basically — if your tip leads to Bare Camper business, you get paid.
            </p>
            <p>
              <strong className="text-charcoal">Is there a limit?</strong> Nope. Submit as many as you like. Every successful match earns $200.
            </p>
            <p>
              <strong className="text-charcoal">What if I want to buy the van myself?</strong> Just say so in the notes — we&apos;ll contact you about it as a customer rather than treating it as a tip.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
