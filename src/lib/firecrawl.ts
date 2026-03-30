/**
 * Firecrawl wrapper for scraping.
 * Returns raw HTML from any URL, handling bot-protection via Firecrawl's
 * headless browser. Falls back to plain fetch if Firecrawl is unavailable.
 */

import Firecrawl from '@mendable/firecrawl-js'

let _client: Firecrawl | null = null

function getClient(): Firecrawl | null {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return null
  if (!_client) _client = new Firecrawl({ apiKey: key })
  return _client
}

export interface ScrapeResult {
  html: string
  source: 'firecrawl' | 'fetch'
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
  'Cache-Control': 'no-cache',
}

/**
 * Scrape a URL, trying Firecrawl first (handles JS rendering + bot protection)
 * and falling back to plain fetch.
 */
export async function scrapeUrl(url: string, options?: {
  /** Extra headers for fetch fallback */
  headers?: Record<string, string>
  /** Skip Firecrawl and use fetch directly */
  fetchOnly?: boolean
  /** Timeout in ms for Firecrawl (default 30000) */
  timeout?: number
}): Promise<ScrapeResult> {
  const client = getClient()

  // Try Firecrawl first
  if (client && !options?.fetchOnly) {
    try {
      const result = await client.scrape(url, {
        formats: ['rawHtml'],
        timeout: options?.timeout ?? 30000,
        waitFor: 2000,
        location: { country: 'JP' },
      })

      if (result.rawHtml && result.rawHtml.length > 500) {
        console.log(`[firecrawl] ✓ Scraped ${url} (${result.rawHtml.length} chars)`)
        return { html: result.rawHtml, source: 'firecrawl' }
      }

      // If rawHtml is empty, try html field
      if (result.html && result.html.length > 500) {
        console.log(`[firecrawl] ✓ Scraped ${url} via html format (${result.html.length} chars)`)
        return { html: result.html, source: 'firecrawl' }
      }

      console.warn(`[firecrawl] Got empty/small response for ${url}, falling back to fetch`)
    } catch (err) {
      console.warn(`[firecrawl] Error scraping ${url}:`, err)
      console.warn('[firecrawl] Falling back to plain fetch')
    }
  }

  // Fallback to plain fetch
  const res = await fetch(url, {
    headers: { ...FETCH_HEADERS, ...options?.headers },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`)
  }

  const html = await res.text()
  console.log(`[fetch] Fetched ${url} (${html.length} chars)`)
  return { html, source: 'fetch' }
}
