import { createAdminClient } from '@/lib/supabase'
import AdminFundsClient from './AdminFundsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Funds Ledger | Admin' }

export default async function AdminFundsPage() {
  const supabase = createAdminClient()

  const [{ data: entries }, { data: users }] = await Promise.all([
    supabase
      .from('funds_ledger')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('profiles')
      .select('id, first_name, last_name, dealer_company_name, role')
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const userMap = Object.fromEntries(
    (users ?? []).map((u: { id: string; first_name: string | null; last_name: string | null; dealer_company_name: string | null; role: string }) => [
      u.id,
      {
        name: u.dealer_company_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown user',
        role: u.role ?? 'customer',
      },
    ]),
  )

  return <AdminFundsClient initialEntries={entries ?? []} users={users ?? []} userMap={userMap} />
}
