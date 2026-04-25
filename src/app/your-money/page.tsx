import Link from 'next/link'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Your Money is Safe | Bare Camper',
  description: 'How Bare Camper handles your deposits and payments. Your funds are held in a dedicated, ring-fenced account separate from operating funds.',
  url: '/your-money',
})

export default function YourMoneyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-charcoal text-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sand text-xs font-semibold tracking-widest uppercase mb-4">Trust & Transparency</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">Your money is safe.</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Every deposit and payment you send us is held in a dedicated account, ring-fenced from our day-to-day operating funds. You can see your balance — and every transaction — in your account, any time.
          </p>
        </div>
      </section>

      {/* Three pillars */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-bold text-charcoal mb-2">Held separately</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your payments go into a dedicated account, kept apart from money we use to run the business. We don't touch it until your van is delivered — or you ask for it back.
            </p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-charcoal mb-2">Visible in real time</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Log in to your account any time and see exactly how much you have on deposit, when each payment was received, and where it sits in the process.
            </p>
          </div>
          <div className="border border-gray-200 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <h3 className="font-bold text-charcoal mb-2">Refunded if we can't deliver</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              If we can't source the right vehicle within the agreed window, your sourcing fee is refunded in full. Simple, no haggling.
            </p>
          </div>
        </div>
      </section>

      {/* What you'll see */}
      <section className="bg-cream py-16">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">What you'll see</p>
          <h2 className="text-3xl text-charcoal font-bold mb-6">Every dollar accounted for.</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            When you log into your account, you'll see a clear summary of your funds:
          </p>
          <ul className="space-y-4">
            {[
              { title: 'Current balance', desc: 'Total amount currently held in the dedicated account on your behalf.' },
              { title: 'Released payments', desc: 'Funds that have been used for their intended purpose (e.g. paid to the auction, supplier, or shipping agent).' },
              { title: 'Refunded amounts', desc: 'Money returned to you, with the reason and date.' },
              { title: 'Transaction history', desc: 'Every payment in or out, with date, description and reference.' },
            ].map(item => (
              <li key={item.title} className="flex gap-4">
                <span className="text-ocean shrink-0 mt-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-charcoal">{item.title}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* When does money actually leave the account? */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-driftwood text-xs font-semibold tracking-widest uppercase mb-3">When we use your money</p>
        <h2 className="text-3xl text-charcoal font-bold mb-6">Released only at the right moment.</h2>
        <div className="space-y-4">
          {[
            { stage: '1', title: 'Sourcing fee', desc: 'Held until we secure your vehicle. If we can\'t source within the agreed window, refunded in full.' },
            { stage: '2', title: 'Auction deposit', desc: 'Released to the auction house when you win a vehicle. Refunded if you decide not to proceed before bidding.' },
            { stage: '3', title: 'Vehicle payment', desc: 'Held until your van is purchased and on its way to Australia. Released to the supplier in line with the agreed schedule.' },
            { stage: '4', title: 'Conversion / fit-out', desc: 'Held until each milestone is complete. Released stage-by-stage as the work is done.' },
            { stage: '5', title: 'Final delivery', desc: 'Final balance held until your van is ready for collection. Released on handover.' },
          ].map(s => (
            <div key={s.stage} className="flex gap-4 border border-gray-200 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-full bg-ocean text-white flex items-center justify-center font-bold shrink-0">{s.stage}</div>
              <div>
                <p className="font-semibold text-charcoal mb-1">{s.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-charcoal text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions about your money?</h2>
          <p className="text-white/70 leading-relaxed mb-8 max-w-xl mx-auto">
            Email us any time at <a href="mailto:hello@barecamper.com.au" className="text-sand hover:underline">hello@barecamper.com.au</a> or jump into your account to see your current balance.
          </p>
          <Link href="/account" className="btn-primary inline-block">
            View My Account →
          </Link>
        </div>
      </section>
    </div>
  )
}
