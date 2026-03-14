import { createAdminClient } from '@/lib/supabase'
import CustomersClient from './CustomersClient'

export const metadata = { title: 'Customers | Admin' }

export default async function CustomersPage() {
  const admin = createAdminClient()

  // Get all auth users
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 })

  // Get profiles
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, first_name, last_name, is_admin')

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  // Get saved van counts
  const { data: savedCounts } = await admin
    .from('saved_vans')
    .select('user_id')

  const savedCountMap: Record<string, number> = {}
  for (const row of savedCounts ?? []) {
    savedCountMap[row.user_id] = (savedCountMap[row.user_id] ?? 0) + 1
  }

  // Get deposit hold counts
  const { data: depositRows } = await admin
    .from('deposit_holds')
    .select('user_id, status')

  const depositMap: Record<string, number> = {}
  for (const row of depositRows ?? []) {
    if (row.status === 'pending' || row.status === 'active') {
      depositMap[row.user_id] = (depositMap[row.user_id] ?? 0) + 1
    }
  }

  // Get import orders
  const { data: importRows } = await admin
    .from('import_orders')
    .select('id, user_id, listing_id, current_stage, stage_dates, admin_notes, created_at, order_type, listing:listings(id, model_name, model_year, photos)')

  type NormalizedImport = {
    id: string; user_id: string; listing_id: string; current_stage: string
    stage_dates: Record<string, string>; admin_notes: string | null; created_at: string
    order_type: string | null
    listing: { id: string; model_name: string; model_year: number | null; photos: string[] } | null
  }
  const importsByUser: Record<string, NormalizedImport[]> = {}
  const allOrderIds: string[] = []
  for (const row of importRows ?? []) {
    const listingArr = row.listing as unknown as { id: string; model_name: string; model_year: number | null; photos: string[] }[]
    const normalized: NormalizedImport = {
      ...row,
      order_type: (row as Record<string, unknown>).order_type as string | null ?? null,
      listing: listingArr?.[0] ?? null,
    }
    allOrderIds.push(row.id)
    if (!importsByUser[row.user_id]) importsByUser[row.user_id] = []
    importsByUser[row.user_id]!.push(normalized)
  }

  // Fetch invoices and payments
  const [invoicesRes, paymentsRes] = await Promise.all([
    allOrderIds.length
      ? admin.from('invoices').select('*').in('import_order_id', allOrderIds).order('created_at')
      : Promise.resolve({ data: [] }),
    allOrderIds.length
      ? admin.from('payments').select('*').in('import_order_id', allOrderIds).order('payment_date', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const customers = users
    .filter(u => {
      const p = profileMap[u.id]
      return !p?.is_admin && !u.email?.endsWith('@dreamdrive.life')
    })
    .map(u => ({
      id: u.id,
      email: u.email ?? '',
      created_at: u.created_at,
      first_name: profileMap[u.id]?.first_name ?? null,
      last_name: profileMap[u.id]?.last_name ?? null,
      saved_count: savedCountMap[u.id] ?? 0,
      deposit_count: depositMap[u.id] ?? 0,
      imports: importsByUser[u.id] ?? [],
    }))

  return <CustomersClient customers={customers} invoices={invoicesRes.data ?? []} payments={paymentsRes.data ?? []} />
}
