import { formatCentsAud, FUNDS_ENTRY_LABELS, FUNDS_STATUS_STYLES, type FundsLedgerEntry } from '@/lib/funds'

interface Props {
  entries: FundsLedgerEntry[]
  showAdminActions?: boolean
  onAction?: (entry: FundsLedgerEntry, action: 'release' | 'refund' | 'reset' | 'delete') => void
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FundsLedgerTable({ entries, showAdminActions, onAction }: Props) {
  if (entries.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400">
        <p className="text-sm">No transactions yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="divide-y divide-gray-100">
        {entries.map((e) => {
          const status = FUNDS_STATUS_STYLES[e.status]
          const typeLabel = FUNDS_ENTRY_LABELS[e.entry_type] ?? e.entry_type
          return (
            <div key={e.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-charcoal text-sm">{e.description}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {fmtDate(e.created_at)} · {typeLabel}
                  {e.payment_method && ` · ${e.payment_method.replace('_', ' ')}`}
                  {e.payment_ref && ` · Ref ${e.payment_ref}`}
                </p>
                {e.notes && <p className="text-xs text-gray-400 mt-1 italic">{e.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-charcoal font-bold text-base whitespace-nowrap">{formatCentsAud(e.amount_cents)}</p>
                {showAdminActions && onAction && (
                  <div className="flex items-center gap-1">
                    {e.status === 'held' && (
                      <>
                        <button onClick={() => onAction(e, 'release')} className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">Release</button>
                        <button onClick={() => onAction(e, 'refund')} className="text-xs px-2 py-1 border border-amber-200 text-amber-700 rounded hover:bg-amber-50">Refund</button>
                      </>
                    )}
                    {e.status !== 'held' && (
                      <button onClick={() => onAction(e, 'reset')} className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-500">Undo</button>
                    )}
                    <button onClick={() => onAction(e, 'delete')} className="text-xs px-2 py-1 text-red-400 hover:text-red-600">×</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
