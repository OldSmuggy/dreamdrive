import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import CustomersClient from './CustomersClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Customers | Admin' }

export default async function CustomersPage() {
  const supabase = createAdminClient()

  const { data: customers, error } = await supabase
    .from('customers')
    .select(`
      id, first_name, last_name, email, phone, state, status, created_at,
      customer_vehicles(id, vehicle_status, created_at)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-forest-900">Customers</h1>
          <Link href="/admin/customers/add" className="btn-primary text-sm px-4 py-2">
            + Add Customer
          </Link>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
          <p className="font-semibold mb-2">Database setup required.</p>
          <p className="mb-3">Run the SQL migration in Supabase to create the customer tables, then refresh.</p>
          <p className="text-xs text-amber-600">Error: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-forest-900">
          Customers{' '}
          <span className="text-gray-400 font-sans text-lg font-normal">
            ({customers?.filter(c => c.status !== 'archived').length ?? 0})
          </span>
        </h1>
        <Link href="/admin/customers/add" className="btn-primary text-sm px-4 py-2">
          + Add Customer
        </Link>
      </div>
      <CustomersClient customers={customers ?? []} />
    </div>
  )
}
