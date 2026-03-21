import Link from 'next/link'
import { getJpyRate } from '@/lib/settings'
import { createAdminClient } from '@/lib/supabase'
import { generateMeta } from '@/lib/seo'
import ManaClient from './ManaClient'

export const metadata = generateMeta({
  title: 'MANA Campervan — Couples Pop Top Conversion from $105,000',
  description: 'The Bare Camper MANA is a compact pop top campervan for couples. Full kitchen, toilet, shower and 200AH electrical system. From $105,000 driveaway.',
  url: '/fit-outs/mana',
})
export const dynamic = 'force-dynamic'

const FITOUT_AUD = 47000

export default async function ManaPage() {
  const [jpyRate, contentRes] = await Promise.all([
    getJpyRate(),
    createAdminClient().from('page_content').select('content_key, value').eq('page_slug', 'mana'),
  ])
  const jpyApprox = Math.round(FITOUT_AUD / jpyRate / 1000) * 1000
  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  return <ManaClient jpyApprox={jpyApprox} content={content} />
}
