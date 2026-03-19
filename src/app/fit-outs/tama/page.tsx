import Link from 'next/link'
import { getJpyRate } from '@/lib/settings'
import { createAdminClient } from '@/lib/supabase'
import { generateMeta } from '@/lib/seo'
import TamaClient from './TamaClient'

export const metadata = generateMeta({
  title: 'TAMA Campervan — 6-Seat Pop Top Conversion from $106,000',
  description: 'The Dream Drive TAMA is a 6-seat pop top campervan built on the Toyota Hiace H200. Handcrafted in Tokyo, delivered to Australia from $106,000 driveaway.',
  url: '/fit-outs/tama',
})
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
