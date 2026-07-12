import Link from 'next/link'
import { getJpyRate } from '@/lib/settings'
import { createAdminClient } from '@/lib/supabase'
import { generateMeta } from '@/lib/seo'
import { tamaConversionAud } from '@/lib/pricing'
import TamaClient from './TamaClient'

export const metadata = generateMeta({
  title: 'TAMA Campervan — 6-Seat Campervan Conversion from ~$69,000',
  description: 'The Bare Camper TAMA is a 6-seat campervan built on the Toyota Hiace H200. Handcrafted in Tokyo, delivered to Australia from ~$69,000 driveaway. Pop top optional.',
  url: '/fit-outs/tama',
})
export const dynamic = 'force-dynamic'

export default async function TamaPage() {
  const [jpyRate, contentRes] = await Promise.all([
    getJpyRate(),
    createAdminClient().from('page_content').select('content_key, value').eq('page_slug', 'tama'),
  ])
  const fitoutAud = tamaConversionAud(jpyRate)
  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  return <TamaClient fitoutAud={fitoutAud} content={content} />
}
