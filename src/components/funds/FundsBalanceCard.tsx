import Link from 'next/link'
import { formatCentsAud, type FundsSummary } from '@/lib/funds'

interface Props {
  summary: FundsSummary
  variant?: 'customer' | 'dealer'
}

export default function FundsBalanceCard({ summary, variant = 'customer' }: Props) {
  const { totalHeldCents, totalReleasedCents, totalRefundedCents } = summary
  const isDealer = variant === 'dealer'

  return (
    <div className="bg-gradient-to-br from-ocean to-charcoal text-white rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-2">Ring-fenced funds</p>
          <h2 className="text-3xl md:text-4xl font-bold">{formatCentsAud(totalHeldCents)}</h2>
          <p className="text-white/70 text-sm mt-1">held safely in your name</p>
        </div>
        <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 shrink-0">
          <svg className="w-7 h-7 text-sand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white/10 rounded-xl px-4 py-3">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Released</p>
          <p className="text-white font-semibold">{formatCentsAud(totalReleasedCents)}</p>
        </div>
        <div className="bg-white/10 rounded-xl px-4 py-3">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Refunded</p>
          <p className="text-white font-semibold">{formatCentsAud(totalRefundedCents)}</p>
        </div>
      </div>

      <p className="text-white/70 text-xs leading-relaxed">
        Held in our dedicated account, separate from operating funds. {' '}
        <Link href="/your-money" className="text-sand hover:underline font-medium">
          Read our policy →
        </Link>
      </p>

      {isDealer && totalHeldCents === 0 && (
        <div className="mt-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <p className="text-white/80 text-xs leading-relaxed">
            No deposits yet. Place your first order and lock in your build slot.
          </p>
        </div>
      )}
    </div>
  )
}
