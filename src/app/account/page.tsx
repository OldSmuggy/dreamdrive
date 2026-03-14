import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getJpyRate } from '@/lib/settings'
import AccountClient from './AccountClient'
import type { Listing, Product } from '@/types'

export const metadata = { title: 'My Account' }

export default async function AccountPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account')

  const [savedVansRes, buildsRes, depositsRes, importsRes, profileRes, productsRes, jpyRate] = await Promise.all([
    supabase.from('saved_vans').select('*, listing:listings(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('builds')
      .select('id, share_slug, total_aud_min, total_aud_max, created_at, listing_id, fitout_product_id, elec_product_id, poptop_product_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('deposit_holds').select('*, listing:listings(id, model_name, model_year, photos, source)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('import_orders').select('*, listing:listings(id, model_name, model_year, photos)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('products').select('id, name, rrp_aud, slug, category').eq('visible', true),
    getJpyRate(),
  ])

  // Fetch listings used in builds
  const listingIds = (buildsRes.data ?? [])
    .map((b: Record<string, unknown>) => b.listing_id as string | null)
    .filter(Boolean) as string[]

  const { data: buildListings } = listingIds.length
    ? await supabase.from('listings')
        .select('id, model_name, model_year, mileage_km, drive, photos, source, inspection_score, aud_estimate, au_price_aud')
        .in('id', listingIds)
    : { data: [] as unknown[] }

  const listingMap = Object.fromEntries(((buildListings ?? []) as Array<{ id: string }>).map(l => [l.id, l]))

  // Fetch invoices + payments (tables may not exist yet — ignore errors)
  const orderIds = (importsRes.data ?? []).map((o: Record<string, unknown>) => o.id as string)
  const [invoicesRes, paymentsRes] = await Promise.all([
    orderIds.length
      ? supabase.from('invoices').select('*').in('import_order_id', orderIds).order('created_at')
      : Promise.resolve({ data: [] as unknown[] }),
    orderIds.length
      ? supabase.from('payments').select('*').in('import_order_id', orderIds).order('payment_date', { ascending: false })
      : Promise.resolve({ data: [] as unknown[] }),
  ])

  // Normalize import order listing (Supabase relational returns array)
  const importOrders = (importsRes.data ?? []).map((o: Record<string, unknown>) => {
    const arr = o.listing as Array<Record<string, unknown>> | null
    return { ...o, listing: Array.isArray(arr) ? (arr[0] ?? null) : arr ?? null }
  })

  return (
    <AccountClient
      user={{ id: user.id, email: user.email ?? '' }}
      profile={profileRes.data}
      savedVans={(savedVansRes.data ?? []) as Array<{ id: string; listing_id: string; created_at: string; listing: Listing | null }>}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      builds={(buildsRes.data ?? []).map((b: Record<string, unknown>) => ({
        ...b,
        listing: b.listing_id ? (listingMap[b.listing_id as string] ?? null) : null,
      })) as any}
      depositHolds={depositsRes.data ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      importOrders={importOrders as any}
      products={(productsRes.data ?? []) as Product[]}
      invoices={invoicesRes.data ?? []}
      payments={paymentsRes.data ?? []}
      jpyRate={jpyRate}
    />
  )
}
