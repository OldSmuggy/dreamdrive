export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { runDealerSearch, type DealerSearchFilters } from '@/lib/dealer-search-scraper'

// ============================================================
// POST /api/dealer-search
// Bulk search + scrape Car Sensor listings by filter.
// Returns Server-Sent Events stream with progress updates.
//
// Body: DealerSearchFilters JSON
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const filters: DealerSearchFilters = {
      model: body.model || 'hiace_van',
      yearMin: body.yearMin ? Number(body.yearMin) : undefined,
      yearMax: body.yearMax ? Number(body.yearMax) : undefined,
      priceMin: body.priceMin ? Number(body.priceMin) : undefined,
      priceMax: body.priceMax ? Number(body.priceMax) : undefined,
      drive: body.drive || 'any',
      fuel: body.fuel || 'any',
      transmission: body.transmission || 'any',
      maxPages: Math.min(Math.max(Number(body.maxPages) || 3, 1), 10),
      dryRun: body.dryRun === true,
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          const result = await runDealerSearch(filters, (progress) => {
            send({ ...progress })
          })

          send({ type: 'complete', result })
        } catch (err) {
          send({ type: 'error', message: `Fatal error: ${String(err)}` })
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
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
