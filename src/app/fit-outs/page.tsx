import { createAdminClient } from '@/lib/supabase'
import FitOutsClient from './FitOutsClient'

export const metadata = { title: 'Fit-Outs | Dream Drive' }
export const dynamic = 'force-dynamic'

export default async function FitOutsPage() {
  const contentRes = await createAdminClient()
    .from('page_content')
    .select('content_key, value')
    .eq('page_slug', 'fit-outs')

  const content: Record<string, string> = {}
  for (const row of contentRes.data ?? []) content[row.content_key] = row.value ?? ''

  return <FitOutsClient content={content} />
}
