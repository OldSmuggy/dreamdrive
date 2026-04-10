import { createAdminClient } from '@/lib/supabase'
import PopTopClient from './PopTopClient'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Pop Top & Hi-Top Roof Conversions | Bare Camper',
  description: 'Professional fiberglass pop top and hi-top roof conversions for Toyota Hiace H200 and 300 Series. $13,090 installed. 10 business day turnaround. Brisbane factory.',
  url: '/pop-top',
})
export const dynamic = 'force-dynamic'

export default async function PopTopPage() {
  const contentRes = await createAdminClient()
    .from('page_content')
    .select('content_key, value')
    .eq('page_slug', 'pop-top')

  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  return <PopTopClient content={content} />
}
