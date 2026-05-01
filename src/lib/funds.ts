import { createAdminClient } from '@/lib/supabase'

export type FundsEntryType =
  | 'sourcing_fee'
  | 'auction_deposit'
  | 'deposit'
  | 'progress'
  | 'final'
  | 'release'
  | 'refund'
  | 'other'

export type FundsStatus = 'held' | 'released' | 'refunded'

export interface FundsLedgerEntry {
  id: string
  user_id: string
  amount_cents: number
  entry_type: FundsEntryType
  status: FundsStatus
  reference_type: string | null
  reference_id: string | null
  description: string
  payment_method: string | null
  payment_ref: string | null
  notes: string | null
  created_at: string
  created_by: string | null
  released_at: string | null
  refunded_at: string | null
}

export interface FundsSummary {
  totalHeldCents: number
  totalReleasedCents: number
  totalRefundedCents: number
  totalEverDepositedCents: number
  entries: FundsLedgerEntry[]
}

/** Fetch the funds ledger for a single user and compute totals. */
export async function getUserFundsSummary(userId: string): Promise<FundsSummary> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('funds_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return { totalHeldCents: 0, totalReleasedCents: 0, totalRefundedCents: 0, totalEverDepositedCents: 0, entries: [] }
  }

  const entries = data as FundsLedgerEntry[]
  let totalHeldCents = 0
  let totalReleasedCents = 0
  let totalRefundedCents = 0

  for (const e of entries) {
    if (e.status === 'held')        totalHeldCents     += e.amount_cents
    else if (e.status === 'released') totalReleasedCents += e.amount_cents
    else if (e.status === 'refunded') totalRefundedCents += e.amount_cents
  }

  return {
    totalHeldCents,
    totalReleasedCents,
    totalRefundedCents,
    totalEverDepositedCents: totalHeldCents + totalReleasedCents + totalRefundedCents,
    entries,
  }
}

/** Format cents to AUD string. */
export function formatCentsAud(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const FUNDS_ENTRY_LABELS: Record<FundsEntryType, string> = {
  sourcing_fee:    'Sourcing fee',
  auction_deposit: 'Auction deposit',
  deposit:         'Deposit (20%)',
  progress:        'Progress payment (35%)',
  final:           'Final payment (45%)',
  release:         'Released to supplier',
  refund:          'Refund',
  other:           'Other',
}

export const FUNDS_STATUS_STYLES: Record<FundsStatus, { label: string; cls: string }> = {
  held:     { label: 'Held safely',  cls: 'bg-green-100 text-green-700' },
  released: { label: 'Released',     cls: 'bg-gray-100 text-gray-600' },
  refunded: { label: 'Refunded',     cls: 'bg-amber-100 text-amber-700' },
}
