export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { runNinjaScraper } from '@/lib/ninja-scraper'

// Increase timeout for long-running scrape (Vercel Pro: 300s, hobby: 60s)
export const maxDuration = 300

// ============================================================
// POST /api/scrape
// Trigger a full NINJA scrape run.
//
// WHEN TO RUN:
//   USS auctions run on Thursdays (JST). New listings appear from late
//   Thursday and remain available through Tuesday. Run the scraper on
//   Friday or over the weekend after a Thursday auction.
//   Running outside an active auction window will return 0 listings.
//
// MANUAL TRIGGER (production):
//   curl -X POST https://dreamdrive.au/api/scrape \
//     -H "x-scrape-secret: <SCRAPE_SECRET from .env>"
//
//   With options:
//   curl -X POST "https://dreamdrive.au/api/scrape?max=5" \
//     -H "x-scrape-secret: <SCRAPE_SECRET from .env>"
//
// Query params:
//   max=50            — limit number of listings processed (useful for testing)
//
// Auth: x-scrape-secret header must match SCRAPE_SECRET env var.
// If SCRAPE_SECRET is not set the check is skipped (local dev only).
//
// The admin UI trigger is at /admin/scrape.
// ============================================================
export async function POST(req: NextRequest) {
  const secret = process.env.SCRAPE_SECRET
  if (secret) {
    const provided = req.headers.get('x-scrape-secret')
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { searchParams } = req.nextUrl
  const maxParam = searchParams.get('max')
  const maxListings = maxParam ? parseInt(maxParam, 10) : undefined

  // Stream progress back to the client using Server-Sent Events format
  const encoder = new TextEncoder()
  const lines: string[] = []

  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: string) => {
        lines.push(msg)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ msg })}\n\n`))
      }

      try {
        send(`Starting NINJA scrape${maxListings ? ` — max=${maxListings}` : ''}`)

        const result = await runNinjaScraper({
          maxListings,
          onProgress: send,
        })

        send(`\n=== COMPLETE ===`)
        send(`Found: ${result.found}`)
        send(`Processed: ${result.processed}`)
        send(`New inserts: ${result.newInserts}`)
        send(`Duplicates skipped: ${result.duplicates}`)
        send(`Grade-excluded: ${result.skipped}`)
        send(`Errors: ${result.errors}`)
        if (result.logId) send(`Scrape log ID: ${result.logId}`)

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, result: { ...result, sample: result.sample } })}\n\n`
          )
        )
      } catch (err) {
        const msg = String(err)
        send(`FATAL ERROR: ${msg}`)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, error: msg })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ============================================================
// GET /api/scrape
// Return recent scrape logs from Supabase.
// ============================================================
export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('scrape_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
