/**
 * Quick dry-run test of the Playwright NINJA scraper — 3 listings max
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
try {
  const envPath = resolve(process.cwd(), '.env.local')
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0,eq).trim(); const v = t.slice(eq+1).trim(); if (!process.env[k]) process.env[k] = v }
  }
} catch {}

import { runNinjaScraper } from '../src/lib/ninja-scraper'

async function main() {
  console.log('=== NINJA Dry Run (3 listings max) ===\n')
  const result = await runNinjaScraper({
    dryRun: true,
    maxListings: 3,
    onProgress: console.log,
  })
  console.log('\n=== RESULT ===')
  console.log(JSON.stringify(result, null, 2))
}

main().catch(console.error)
