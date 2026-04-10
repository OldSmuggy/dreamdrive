'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

// ── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  { id: 'purpose', section: 'Vehicle', label: 'Loan Purpose' },
  { id: 'type', section: 'Vehicle', label: 'Vehicle Type' },
  { id: 'buying', section: 'Vehicle', label: 'Buying From' },
  { id: 'year', section: 'Vehicle', label: 'Build Year' },
  { id: 'condition', section: 'Vehicle', label: 'Condition' },
  { id: 'use', section: 'Loan', label: 'Business Use' },
  { id: 'amount', section: 'Loan', label: 'Loan Amount' },
  { id: 'term', section: 'Loan', label: 'Loan Term' },
  { id: 'employment', section: 'Employment', label: 'Employment' },
  { id: 'residency', section: 'Residency', label: 'Residency' },
  { id: 'address', section: 'Residency', label: 'Address' },
  { id: 'details', section: 'Final Details', label: 'Your Details' },
]

const SECTIONS = ['Vehicle', 'Loan', 'Employment', 'Residency', 'Final Details']

// ── Helpers ─────────────────────────────────────────────────────────────────

function RadioGroup({ options, value, onChange, cols = 2 }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; cols?: number }) {
  return (
    <div className={`grid gap-3 ${cols === 3 ? 'grid-cols-3' : cols === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
            value === o.value
              ? 'text-white border-transparent bg-ocean'
              : 'bg-white text-charcoal border-gray-200 hover:border-ocean/40'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function HelperTip({ text }: { text: string }) {
  return (
    <div className="bg-cream rounded-xl p-4 flex gap-3 items-start mt-6">
      <div className="w-8 h-8 rounded-full bg-ocean/20 flex items-center justify-center shrink-0 text-sm">🚐</div>
      <p className="text-sm text-charcoal/70 leading-relaxed">{text}</p>
    </div>
  )
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-charcoal">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function FinanceApplicationForm() {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    purpose: '',
    vehicleType: '',
    buyingFrom: '',
    vehicleYear: new Date().getFullYear().toString(),
    condition: '',
    businessUse: '',
    vehiclePrice: '50000',
    deposit: '0',
    loanTerm: '',
    balloonPct: '0',
    employmentType: '',
    employmentYears: '',
    employmentMonths: '',
    residencyStatus: '',
    livingSituation: '',
    unit: '',
    streetNumber: '',
    streetName: '',
    suburb: '',
    state: '',
    postcode: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    email: '',
    phone: '',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))
  const setVal = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const loanAmount = Math.max(0, Number(form.vehiclePrice) - Number(form.deposit))
  const balloonAmount = Math.round(loanAmount * (Number(form.balloonPct) / 100))

  const currentSection = STEPS[step]?.section ?? ''
  const canContinue = (): boolean => {
    switch (step) {
      case 0: return !!form.purpose
      case 1: return !!form.vehicleType
      case 2: return !!form.buyingFrom
      case 3: return !!form.vehicleYear
      case 4: return !!form.condition
      case 5: return !!form.businessUse
      case 6: return Number(form.vehiclePrice) > 0
      case 7: return !!form.loanTerm
      case 8: return !!form.employmentType && !!form.employmentYears
      case 9: return !!form.residencyStatus && !!form.livingSituation
      case 10: return !!form.streetName && !!form.suburb && !!form.state && !!form.postcode
      case 11: return !!form.firstName && !!form.lastName && !!form.email && !!form.phone
      default: return false
    }
  }

  const next = () => {
    if (step < 11) setStep(s => s + 1)
    else handleSubmit()
  }
  const back = () => { if (step > 0) setStep(s => s - 1) }

  const handleSubmit = async () => {
    setSubmitting(true)
    const notes = [
      `Purpose: ${form.purpose}`,
      `Vehicle: ${form.vehicleType} (${form.condition})`,
      `Year: ${form.vehicleYear}`,
      `Buying from: ${form.buyingFrom}`,
      `Business use: ${form.businessUse}`,
      `Price: $${Number(form.vehiclePrice).toLocaleString()}`,
      `Deposit: $${Number(form.deposit).toLocaleString()}`,
      `Loan amount: $${loanAmount.toLocaleString()}`,
      `Term: ${form.loanTerm} years`,
      `Balloon: ${form.balloonPct}% ($${balloonAmount.toLocaleString()})`,
      `Employment: ${form.employmentType} (${form.employmentYears}y ${form.employmentMonths}m)`,
      `Residency: ${form.residencyStatus} — ${form.livingSituation}`,
      `Address: ${[form.unit, form.streetNumber, form.streetName, form.suburb, form.state, form.postcode].filter(Boolean).join(', ')}`,
      `DOB: ${form.dob}`,
    ].join('\n')

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'finance_application',
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
          source: 'finance_application',
          lead_type: 'finance_application',
          notes,
          budget: `$${Number(form.vehiclePrice).toLocaleString()}`,
          finance_type: `${form.vehicleType} — ${form.purpose}`,
          // Full application data for email template
          finance_data: {
            purpose: form.purpose,
            vehicleType: form.vehicleType,
            buyingFrom: form.buyingFrom,
            vehicleYear: form.vehicleYear,
            condition: form.condition,
            businessUse: form.businessUse,
            vehiclePrice: form.vehiclePrice,
            deposit: form.deposit,
            loanAmount: loanAmount.toString(),
            loanTerm: form.loanTerm,
            balloonPct: form.balloonPct,
            balloonAmount: balloonAmount.toString(),
            employmentType: form.employmentType,
            employmentYears: form.employmentYears,
            employmentMonths: form.employmentMonths,
            residencyStatus: form.residencyStatus,
            livingSituation: form.livingSituation,
            address: [form.unit, form.streetNumber, form.streetName, form.suburb, form.state, form.postcode].filter(Boolean).join(', '),
            firstName: form.firstName,
            middleName: form.middleName,
            lastName: form.lastName,
            dob: form.dob,
          },
        }),
      })
    } catch { /* fire and forget */ }

    // HubSpot
    try {
      await fetch('https://api.hsforms.com/submissions/v3/integration/submit/8672029/a370fa84-ae00-4d8b-8d4d-dd6b1fd16641', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: [
            { name: 'firstname', value: form.firstName },
            { name: 'lastname', value: form.lastName },
            { name: 'email', value: form.email },
            { name: 'phone', value: form.phone },
            { name: 'message', value: `[Finance Application]\n${notes}` },
          ],
          context: { pageUri: typeof window !== 'undefined' ? window.location.href : '', pageName: 'Finance Application' },
        }),
      })
    } catch {}

    trackEvent('finance_application', { vehicleType: form.vehicleType, loanAmount: loanAmount.toString(), term: form.loanTerm })
    setStep(12) // success
    setSubmitting(false)
  }

  // ── Success ──
  if (step === 12) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="text-5xl mb-4">🚐</div>
        <h2 className="text-2xl font-bold text-charcoal mb-2">Nice one — we&apos;re on it!</h2>
        <p className="text-gray-500 mb-6">Our finance team will review your details and get back to you within 24 hours with tailored rate options from 40+ lenders.</p>
        <div className="bg-cream rounded-xl p-5 text-left mb-6">
          <p className="text-sm font-semibold text-charcoal mb-2">Your application</p>
          <div className="text-sm text-charcoal/60 space-y-1">
            <p>{form.vehicleType} · {form.condition} · {form.vehicleYear}</p>
            <p>Loan: ${loanAmount.toLocaleString()} over {form.loanTerm} years</p>
            <p>{form.firstName} {form.lastName} · {form.email}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">No credit score impact. Questions? Call <a href="tel:0432182892" className="underline text-ocean">0432 182 892</a></p>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-4xl mx-auto">
      {/* Sidebar — desktop */}
      <div className="hidden lg:block w-56 shrink-0">
        <button onClick={back} disabled={step === 0} className="flex items-center gap-2 text-sm text-gray-400 hover:text-charcoal mb-6 disabled:opacity-30">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="space-y-1">
          {SECTIONS.map(section => {
            const sectionSteps = STEPS.filter(s => s.section === section)
            const firstIdx = STEPS.indexOf(sectionSteps[0])
            const lastIdx = STEPS.indexOf(sectionSteps[sectionSteps.length - 1])
            const isComplete = step > lastIdx
            const isCurrent = step >= firstIdx && step <= lastIdx
            return (
              <div key={section} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${isCurrent ? 'bg-white font-semibold text-charcoal shadow-sm' : 'text-gray-400'}`}>
                {isComplete ? (
                  <span className="w-5 h-5 rounded-full bg-ocean flex items-center justify-center text-white text-[10px]">✓</span>
                ) : isCurrent ? (
                  <span className="w-5 h-5 rounded-full bg-ocean/40" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-gray-200" />
                )}
                {section}
              </div>
            )
          })}
        </div>
        <div className="mt-8 bg-cream rounded-xl p-4">
          <p className="text-xs font-semibold text-charcoal mb-1">Need a hand?</p>
          <p className="text-xs text-charcoal/60">Call Jared on <a href="tel:0432182892" className="underline font-semibold text-ocean">0432 182 892</a></p>
        </div>
      </div>

      {/* Mobile progress bar */}
      <div className="lg:hidden flex items-center gap-1 px-4">
        {SECTIONS.map((section, i) => {
          const sectionSteps = STEPS.filter(s => s.section === section)
          const lastIdx = STEPS.indexOf(sectionSteps[sectionSteps.length - 1])
          const firstIdx = STEPS.indexOf(sectionSteps[0])
          const isComplete = step > lastIdx
          const isCurrent = step >= firstIdx && step <= lastIdx
          return (
            <div key={section} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all ${isComplete ? 'bg-ocean' : isCurrent ? 'bg-ocean/40' : 'bg-gray-200'}`} />
              <p className={`text-[10px] mt-1 ${isCurrent ? 'text-charcoal font-semibold' : 'text-gray-400'}`}>{section}</p>
            </div>
          )
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Step {step + 1} of 12</p>

        {/* ── Step 1: Purpose ── */}
        {step === 0 && (<>
          <StepHeader title="Are you looking to buy or refinance?" />
          <RadioGroup options={[{ value: 'buy', label: 'Buy a vehicle' }, { value: 'refinance', label: 'Refinance existing' }]} value={form.purpose} onChange={v => setVal('purpose', v)} />
          <HelperTip text="G'day! Let's get you sorted with the right finance. Just a few quick questions and we'll match you with the best rate from our panel of 40+ lenders." />
        </>)}

        {/* ── Step 2: Vehicle Type ── */}
        {step === 1 && (<>
          <StepHeader title="What type of vehicle are you after?" />
          <RadioGroup options={[{ value: 'Van', label: 'Van' }, { value: 'Motorhome', label: 'Motorhome' }, { value: 'Caravan', label: 'Caravan' }, { value: 'Car', label: 'Car' }, { value: 'Ute', label: 'Ute' }, { value: 'Other', label: 'Other' }]} value={form.vehicleType} onChange={v => setVal('vehicleType', v)} cols={3} />
          <HelperTip text="Rates can vary between vehicle types — vans and motorhomes often qualify for specialist rates through our lender panel." />
        </>)}

        {/* ── Step 3: Buying From ── */}
        {step === 2 && (<>
          <StepHeader title="Where are you buying from?" />
          <RadioGroup options={[{ value: 'Dealership', label: 'Dealership' }, { value: 'Private sale', label: 'Private sale' }, { value: 'Import (Japan)', label: 'Import (Japan)' }, { value: 'Still deciding', label: 'Still deciding' }]} value={form.buyingFrom} onChange={v => setVal('buyingFrom', v)} />
          <HelperTip text="Still working it out? No worries — we can get your finance pre-approved so you're ready to jump on the right one when it comes along." />
        </>)}

        {/* ── Step 4: Vehicle Year ── */}
        {step === 3 && (<>
          <StepHeader title="What year is the vehicle?" subtitle="An estimate is fine" />
          <div className="space-y-4">
            <input type="number" min="1990" max={new Date().getFullYear() + 1} value={form.vehicleYear} onChange={set('vehicleYear')} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-ocean/40" />
            <input type="range" min="1990" max={new Date().getFullYear() + 1} value={form.vehicleYear} onChange={set('vehicleYear')} className="w-full" style={{ accentColor: '#3D6B73' }} />
          </div>
          <HelperTip text="Newer vehicles usually attract better rates, but our lenders finance everything from brand new to well-loved classics." />
        </>)}

        {/* ── Step 5: Condition ── */}
        {step === 4 && (<>
          <StepHeader title="What condition is the vehicle?" />
          <RadioGroup options={[{ value: 'New', label: 'New' }, { value: 'Used', label: 'Used' }, { value: 'Demo', label: 'Demo' }]} value={form.condition} onChange={v => setVal('condition', v)} />
          <HelperTip text="Most of our customers finance used vans — plenty of lenders are set up for it. New or demo might snag you a slightly lower rate." />
        </>)}

        {/* ── Step 6: Business Use ── */}
        {step === 5 && (<>
          <StepHeader title="Will it be used mainly for business?" subtitle="More than 50% business use" />
          <RadioGroup options={[{ value: 'No', label: 'Personal use' }, { value: 'Yes', label: 'Business use (50%+)' }]} value={form.businessUse} onChange={v => setVal('businessUse', v)} />
          <HelperTip text="Business use can open up chattel mortgage options — potentially tax-deductible interest and GST claims." />
        </>)}

        {/* ── Step 7: Loan Amount ── */}
        {step === 6 && (<>
          <StepHeader title="How much do you need to borrow?" subtitle="Rough numbers are fine — we can adjust later" />
          <div className="space-y-6">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Approximate vehicle price</label>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-400">$</span>
                <input type="number" min="5000" max="500000" step="1000" value={form.vehiclePrice} onChange={set('vehiclePrice')} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" />
              </div>
              <input type="range" min="5000" max="300000" step="1000" value={form.vehiclePrice} onChange={set('vehiclePrice')} style={{ accentColor: '#3D6B73' }} className="w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Deposit (if any)</label>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-400">$</span>
                <input type="number" min="0" max={form.vehiclePrice} step="500" value={form.deposit} onChange={set('deposit')} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" />
              </div>
              <input type="range" min="0" max={Number(form.vehiclePrice)} step="500" value={form.deposit} onChange={set('deposit')} style={{ accentColor: '#3D6B73' }} className="w-full" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-ocean">
              Loan amount: ${loanAmount.toLocaleString()}
            </div>
          </div>
          <HelperTip text="Don't stress about exact numbers — these can all be adjusted once you've found the right vehicle." />
        </>)}

        {/* ── Step 8: Loan Term ── */}
        {step === 7 && (<>
          <StepHeader title="How long do you want the loan?" subtitle="You can always adjust this later" />
          <RadioGroup options={[{ value: '3', label: '3 years' }, { value: '4', label: '4 years' }, { value: '5', label: '5 years' }, { value: '7', label: '7 years' }]} value={form.loanTerm} onChange={v => setVal('loanTerm', v)} />
          <div className="mt-6">
            <label className="text-xs font-medium text-gray-500 mb-1 block">End-of-loan balloon payment (optional)</label>
            <select value={form.balloonPct} onChange={set('balloonPct')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ocean/40">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(pct => (
                <option key={pct} value={pct}>{pct}% (${Math.round(loanAmount * pct / 100).toLocaleString()})</option>
              ))}
            </select>
          </div>
          <HelperTip text="Longer terms mean lower monthly repayments but more interest overall. A balloon payment reduces your monthly cost too, with a lump sum at the end." />
        </>)}

        {/* ── Step 9: Employment ── */}
        {step === 8 && (<>
          <StepHeader title="Tell us about your work" />
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Employment type</label>
              <select required value={form.employmentType} onChange={set('employmentType')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ocean/40">
                <option value="">Select...</option>
                {['Full time', 'Part time', 'Self employed', 'Casual', 'Contractor', 'Unemployed', 'Pension'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Years in current role</label>
                <select value={form.employmentYears} onChange={set('employmentYears')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ocean/40">
                  <option value="">Select...</option>
                  <option value="0">Less than a year</option>
                  {Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1} year{i > 0 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Months</label>
                <select value={form.employmentMonths} onChange={set('employmentMonths')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ocean/40">
                  <option value="">Select...</option>
                  <option value="0">Less than a month</option>
                  {Array.from({ length: 11 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1} month{i > 0 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>
          </div>
          <HelperTip text="Full time means set hours with annual leave. If you get paid hourly without guaranteed shifts, go with Casual." />
        </>)}

        {/* ── Step 10: Residency ── */}
        {step === 9 && (<>
          <StepHeader title="Your residency status" />
          <div className="space-y-4">
            <RadioGroup options={[{ value: 'Australian Citizen', label: 'Australian Citizen' }, { value: 'Permanent resident', label: 'Permanent Resident' }, { value: 'Temporary visa', label: 'Temporary Visa' }]} value={form.residencyStatus} onChange={v => setVal('residencyStatus', v)} />
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Current living situation</label>
              <select value={form.livingSituation} onChange={set('livingSituation')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ocean/40">
                <option value="">Select...</option>
                {['Renting', 'Renting but own property', 'Owner with mortgage', 'Owner without mortgage', 'Living with parents', 'Board'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <HelperTip text="If you're staying somewhere but not on the lease, choose Board rather than Renting." />
        </>)}

        {/* ── Step 11: Address ── */}
        {step === 10 && (<>
          <StepHeader title="What&apos;s your current address?" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Unit (optional)</label><input value={form.unit} onChange={set('unit')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="E.g. 301" /></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Street number</label><input value={form.streetNumber} onChange={set('streetNumber')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="E.g. 80" /></div>
            </div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Street name</label><input value={form.streetName} onChange={set('streetName')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="E.g. Wentworth Ave" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Suburb</label><input value={form.suburb} onChange={set('suburb')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="E.g. Surry Hills" /></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">State</label>
                <select value={form.state} onChange={set('state')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ocean/40">
                  <option value="">Select</option>
                  {['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Postcode</label><input value={form.postcode} onChange={set('postcode')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="E.g. 2000" /></div>
            </div>
          </div>
          <HelperTip text="This helps lenders verify your identity and tailor rates. No impact on your credit score at this stage." />
        </>)}

        {/* ── Step 12: Final Details ── */}
        {step === 11 && (<>
          <StepHeader title="Last step — your details" subtitle="As they appear on your ID" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">First name *</label><input required value={form.firstName} onChange={set('firstName')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="First name" /></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Middle name</label><input value={form.middleName} onChange={set('middleName')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="Middle name (optional)" /></div>
            </div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Last name *</label><input required value={form.lastName} onChange={set('lastName')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="Last name" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Date of birth</label><input type="text" value={form.dob} onChange={set('dob')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="DD/MM/YYYY" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Email *</label><input required type="email" value={form.email} onChange={set('email')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="you@email.com" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Mobile *</label><input required type="tel" value={form.phone} onChange={set('phone')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40" placeholder="04XX XXX XXX" /></div>
          </div>
          <div className="flex items-center gap-3 mt-4 bg-cream rounded-lg p-3">
            <span className="text-lg">🔒</span>
            <p className="text-xs text-charcoal/60">Your details are kept confidential and encrypted. We only share what&apos;s needed with lenders to get your quote.</p>
          </div>
        </>)}

        {/* ── CTA Button ── */}
        <button
          onClick={next}
          disabled={!canContinue() || submitting}
          className="w-full mt-6 py-3.5 rounded-xl text-sm font-bold text-charcoal bg-sand hover:bg-sand-light transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {submitting ? 'Submitting...' : step === 11 ? 'Get My Quote' : 'Continue'}
        </button>
        {step <= 1 && <p className="text-xs text-gray-400 text-center mt-2">No credit score impact at this stage</p>}

        {/* Mobile back button */}
        {step > 0 && (
          <button onClick={back} className="lg:hidden w-full mt-2 py-2 text-sm text-gray-400 hover:text-charcoal">
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
