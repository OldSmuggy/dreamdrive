import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import AddPartnerListingClient from './AddPartnerListingClient'

export const dynamic = 'force-dynamic'

export default async function AddPartnerListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: partner } = await supabase.from('supplier_partners').select('*').eq('id', id).single()
  if (!partner) notFound()
  return (
    <div className="space-y-6">
      <Link href={`/admin/partners/${id}`} className="text-sm text-gray-400 hover:text-charcoal">← {partner.name}</Link>
      <AddPartnerListingClient partner={partner} />
    </div>
  )
}
