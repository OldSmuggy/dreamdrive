import Link from 'next/link'
import { getJpyRate } from '@/lib/settings'
import { createAdminClient } from '@/lib/supabase'
import ManaClient from './ManaClient'

export const metadata = { title: 'MANA Pop Top | Dream Drive Fit-Outs' }
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
