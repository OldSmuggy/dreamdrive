/**
 * DREAM DRIVE — NINJA Car Trade Scraper
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/scrape-ninja.ts
 *   OR call POST /api/scrape (server-side, cron-triggered)
 *
 * Requires: playwright  (npm install playwright)
 * Requires: NINJA_LOGIN_ID, NINJA_PASSWORD in env
 */

import { chromium } from 'playwright'
import { createAdminClient } from '../src/lib/supabase'

const BASE = 'https://www.ninja-cartrade.jp/ninja'

const EXCLUDED_GRADES = ['DARK PRIME', 'DARK PRIME S', 'DARK PRIME2', 'WELCAB', 'WELCAB WELFARE']

function isExcluded(grade: string | null): boolean {
  if (!grade) return false
  return EXCLUDED_GRADES.some(ex => grade.toUpperCase().includes(ex))
}

async function getJpyAudRate(): Promise<number> {
  // Try to get live rate; fall back to a safe default
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/exchange-rate`)
    const j = await r.json()
    return j.rate ?? 0.0095
  } catch {
    return 0.0095
  }
}

async function scrapeNinja() {
  const supabase = createAdminClient()
  const logEntry = await supabase.from('scrape_logs').insert({ source: 'ninja' }).select('id').single()
  const logId = logEntry.data?.id

  let browser
  let totalFound = 0
  let totalNew   = 0

  try {
    browser = await chromium.launch({ headless: false })
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' })
    const page = await context.newPage()

    // ---- Login ----
    console.log('[ninja] Logging in...')
    await page.goto(`${BASE}/`)
    await page.fill('[name="loginId"]',  process.env.NINJA_LOGIN_ID!)
    await page.fill('[name="password"]', process.env.NINJA_PASSWORD!)
    await page.locator('text=Login').first().click({ timeout: 60000 })
    await page.waitForNavigation({ timeout: 15000 })
    console.log('[ninja] Logged in.')
    const loginHtml = await page.content()
    require('fs').writeFileSync('/tmp/ninja-login.html', loginHtml)
    console.log('[ninja] Login page HTML saved to /tmp/ninja-login.html')
    console.log('[ninja] Current URL:', page.url())

    const jpyToAud = await getJpyAudRate()
    const results: Record<string, unknown>[] = []

    // ---- Paginate search results ----
    for (let pageNum = 1; pageNum <= 3; pageNum++) {
      console.log(`[ninja] Fetching page ${pageNum}...`)
      await page.goto(`${BASE}/makersearch.action`, { waitUntil: 'domcontentloaded' })

      // POST the search form
      await page.evaluate(({ pageNum }) => {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = '/ninja/searchresultlist.action'
        const fields: Record<string, string> = {
          conditionCarCategoryNo: '146,198',
          conditionBrandGroupingCode: '01',
          sortCOL: 'YEAR',
          sortORD: 'DESC',
          hyojiSu: '100',
          listType: '0',
          conditionDriveType_hid: '99',
          conditionSift_hid: '99',
          page: String(pageNum),
        }
        for (const [k, v] of Object.entries(fields)) {
          const input = document.createElement('input')
          input.name = k; input.value = v
          form.appendChild(input)
        }
        document.body.appendChild(form)
        form.submit()
      }, { pageNum })

      await page.waitForLoadState('domcontentloaded')

      // Extract listings from the table rows
      const rows = await page.$$eval('table.list-table tbody tr, .searchResult .item-row, .car-list-item', (els) =>
        els.map(el => ({
          html: el.innerHTML,
          text: el.textContent?.trim() ?? '',
          // Pull data attributes if available
          bidNo:     (el as HTMLElement).dataset['bidno']    ?? '',
          kaijoCode: (el as HTMLElement).dataset['kaijo']    ?? '',
          auctionCount: (el as HTMLElement).dataset['count'] ?? '',
        }))
      ).catch(() => [])

      const html = await page.content()
      require('fs').writeFileSync(`/tmp/ninja-page-${pageNum}.html`, html)
      console.log(`[ninja] Page ${pageNum}: ${rows.length} rows found, HTML saved to /tmp/ninja-page-${pageNum}.html`)

      // For each row, try to get the cardetail link/params
      // This is highly site-specific — adjust selectors as needed
      for (const row of rows) {
        if (!row.text) continue
        // Extract key fields from text (adapt regex to actual HTML structure)
        const yearMatch  = row.text.match(/20\d\d/)
        const scoreMatch = row.text.match(/\b([S6]|[345]\.\d|[345]|R[A]?|X)\b/)
        const priceMatch = row.text.match(/[\d,]{4,}/)

        results.push({
          source: 'auction',
          external_id: row.bidNo || null,
          bid_no: row.bidNo || null,
          kaijo_code: row.kaijoCode || null,
          auction_count: row.auctionCount || null,
          model_name: 'TOYOTA HIACE VAN',  // will be overwritten on detail scrape
          model_year: yearMatch ? parseInt(yearMatch[0]) : null,
          inspection_score: scoreMatch ? scoreMatch[1] : null,
          start_price_jpy: priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : null,
          aud_estimate: priceMatch ? Math.round(parseInt(priceMatch[0].replace(/,/g, '')) * jpyToAud * 100) : null,
          status: 'available',
          scraped_at: new Date().toISOString(),
          raw_data: { text: row.text.substring(0, 500) },
        })
      }

      // Small delay between pages
      await page.waitForTimeout(1500)
    }

    totalFound = results.length
    console.log(`[ninja] Total scraped: ${totalFound}`)

    // ---- Upsert to DB ----
    for (const r of results) {
      if (!r.bid_no) continue  // need a unique identifier
      const grade = (r.grade as string) ?? null
      if (isExcluded(grade)) continue

      const { error } = await supabase.from('listings').upsert(r, { onConflict: 'external_id,source' })
      if (!error) totalNew++
    }

    await supabase.from('scrape_logs').update({
      completed_at: new Date().toISOString(),
      listings_found: totalFound,
      listings_new: totalNew,
      status: 'success',
    }).eq('id', logId)

    console.log(`[ninja] Done. ${totalNew} upserted.`)
  } catch (err) {
    console.error('[ninja] Scrape failed:', err)
    await supabase.from('scrape_logs').update({
      completed_at: new Date().toISOString(),
      status: 'failed',
      error: String(err),
    }).eq('id', logId)
  } finally {
    await browser?.close()
  }
}

// Run directly
scrapeNinja().catch(console.error)
