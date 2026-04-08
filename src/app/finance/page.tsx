import FinanceCalculator from './FinanceCalculator'
import FinanceApplicationForm from '@/components/FinanceApplicationForm'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Finance Your Campervan Import — Stratton Finance Partner | Bare Camper',
  description: 'Finance your Japan import van and Bare Camper conversion through Stratton Finance. Personal loans and chattel mortgages with 40+ lenders compared. Calculate your repayments.',
  url: '/finance',
})

const STATS = [
  { value: 'Stratton Finance', label: 'our finance partner' },
  { value: 'Up to 7 years',       label: 'loan term' },
  { value: '40+ lenders',         label: 'compared for you' },
  { value: 'Van + conversion',    label: 'covered in one loan' },
]

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Submit your enquiry',
    desc: 'Fill out the short form below with your budget and preference. No credit check at this stage — just a conversation starter.',
  },
  {
    step: '2',
    title: 'Stratton compares lenders',
    desc: 'Your details go to our dedicated Stratton Finance broker, who searches 40+ Australian lenders and presents your best-matched options within 24 hours.',
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

const WHY_STRATTON = [
  { icon: '🏆', title: 'Australia\'s largest vehicle finance broker', desc: 'Stratton has been helping Australians finance vehicles for over 20 years with a 4.7★ Google rating.' },
  { icon: '🔍', title: '40+ lenders in one search', desc: 'Instead of applying to banks one by one, Stratton searches their entire lender panel to find the best rate for your situation.' },
  { icon: '🚐', title: 'They understand imports', desc: 'Stratton regularly finances Japanese imports and custom builds. They know how to value a van + conversion as a single package.' },
  { icon: '💬', title: 'Dedicated Bare Camper broker', desc: 'You get a named broker who understands our process and can structure the loan around import timelines.' },
]

export default function FinancePage() {
  return (
    <div className="min-h-screen">

      {/* ---- Hero ---- */}
      <section style={{ backgroundColor: '#2C2C2A' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32">
          <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Bare Camper × Stratton Finance</p>
          <h1 className="text-4xl md:text-6xl leading-tight mb-6 max-w-3xl">
            Finance your van + fit-out in one loan
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mb-10 leading-relaxed">
            Through our partnership with <strong className="text-white">Stratton Finance</strong>, Australia&apos;s
            largest vehicle finance broker, we bundle your Toyota Hiace and conversion
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
                <p className="text-2xl md:text-3xl text-ocean leading-snug mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Why Stratton ---- */}
      <section className="bg-cream py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-charcoal mb-3">Why Stratton Finance?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We partnered with Stratton because they&apos;re the best at what they do — and they
              understand the unique needs of campervan import buyers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {WHY_STRATTON.map(item => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-charcoal mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Calculator (client component) ---- */}
      <FinanceCalculator />

      {/* ---- How it works ---- */}
      <section className="bg-charcoal text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step}>
                <div className="text-sand text-5xl mb-4">{step.step}</div>
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
          <h2 className="text-4xl text-charcoal mb-3">Finance Options</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Two products suit most Bare Camper buyers. Stratton recommends the right fit for your situation.
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
                  <span className="inline-block bg-cream text-ocean text-xs font-semibold px-2.5 py-0.5 rounded mb-1.5">
                    {option.badge}
                  </span>
                  <h3 className="text-2xl text-charcoal">{option.title}</h3>
                </div>
              </div>
              <ul className="space-y-2.5">
                {option.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="text-ocean mt-px flex-shrink-0 font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Finance Application Form ---- */}
      <section id="get-finance" className="bg-cream py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-4xl text-charcoal mb-3">Apply for Finance</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Answer a few quick questions and we&apos;ll match you with the best rate from 40+ lenders. No credit check at this stage.
            </p>
          </div>
          <FinanceApplicationForm />
        </div>
      </section>


    </div>
  )
}
