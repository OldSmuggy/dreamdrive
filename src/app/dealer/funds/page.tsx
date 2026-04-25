import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getUserFundsSummary } from '@/lib/funds'
import FundsBalanceCard from '@/components/funds/FundsBalanceCard'
import FundsLedgerTable from '@/components/funds/FundsLedgerTable'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Funds Held' }

export default async function DealerFundsPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const summary = await getUserFundsSummary(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Funds Held</h1>
        <p className="text-gray-500 text-sm mt-1">Your money, ring-fenced and visible in real time.</p>
      </div>

      <FundsBalanceCard summary={summary} variant="dealer" />

      <div>
        <h2 className="font-semibold text-charcoal mb-3">Transaction history</h2>
        <FundsLedgerTable entries={summary.entries} />
      </div>
    </div>
  )
}
