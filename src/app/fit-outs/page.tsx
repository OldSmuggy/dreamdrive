import { createAdminClient } from '@/lib/supabase'
import { generateMeta } from '@/lib/seo'
import FitOutsClient from './FitOutsClient'

export const metadata = generateMeta({
  title: 'Dream Drive Campervan Fit-Outs — TAMA, MANA & KUMA',
  description: 'Handcrafted campervan conversions built on the Toyota Hiace H200. Choose from TAMA, MANA, or KUMA fit-outs, all built in our Tokyo facility.',
  url: '/fit-outs',
})
export const dynamic = 'force-dynamic'

export default async function FitOutsPage() {
  const contentRes = await createAdminClient()
    .from('page_content')
    .select('content_key, value')
    .eq('page_slug', 'fit-outs')

  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  return <FitOutsClient content={content} />
}
