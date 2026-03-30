'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ImportBreakdownLine } from '@/lib/pricing'

function fmt(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

interface Props {
  lines: ImportBreakdownLine[]
  totalCents: number
}

export default function ImportEstimate({ lines, totalCents }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-ocean/5 hover:bg-ocean/10 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-ocean shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-semibold text-charcoal">Import Estimate Breakdown</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div>
          {lines.map((line, i) => (
            <div
              key={line.label}
              className={`flex items-start justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
            >
              <div className="flex-1 mr-4">
                <span className="text-gray-700">{line.label}</span>
                {line.note && (
                  <span className="block text-xs text-gray-400 mt-0.5">{line.note}</span>
                )}
              </div>
              <span className="text-gray-800 font-medium whitespace-nowrap">{fmt(line.cents)}</span>
            </div>
          ))}

          {/* Total row */}
          <div className="flex items-center justify-between px-4 py-3 bg-charcoal text-white">
            <span className="font-bold text-sm">Estimated total — landed & complied</span>
            <span className="font-bold text-sand text-base">{fmt(totalCents)}</span>
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
            <p className="text-xs text-amber-700 leading-relaxed">
              Estimate only — final price depends on exchange rate at time of purchase. Compliance costs may vary by state.
              {' '}
              <Link href="/import-costs" className="text-ocean font-semibold hover:underline">
                Full pricing breakdown →
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
