/**
 * DREAM DRIVE — Retranslate Draft Listings
 *
 * Fetches all draft dealer listings (Goo-net / Car Sensor) from Supabase
 * and runs them through Claude to translate Japanese fields into English.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json src/scripts/retranslate-drafts.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY in .env.local
 */

import * as fs from 'fs'
import * as path from 'path'

// ---- Load .env.local ----
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  }
  console.log('Loaded .env.local\n')
}

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anthropicKey = process.env.ANTHROPIC_API_KEY

if (!supabaseUrl || !supabaseKey || !anthropicKey) {
  console.error('Missing required env vars:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  if (!anthropicKey) console.error('  - ANTHROPIC_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const anthropic = new Anthropic({ apiKey: anthropicKey })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function translateListing(listing: any): Promise<{
  modelName: string
  grade: string | null
  bodyColour: string | null
  description: string
}> {
  const rawData = listing.raw_data as Record<string, string> | null
  const rawGrade = rawData?.raw_grade ?? listing.grade
  const rawColour = rawData?.raw_colour ?? listing.body_colour
  const modelName = listing.model_name ?? 'TOYOTA HIACE'

  const features = [
    listing.has_nav && 'Navigation system',
    listing.has_leather && 'Leather seats',
    listing.has_sunroof && 'Sunroof',
    listing.has_alloys && 'Alloy wheels',
  ].filter(Boolean).join(', ')

  const prompt = `You are helping list a Japanese import Toyota Hiace van on an Australian car sales website.

Translate and clean up these fields into natural Australian English:
- Model name: ${modelName}
- Grade: ${rawGrade ?? 'unknown'}
- Body colour: ${rawColour ?? 'unknown'}

Also write a short 2-sentence listing description (max 80 words):
Year: ${listing.model_year ?? 'unknown'} | Mileage: ${listing.mileage_km ? listing.mileage_km.toLocaleString() + ' km' : 'unknown'} | Transmission: ${listing.transmission ?? 'unknown'} | Drive: ${listing.drive ?? 'unknown'} | Engine: ${listing.displacement_cc ? listing.displacement_cc + 'cc' : 'unknown'} | Features: ${features || 'none listed'}

Respond ONLY with valid JSON in this exact format:
{
  "modelName": "translated model name",
  "grade": "translated grade or null",
  "bodyColour": "translated colour in English or null",
  "description": "short listing description"
}`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (msg.content[0] as { type: string; text: string }).text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  return JSON.parse(jsonMatch[0])
}

async function main() {
  console.log('Fetching draft dealer listings from Supabase...')

  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'draft')
    .or('source.eq.dealer_goonet,source.eq.dealer_carsensor')

  if (error) {
    console.error('Database error:', error.message)
    process.exit(1)
  }

  if (!listings || listings.length === 0) {
    console.log('No draft dealer listings found.')
    return
  }

  console.log(`Found ${listings.length} draft listing(s) to translate\n`)

  let success = 0
  let failed = 0

  for (const listing of listings) {
    try {
      const result = await translateListing(listing)

      const { error: updateError } = await supabase
        .from('listings')
        .update({
          model_name: result.modelName || listing.model_name,
          grade: result.grade || null,
          body_colour: result.bodyColour || null,
          description: result.description || null,
        })
        .eq('id', listing.id)

      if (updateError) throw new Error(updateError.message)

      console.log(`✓ [${listing.id.slice(0, 8)}] ${listing.model_name}`)
      console.log(`       → ${result.modelName}${result.grade ? ` (${result.grade})` : ''} · ${result.bodyColour ?? ''}`)
      success++
    } catch (e) {
      console.error(`✗ [${listing.id.slice(0, 8)}] ${listing.model_name}: ${e}`)
      failed++
    }

    // 500ms delay between requests to avoid rate limiting
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\nDone — ${success} translated, ${failed} failed`)
}

main()
