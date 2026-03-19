import { createAdminClient } from '@/lib/supabase'
import DiyClient from './DiyClient'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'DIY Your Way — Pop Top, Grid Bed Kit & Base Vans | Bare Camper',
  description: 'Get a professional pop top roof conversion and do the rest yourself. Grid modular bed kit, base vans from Japan, and everything you need for your own build.',
}

export default async function DiyPage() {
  const { data } = await createAdminClient()
    .from('page_content')
    .select('content_key, value')
    .eq('page_slug', 'diy')
  const content: Record<string, string> = {}
  for (const row of data ?? []) content[row.content_key] = row.value ?? ''

  return <DiyClient content={content} />
}
