import { createAdminClient } from '@/lib/supabase'
import { getJpyRate } from '@/lib/settings'
import { tamaConversionAud, conversionPriceRange, formatAud } from '@/lib/pricing'
import TamaProductClient from './TamaProductClient'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'TAMA — 6-Seat Family Campervan | Dream Drive',
  description: 'The TAMA converts your Toyota Hiace into a 6-seat people mover with ISOFIX, galley kitchen, walnut countertops, and full electrical. From $106,000.',
}

export default async function TamaPage() {
  const [jpyRate, contentRes] = await Promise.all([
    getJpyRate(),
    createAdminClient().from('page_content').select('content_key, value').eq('page_slug', 'tama-product'),
  ])
  const conversionAud = tamaConversionAud(jpyRate)
  const { low, high } = conversionPriceRange(conversionAud)
  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  return <TamaProductClient conversionAud={conversionAud} low={low} high={high} jpyRate={jpyRate} content={content} />
}
