/**
 * Car Sensor search scraper.
 * Builds search URLs from filters, paginates through results,
 * fetches each detail page, parses, translates, and inserts as drafts.
 */

import { createAdminClient } from '@/lib/supabase'
import {
  parseCarSensor,
  extractPhotos,
  extractExternalId,
  translateListing,
  FETCH_HEADERS,
  sleep,
} from '@/lib/dealer-parsers'

// ── Filter types ──────────────────────────────────────────────────────────────

export interface DealerSearchFilters {
  model: 'hiace_van' | 'regius_ace'
  yearMin?: number
  yearMax?: number
  priceMin?: number  // yen
  priceMax?: number  // yen
  drive?: '4WD' | '2WD' | 'any'
  fuel?: 'diesel' | 'petrol' | 'any'
  transmission?: 'AT' | 'MT' | 'any'
  maxPages: number   // 1-10
  dryRun: boolean
}

export interface SearchProgress {
  type: 'info' | 'page' | 'listing' | 'skip' | 'error' | 'done'
  message: string
  found?: number
  imported?: number
  skipped?: number
  errors?: number
}

export interface SearchResult {
  found: number
  imported: number
  skipped: number
  errors: number
}

// ── Car Sensor URL builder ────────────────────────────────────────────────────

const MODEL_CODES: Record<string, string> = {
  hiace_van: 's185',
  regius_ace: 's186',
}

