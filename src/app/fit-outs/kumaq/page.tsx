import Link from 'next/link'
import { getJpyRate } from '@/lib/settings'
import { createAdminClient } from '@/lib/supabase'
import KumaqClient from './KumaqClient'

export const metadata = { title: 'KUMAQ | Dream Drive Fit-Outs' }
export const dynamic = 'force-dynamic'

const FITOUT_AUD = 55000

export default async function KumaqPage() {
  const [jpyRate, contentRes] = await Promise.all([
    getJpyRate(),
    createAdminClient().from('page_content').select('content_key, value').eq('page_slug', 'kumaq'),
  ])
  const jpyApprox = Math.round(FITOUT_AUD / jpyRate / 1000) * 1000
  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  return <KumaqClient jpyApprox={jpyApprox} content={content} />
}
