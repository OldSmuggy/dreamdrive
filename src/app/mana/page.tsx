import { createAdminClient } from '@/lib/supabase'
import { getJpyRate } from '@/lib/settings'
import { manaJpConversionAud, manaAuConversionAud, conversionPriceRange, formatAud } from '@/lib/pricing'
import ManaProductClient from './ManaProductClient'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'MANA — Liveable Compact Campervan | Dream Drive',
  description: 'The MANA is built for two on the long road. Pop top, 75L fridge, toilet, external shower, 200AH lithium. From $105,000.',
}

export default async function ManaPage() {
  const [jpyRate, contentRes] = await Promise.all([
    getJpyRate(),
    createAdminClient().from('page_content').select('content_key, value').eq('page_slug', 'mana-product'),
  ])
  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  return <ManaProductClient jpyRate={jpyRate} content={content} />
}
