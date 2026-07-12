import Link from 'next/link'
import { getJpyRate } from '@/lib/settings'
import { createAdminClient } from '@/lib/supabase'
import { generateMeta } from '@/lib/seo'
import { manaConversionAud } from '@/lib/pricing'
import ManaClient from './ManaClient'

export const metadata = generateMeta({
  title: 'MANA Campervan — Couples Campervan Conversion from ~$69,000',
  description: 'The Bare Camper MANA is a compact campervan for couples. Full kitchen, toilet, shower and 200AH electrical system. From ~$69,000 driveaway. Pop top optional.',
  url: '/fit-outs/mana',
})
export const dynamic = 'force-dynamic'

export default async function ManaPage() {
  const [jpyRate, contentRes] = await Promise.all([
    getJpyRate(),
    createAdminClient().from('page_content').select('content_key, value').eq('page_slug', 'mana'),
  ])
  const fitoutAud = manaConversionAud(jpyRate)
  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  return <ManaClient fitoutAud={fitoutAud} content={content} />
}
