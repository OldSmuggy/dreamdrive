export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

/** GET — all dealer orders across all dealers */
export async function GET() {
  const { user, error } = await requireAdmin()
  if (error || !user) return error

  const supabase = createAdminClient()
  const { data, error: dbErr } = await supabase
    .from('dealer_orders')
    .select('*, profiles:profiles!dealer_orders_dealer_user_id_fkey(first_name, last_name, dealer_company_name, dealer_territory)')
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
