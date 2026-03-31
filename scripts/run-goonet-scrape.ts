#!/usr/bin/env npx tsx
/**
 * Run the Goo-net dealer scraper from your local machine.
 *
 * Usage:
 *   npx tsx scripts/run-goonet-scrape.ts                # scrape → Supabase
 *   npx tsx scripts/run-goonet-scrape.ts --max 10       # limit to 10 listings
 *
 * Filters:
 *   --year-from 2015     # minimum model year
 *   --year-to 2024       # maximum model year
 *   --drive 4WD          # drive type: 2WD or 4WD
 *   --max-price 500      # max price in 万円 (e.g. 500 = ¥5,000,000)
 *
 * Example:
 *   npx tsx scripts/run-goonet-scrape.ts --max 10 --year-from 2015 --year-to 2024 --drive 4WD
 *
 * Requirements:
 *   - Playwright + Chromium installed (npx playwright install chromium)
 *   - .env.local with Supabase keys and ANTHROPIC_API_KEY
 */

import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load .env.local BEFORE importing anything else
const envPath = resolve(process.cwd(), '.env.local')
try {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq > 0) {
      const k = t.slice(0, eq).trim()
      const v = t.slice(eq + 1).trim()
      if (!process.env[k]) process.env[k] = v
    }
  }
} catch (e) {
  console.error('⚠️  Could not load .env.local:', e)
}

async function main() {
  const { runGoonetScraper } = await import('../src/lib/goonet-scraper')

  const args = process.argv.slice(2)

  function getArg(flag: string): string | undefined {
    const idx = args.indexOf(flag)
    return idx >= 0 ? args[idx + 1] : undefined
  }

  const maxListings = getArg('--max') ? parseInt(getArg('--max')!) : undefined
  const yearFrom = getArg('--year-from') ? parseInt(getArg('--year-from')!) : undefined
  const yearTo = getArg('--year-to') ? parseInt(getArg('--year-to')!) : undefined
  const driveType = getArg('--drive') as '2WD' | '4WD' | undefined
  const maxPrice = getArg('--max-price') ? parseInt(getArg('--max-price')!) : undefined

  console.log(`
╔══════════════════════════════════════════╗
║     Goo-net Dealer Scraper               ║
║     Bare Camper — barecamper.com.au      ║
╚══════════════════════════════════════════╝

Mode:         💾 LIVE (writing to Supabase)
Max listings: ${maxListings ?? 'ALL'}
Filters:      year ${yearFrom ?? 'any'}–${yearTo ?? 'any'}, drive: ${driveType ?? 'any'}, max price: ${maxPrice ? maxPrice + '万円' : 'any'}
`)

  const start = Date.now()

  const result = await runGoonetScraper({
    maxListings,
    filters: { yearFrom, yearTo, driveType, maxPrice },
    onProgress: (msg) => console.log(msg),
  })

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`
═══════════════════════════════════════════
✅ Scrape complete in ${elapsed}s

   Found:      ${result.found}
   Processed:  ${result.processed}
   New:        ${result.newInserts}
   Duplicates: ${result.duplicates}
   Skipped:    ${result.skipped}
   Errors:     ${result.errors}
═══════════════════════════════════════════
`)
}

main().catch((err) => {
  console.error('\n❌ Scrape failed:', err)
  process.exit(1)
})
