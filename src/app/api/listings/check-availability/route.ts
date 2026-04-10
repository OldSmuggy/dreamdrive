export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// ============================================================
// POST /api/listings/check-availability
// Checks source URLs for listings and reports availability.
//
// Body: { ids: string[] }   — listing IDs to check (max 50)
// Returns: { results: { id, source_status, source_url }[] }
//
// source_status values:
//   'live'       — source page still exists and appears active
//   'sold'       — source page shows sold indicators
//   'removed'    — source URL returns 404 / gone
//   'error'      — could not reach the source (timeout, etc)
//   'no_source'  — no source URL stored for this listing
// ============================================================

const SOLD_INDICATORS_JP = [
  '売約済', '成約済', '契約済', 'ご成約',
  'SOLD', 'sold out', '販売終了', '掲載終了',
  'この車両は', '削除されました',
  '在庫なし', '在庫切れ',
]

// NINJA auction-specific: listing removed or session expired
const NINJA_GONE_INDICATORS = [
  'この車輌の情報は', '表示できません', 'loginId',
]

type SourceCheckResult = 'live' | 'sold' | 'removed' | 'error' | 'no_source'

async function checkSourceUrl(url: string, source: string): Promise<SourceCheckResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    // 404 / 410 = listing removed
    if (res.status === 404 || res.status === 410) return 'removed'

    // Non-OK but not a clear removal — report error
    if (!res.ok) return 'error'

    const html = await res.text()

    // NINJA auction: requires login = listing no longer accessible
    if (source === 'auction') {
      for (const indicator of NINJA_GONE_INDICATORS) {
        if (html.includes(indicator)) return 'removed'
      }
    }

    // Check for sold / ended indicators
    const htmlLower = html.toLowerCase()
    for (const indicator of SOLD_INDICATORS_JP) {
      if (html.includes(indicator) || htmlLower.includes(indicator.toLowerCase())) {
        return 'sold'
      }
    }

    // Redirected to a search/listing page (original removed)
    const finalUrl = res.url
    if (
      (url.includes('carsensor.net/usedcar/detail/') && !finalUrl.includes('/detail/')) ||
      (url.includes('goo-net.com/usedcar/spread/') && finalUrl.includes('/usedcar/search/'))
    ) {
      return 'removed'
    }

    // Very short HTML = probably a blank/error page
    if (html.length < 1000) return 'removed'

    return 'live'
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'error'
    return 'error'
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Provide an array of listing IDs' }, { status: 400 })
    }
    if (ids.length > 50) {
      return NextResponse.json({ error: 'Max 50 listings per request' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, source, raw_data')
      .in('id', ids)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Check each listing's source URL
    const results = await Promise.all(
      (listings ?? []).map(async (listing) => {
        const rawData = (listing.raw_data as Record<string, unknown>) ?? {}
        const sourceUrl = (rawData.url as string) ?? null

        if (!sourceUrl) {
          return { id: listing.id, source_status: 'no_source' as SourceCheckResult, source_url: null }
        }

        const status = await checkSourceUrl(sourceUrl, listing.source)

        // Store check result in raw_data
        const updatedRawData = {
          ...rawData,
          source_check: {
            status,
            checked_at: new Date().toISOString(),
          },
        }

        await supabase
          .from('listings')
          .update({ raw_data: updatedRawData })
          .eq('id', listing.id)

        return { id: listing.id, source_status: status, source_url: sourceUrl }
      })
    )

    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
