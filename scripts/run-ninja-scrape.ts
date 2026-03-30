#!/usr/bin/env npx tsx
/**
 * Run the NINJA auction scraper from your local machine.
 *
 * Usage:
 *   npx tsx scripts/run-ninja-scrape.ts                # scrape → Supabase
 *   npx tsx scripts/run-ninja-scrape.ts --max 10       # limit to 10 listings
 *
 * Filters:
 *   --year-from 2015     # minimum model year
 *   --year-to 2024       # maximum model year
 *   --drive 4WD          # drive type: 2WD or 4WD
 *
 * Example:
 *   npx tsx scripts/run-ninja-scrape.ts --max 10 --year-from 2015 --year-to 2024 --drive 4WD
 *
 * Requirements:
 *   - Playwright + Chromium installed (npx playwright install chromium)
 *   - .env.local with NINJA_LOGIN_ID, NINJA_PASSWORD, and Supabase keys
 */

import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load .env.local BEFORE importing anything else
// (supabase.ts reads env vars at module load time)
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

// Dynamic import so env vars are set before supabase.ts module loads
const { runNinjaScraper } = await import('../src/lib/ninja-scraper')

const args = process.argv.slice(2)
const maxIdx = args.indexOf('--max')
const maxListings = maxIdx >= 0 ? parseInt(args[maxIdx + 1]) : undefined

const yearFromIdx = args.indexOf('--year-from')
const yearFrom = yearFromIdx >= 0 ? parseInt(args[yearFromIdx + 1]) : undefined

const yearToIdx = args.indexOf('--year-to')
const yearTo = yearToIdx >= 0 ? parseInt(args[yearToIdx + 1]) : undefined

const driveIdx = args.indexOf('--drive')
const driveType = driveIdx >= 0 ? (args[driveIdx + 1] as '2WD' | '4WD') : undefined

console.log(`
╔══════════════════════════════════════════╗
║     NINJA Auction Scraper                ║
║     Bare Camper — barecamper.com.au      ║
╚══════════════════════════════════════════╝

Mode:         💾 LIVE (writing to Supabase)
Max listings: ${maxListings ?? 'ALL'}
Filters:      year ${yearFrom ?? 'any'}–${yearTo ?? 'any'}, drive: ${driveType ?? 'any'}
`)

const start = Date.now()

runNinjaScraper({
  maxListings,
  filters: { yearFrom, yearTo, driveType },
  onProgress: (msg) => console.log(msg),
})
  .then((result) => {
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
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Scrape failed:', err)
    process.exit(1)
  })
