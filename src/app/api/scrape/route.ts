import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// Called by a cron job (e.g. Vercel Cron, Railway scheduler)
// Protect with a shared secret header
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scrape-secret')
  if (secret !== process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fire and forget — actual scrape runs in background
  // For production: use a background job queue (Railway, BullMQ, etc.)
  // Here we log the trigger
  const supabase = createAdminClient()
  await supabase.from('scrape_logs').insert({ source: 'api_trigger', status: 'triggered' })

  // TODO: trigger actual playwright scrape via background worker
  // e.g. await fetch('https://your-scraper-worker.railway.app/scrape', { method: 'POST' })

  return NextResponse.json({ ok: true, message: 'Scrape triggered. Check scrape_logs for status.' })
}

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('scrape_logs').select('*').order('started_at', { ascending: false }).limit(20)
  return NextResponse.json(data)
}