export function buildCarSensorUrl(filters: DealerSearchFilters, page: number = 1): string {
  // Path segments
  const segments = ['bTO', MODEL_CODES[filters.model] || 's185']

  // Drive filter as path segment
  if (filters.drive === '4WD') segments.push('kudo4WD1')
  else if (filters.drive === '2WD') segments.push('kudo2WD1')

  const pageSuffix = page === 1 ? 'index.html' : `index${page}.html`
  const basePath = `https://www.carsensor.net/usedcar/${segments.join('/')}/${pageSuffix}`

  // Query parameters
  const params = new URLSearchParams()
  if (filters.yearMin) params.set('YMIN', String(filters.yearMin))
  if (filters.yearMax) params.set('YMAX', String(filters.yearMax))
  if (filters.priceMin) params.set('PMIN', String(filters.priceMin))
  if (filters.priceMax) params.set('PMAX', String(filters.priceMax))
  if (filters.fuel === 'diesel') params.set('FUL', 'D')
  else if (filters.fuel === 'petrol') params.set('FUL', 'G')
  if (filters.transmission === 'AT') params.set('MIS', 'AT')
  else if (filters.transmission === 'MT') params.set('MIS', 'MT')

  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

// ── Search result page parser ─────────────────────────────────────────────────

interface SearchPageResult {
  listingUrls: string[]
  totalResults: number | null
  hasNextPage: boolean
}

function parseSearchPage(html: string): SearchPageResult {
  const listingUrls: string[] = []

  // Car Sensor listing links: /usedcar/detail/XXXXX/
  const detailRe = /href="(\/usedcar\/detail\/[A-Z0-9]+\/?)"[^>]*>/gi
  const seen = new Set<string>()
  let m

  while ((m = detailRe.exec(html)) !== null) {
    const path = m[1].replace(/\/$/, '')
    if (!seen.has(path)) {
      seen.add(path)
      listingUrls.push(`https://www.carsensor.net${path}/`)
    }
  }

  // Try to extract total result count
  let totalResults: number | null = null
  const totalMatch = html.match(/(?:全|該当)\s*<[^>]*>?\s*([\d,]+)\s*件/)
    || html.match(/([\d,]+)\s*件/)
  if (totalMatch) {
    totalResults = parseInt(totalMatch[1].replace(/,/g, ''), 10)
  }

  // Check for next page link
  const hasNextPage = /class="[^"]*next[^"]*"/.test(html) || /次の\d+件/.test(html)

  return { listingUrls, totalResults, hasNextPage }
}

// ── Main scraper orchestrator ─────────────────────────────────────────────────

export async function runDealerSearch(
  filters: DealerSearchFilters,
  onProgress: (p: SearchProgress) => void,
): Promise<SearchResult> {
  const supabase = createAdminClient()
  const result: SearchResult = { found: 0, imported: 0, skipped: 0, errors: 0 }

  const firstUrl = buildCarSensorUrl(filters, 1)
  onProgress({ type: 'info', message: `Search URL: ${firstUrl}` })
  onProgress({ type: 'info', message: `Max pages: ${filters.maxPages} | Dry run: ${filters.dryRun}` })

  // Collect all listing URLs across pages
  const allListingUrls: string[] = []

  for (let page = 1; page <= filters.maxPages; page++) {
    const url = buildCarSensorUrl(filters, page)
    onProgress({ type: 'page', message: `Fetching search page ${page}...` })

    try {
      const res = await fetch(url, { headers: FETCH_HEADERS })
      if (!res.ok) {
        onProgress({ type: 'error', message: `Page ${page}: HTTP ${res.status}` })
        break
      }

      const html = await res.text()
      if (html.length < 2000) {
        onProgress({ type: 'error', message: `Page ${page}: Response too small (${html.length} chars) — may be bot-blocked` })
        break
      }

      const { listingUrls, totalResults, hasNextPage } = parseSearchPage(html)

      if (page === 1 && totalResults !== null) {
        onProgress({ type: 'info', message: `Total results on Car Sensor: ${totalResults}` })
      }

      onProgress({ type: 'page', message: `Page ${page}: found ${listingUrls.length} listings` })
      allListingUrls.push(...listingUrls)

      if (!hasNextPage || listingUrls.length === 0) {
        onProgress({ type: 'info', message: `No more pages after page ${page}` })
        break
      }

      // Polite delay between search pages
      if (page < filters.maxPages) await sleep(500)
    } catch (err) {
      onProgress({ type: 'error', message: `Page ${page} error: ${String(err)}` })
      break
    }
  }

  result.found = allListingUrls.length
  onProgress({ type: 'info', message: `\nTotal listing URLs collected: ${allListingUrls.length}` })

  if (allListingUrls.length === 0) {
    onProgress({ type: 'done', message: 'No listings found matching your filters.' })
    return result
  }

  // Process each listing
  for (let i = 0; i < allListingUrls.length; i++) {
    const listingUrl = allListingUrls[i]
    const externalId = extractExternalId(listingUrl, 'dealer_carsensor')

    // Duplicate check
    const { data: existing } = await supabase
      .from('listings').select('id').eq('external_id', externalId).single()

    if (existing) {
      result.skipped++
      onProgress({
        type: 'skip',
        message: `[${i + 1}/${allListingUrls.length}] Skipped (duplicate): ${externalId}`,
        ...result,
      })
      continue
    }

    try {
      // Fetch detail page
      const detailRes = await fetch(listingUrl, { headers: FETCH_HEADERS })
      if (!detailRes.ok) {
        result.errors++
        onProgress({ type: 'error', message: `[${i + 1}/${allListingUrls.length}] HTTP ${detailRes.status}: ${listingUrl}`, ...result })
        await sleep(300)
        continue
      }

      const html = await detailRes.text()
      if (html.length < 2000) {
        result.errors++
        onProgress({ type: 'error', message: `[${i + 1}/${allListingUrls.length}] Page too small: ${listingUrl}`, ...result })
        await sleep(300)
        continue
      }

      const parsed = parseCarSensor(html)
      const photos = extractPhotos(html, 'dealer_carsensor')

      if (filters.dryRun) {
        result.imported++
        onProgress({
          type: 'listing',
          message: `[${i + 1}/${allListingUrls.length}] DRY RUN: ${parsed.modelName} | ${parsed.modelYear ?? '?'} | ${parsed.mileageKm ? parsed.mileageKm.toLocaleString() + 'km' : '?'} | ¥${parsed.priceJpy?.toLocaleString() ?? '?'} | ${photos.length} photos`,
          ...result,
        })
      } else {
        // Translate
        const translated = await translateListing(parsed)
        const audEstimate = parsed.priceJpy
          ? Math.round(parsed.priceJpy * 0.0095 + 8500) * 100
          : null

        // Insert
        const { error: insertError } = await supabase
          .from('listings')
          .insert({
            source: 'dealer_carsensor',
            external_id: externalId,
            model_name: translated.modelName,
            grade: translated.grade ?? null,
            model_year: parsed.modelYear,
            mileage_km: parsed.mileageKm,
            transmission: parsed.transmission,
            drive: parsed.drive,
            displacement_cc: parsed.displacementCc,
            body_colour: translated.bodyColour,
            description: translated.description || null,
            start_price_jpy: parsed.priceJpy,
            aud_estimate: audEstimate,
            status: 'draft',
            has_nav: parsed.hasNav,
            has_leather: parsed.hasLeather,
            has_sunroof: parsed.hasSunroof,
            has_alloys: parsed.hasAlloys,
            photos,
            raw_data: { url: listingUrl, source: 'dealer_carsensor', raw_grade: parsed.grade, raw_colour: parsed.bodyColour },
            scraped_at: new Date().toISOString(),
          })

        if (insertError) {
          result.errors++
          onProgress({ type: 'error', message: `[${i + 1}/${allListingUrls.length}] DB error: ${insertError.message}`, ...result })
        } else {
          result.imported++
          onProgress({
            type: 'listing',
            message: `[${i + 1}/${allListingUrls.length}] ✓ ${translated.modelName} | ${parsed.modelYear ?? '?'} | ${parsed.drive ?? '?'} | ¥${parsed.priceJpy?.toLocaleString() ?? '?'} | ${photos.length} photos`,
            ...result,
          })
        }
      }

      // Polite delay between detail pages
      await sleep(300)
    } catch (err) {
      result.errors++
      onProgress({ type: 'error', message: `[${i + 1}/${allListingUrls.length}] Error: ${String(err)}`, ...result })
      await sleep(300)
    }
  }

  // Log to scrape_logs
  if (!filters.dryRun) {
    try {
      await supabase.from('scrape_logs').insert({
        source: 'dealer_search_carsensor',
        listings_found: result.found,
        listings_inserted: result.imported,
        status: 'success',
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      })
    } catch {
      // Non-critical
    }
  }

  onProgress({
    type: 'done',
    message: `\n=== COMPLETE ===\nFound: ${result.found} | Imported: ${result.imported} | Skipped: ${result.skipped} | Errors: ${result.errors}`,
    ...result,
  })

  return result
}
