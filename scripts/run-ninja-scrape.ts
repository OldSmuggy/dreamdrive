#!/usr/bin/env npx tsx
/**
 * Run the NINJA auction scraper from your local machine.
 *
 * Usage:
 *   npx tsx scripts/run-ninja-scrape.ts                # full scrape → Supabase
 *   npx tsx scripts/run-ninja-scrape.ts --dry-run      # preview only, no DB writes
 *   npx tsx scripts/run-ninja-scrape.ts --max 10       # limit to 10 listings
 *   npx tsx scripts/run-ninja-scrape.ts --dry-run --max 5
 *
 * Requirements:
 *   - Playwright + Chromium installed (npx playwright install chromium)
 *   - .env.local with NINJA_LOGIN_ID, NINJA_PASSWORD, and Supabase keys
 */

import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load .env.local
try {
  const envPath = resolve(process.cwd(), '.env.local')
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
} catch {}

import { runNinjaScraper } from '../src/lib/ninja-scraper'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const maxIdx = args.indexOf('--max')
const maxListings = maxIdx >= 0 ? parseInt(args[maxIdx + 1]) : undefined

console.log(`
╔══════════════════════════════════════════╗
║     NINJA Auction Scraper                ║
║     Bare Camper — barecamper.com.au      ║
╚══════════════════════════════════════════╝

Mode:         ${dryRun ? '🔍 DRY RUN (no DB writes)' : '💾 LIVE (writing to Supabase)'}
Max listings: ${maxListings ?? 'ALL'}
`)

const start = Date.now()

runNinjaScraper({
  dryRun,
  maxListings,
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
