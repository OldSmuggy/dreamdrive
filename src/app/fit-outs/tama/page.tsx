import Link from 'next/link'
import { getJpyRate } from '@/lib/settings'
import { createAdminClient } from '@/lib/supabase'
import TamaClient from './TamaClient'

export const metadata = { title: 'TAMA Pop Top | Dream Drive Fit-Outs' }
export const dynamic = 'force-dynamic'

const FITOUT_AUD = 47000

export default async function TamaPage() {
  const [jpyRate, contentRes] = await Promise.all([
    getJpyRate(),
    createAdminClient().from('page_content').select('content_key, value').eq('page_slug', 'tama'),
  ])
  const jpyApprox = Math.round(FITOUT_AUD / jpyRate / 1000) * 1000
  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  return <TamaClient jpyApprox={jpyApprox} content={content} />
}
