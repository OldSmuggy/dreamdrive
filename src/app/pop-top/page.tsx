import { createAdminClient } from '@/lib/supabase'
import PopTopClient from './PopTopClient'

export const metadata = {
  title: 'Pop Top Roof Conversion — From $11,900 | DIY RV Solutions',
  description:
    'Professional fiberglass pop top conversion for Toyota Hiace and more. Standing room in 15 seconds. Fits in your garage. Brisbane factory. 10 business day turnaround.',
}
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
