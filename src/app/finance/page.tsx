import type { Metadata } from 'next'
import FinanceCalculator from './FinanceCalculator'
import LeadForm from './LeadForm'

export const metadata: Metadata = {
  title: 'Finance | Dream Drive',
  description:
    'Finance your Toyota Hiace van and fit-out in one loan. We compare 40+ Australian lenders for personal loans and chattel mortgages.',
}

const STATS = [
  { value: 'Personal & business', label: 'loans available' },
  { value: 'Up to 7 years',       label: 'loan term' },
  { value: '40+ lenders',         label: 'compared for you' },
  { value: 'Van + conversion',    label: 'covered in one loan' },
]

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Submit your enquiry',
    desc: 'Fill out the short form with your budget and preference. No credit check at this stage — just a conversation starter.',
  },
  {
    step: '2',
    title: 'We compare lenders',
    desc: 'Our finance team searches 40+ Australian lenders and presents your best-matched options within 24 hours.',
  },
  {
    step: '3',
    title: 'Drive away financed',
    desc: 'Choose your loan, sign the paperwork, and your van + fit-out are funded in one clean package.',
  },
]

const FINANCE_OPTIONS = [
  {
    title: 'Personal Loan',
    icon: '👤',
    badge: 'Best for employees',
    features: [
      'No asset required as security',
      'Fixed repayments, no balloon payment',
      'Van + conversion bundled in one amount',
      '1–7 year terms available',
      'Suitable for PAYG employees',
    ],
  },
  {
    title: 'Chattel Mortgage',
    icon: '🏢',
    badge: 'Best for ABN holders',
    features: [
      'Claim GST on the full purchase price',
      'Interest & depreciation tax-deductible',
      'Fixed rate with optional balloon payment',
      'Asset stays on your business balance sheet',
      'Best for business-use vans',
    ],
  },
]

export default function FinancePage() {
  return (
    <div className="min-h-screen">

      {/* ---- Hero ---- */}
      <section style={{ backgroundColor: '#1a3a2a' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32">
          <p className="text-sand-400 text-sm font-semibold tracking-widest uppercase mb-4">Dream Drive Finance</p>
          <h1 className="font-display text-4xl md:text-6xl leading-tight mb-6 max-w-3xl">
            Finance your van + fit-out in one loan
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mb-10 leading-relaxed">
            We work with 40+ Australian lenders to bundle your Toyota Hiace and conversion
            into a single, simple finance package — personal loan or chattel mortgage.
          </p>
          <a href="#get-finance" className="btn-primary inline-block text-base px-8 py-4">
            Get finance options →
          </a>
        </div>
      </section>

      {/* ---- Trust bar ---- */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(stat => (
              <div key={stat.value}>
                <p className="font-display text-2xl md:text-3xl text-forest-700 leading-snug mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Calculator (client component) ---- */}
      <FinanceCalculator />

      {/* ---- How it works ---- */}
      <section className="bg-forest-950 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-4xl text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step}>
                <div className="text-sand-400 font-display text-5xl mb-4">{step.step}</div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Finance option cards ---- */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl text-forest-900 mb-3">Finance Options</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Two products suit most Dream Drive buyers. Our team recommends the right fit for your situation.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {FINANCE_OPTIONS.map(option => (
            <div
              key={option.title}
              className="border border-gray-200 rounded-2xl p-7 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 mb-5">
                <span className="text-4xl leading-none">{option.icon}</span>
                <div>
                  <span className="inline-block bg-forest-100 text-forest-700 text-xs font-semibold px-2.5 py-0.5 rounded mb-1.5">
                    {option.badge}
                  </span>
                  <h3 className="font-display text-2xl text-forest-900">{option.title}</h3>
                </div>
              </div>
              <ul className="space-y-2.5">
                {option.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="text-forest-500 mt-px flex-shrink-0 font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Lead capture form (client component) ---- */}
      <section id="get-finance" className="bg-sand-50 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl text-forest-900 mb-3">Get Finance Options</h2>
            <p className="text-gray-500">
              No credit check. No commitment. Tailored options within 24 hours.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <LeadForm />
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        <p>Dream Drive (AU) • DIY RV Solutions (AU) • Japan Import Service</p>
        <p className="mt-1">
          <a href="mailto:jared@dreamdrive.life" className="hover:text-forest-600">jared@dreamdrive.life</a>
          {' · '}
          <a href="tel:0432182892" className="hover:text-forest-600">0432 182 892</a>
        </p>
      </footer>

    </div>
  )
}
