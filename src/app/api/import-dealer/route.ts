import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

// ============================================================
// POST /api/import-dealer
// Scrapes a single listing from goo-net.com or carsensor.net
// and inserts it into the listings table.
//
// Body: { url: string }
// No auth cookie needed — these are public pages.
// ============================================================

type DealerSource = 'dealer_goonet' | 'dealer_carsensor'

function detectSource(url: string): DealerSource | null {
  if (url.includes('goo-net.com')) return 'dealer_goonet'
  if (url.includes('carsensor.net')) return 'dealer_carsensor'
  return null
}

function extractExternalId(url: string, source: DealerSource): string {
  if (source === 'dealer_goonet') {
    // https://www.goo-net.com/usedcar/spread/goo/16/700070002030260213001.html
    const m = url.match(/\/(\d{10,})\.html/)
    if (m) return `goo-${m[1]}`
  }
  if (source === 'dealer_carsensor') {
    // https://www.carsensor.net/usedcar/detail/HR0202697143/
    const m = url.match(/\/detail\/([A-Z0-9]+)\/?/)
    if (m) return `cs-${m[1]}`
  }
  return `dealer-${Date.now()}`
}

// Try multiple HTML patterns to extract a labelled field
function extractField(html: string, ...labels: string[]): string | null {
  for (const label of labels) {
    const patterns = [
      new RegExp(`${label}[^<]*</th>\\s*<td[^>]*>\\s*([^<\\n]+)`, 'i'),
      new RegExp(`${label}[^<]*</dt>\\s*<dd[^>]*>\\s*([^<\\n]+)`, 'i'),
      new RegExp(`${label}[^<]*</td>\\s*<td[^>]*>\\s*([^<\\n]+)`, 'i'),
      new RegExp(`${label}[：:][^>]*?>([^<]+)<`, 'i'),
    ]
    for (const re of patterns) {
      const m = html.match(re)
      if (m) {
        const val = m[1].trim().replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
        if (val && val !== '-' && val !== '－') return val
      }
    }
  }
  return null
}

function extractNumber(str: string | null): number | null {
  if (!str) return null
  const n = parseInt(str.replace(/[^\d]/g, ''), 10)
  return isNaN(n) ? null : n
}

// Parse Japanese yen prices: "298万円", "1,280万円", "2,980,000円" → integer yen
// Returns null for POA ("応談", "お問い合わせ")
function parseJpyPrice(html: string): number | null {
  // POA indicators — check before trying to parse a number
  if (/応談|価格応談|お問い合わせ/.test(html.slice(0, 5000))) {
    // Only treat as POA if there's genuinely no price number nearby
    // Fall through and try to parse anyway; if no match we return null below
  }

  // Man-en (万円) format — handles "298万円", "1,280万円", "121.8万円"
  // The number before 万 can have commas (e.g. 1,280) or a decimal (121.8)
  const manMatch = html.match(/([\d,]+(?:\.\d+)?)\s*万円/)
  if (manMatch) {
    const num = parseFloat(manMatch[1].replace(/,/g, ''))
    if (!isNaN(num) && num > 0) return Math.round(num * 10000)
  }

  // Full digit format: "2,980,000円"
  const yenMatch = html.match(/([1-9]\d{0,2}(?:,\d{3}){1,4})円/)
  if (yenMatch) return parseInt(yenMatch[1].replace(/,/g, ''), 10)

  return null
}

// Extract dealer/seller notes from the HTML
function extractSellerNotes(html: string): string | null {
  // Goo-net: 販売店コメント section
  // Car Sensor: 販売店からのコメント or コメント
  const patterns = [
    /販売店コメント[^<]*<\/[^>]+>\s*<[^>]+>\s*([^<]{20,500})/i,
    /コメント[^<]*<\/th>\s*<td[^>]*>\s*([^<]{20,500})/i,
    /コメント[^<]*<\/dt>\s*<dd[^>]*>\s*([^<]{20,500})/i,
    /seller.comment[^>]*>\s*([^<]{20,500})/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) {
      const text = m[1].trim().replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
      if (text.length > 15) return text.slice(0, 500)
    }
  }
  return null
}

function parseTransmission(raw: string | null): 'IA' | 'AT' | 'MT' | null {
  if (!raw) return null
  if (raw.includes('IA') || raw.includes('CVT') || raw.includes('無段変速')) return 'IA'
  if (raw.includes('AT') || raw.includes('自動')) return 'AT'
  if (raw.includes('MT') || raw.includes('手動')) return 'MT'
  return null
}

function parseDrive(raw: string | null): '2WD' | '4WD' | null {
  if (!raw) return null
  return (raw.includes('4WD') || raw.includes('4×4') || raw.includes('AWD') || raw.includes('四輪')) ? '4WD' : '2WD'
}

// Extract photos — tries src and data-src (lazy-loaded images)
function extractPhotos(html: string, source: DealerSource): string[] {
  const urls = new Set<string>()
  const domainHint = source === 'dealer_goonet' ? 'goo-net\\|carview\\|goo-net\\|cdn\\.goo' : 'carsensor'
  const attrs = ['src', 'data-src', 'data-original', 'data-lazy-src']

  for (const attr of attrs) {
    const re = new RegExp(`${attr}="(https?://[^"]*\\.(?:jpg|jpeg|png))"`, 'gi')
    let m
    while ((m = re.exec(html)) !== null) {
      const u = m[1]
      if (
        !u.includes('noimage') && !u.includes('no-image') &&
        !u.includes('/icon') && !u.includes('/logo') &&
        !u.includes('/banner') && !u.includes('spacer') &&
        (u.includes('goo-net') || u.includes('carsensor') || u.includes('carview') ||
         u.includes('gazoo') || u.includes('toyota') || u.includes('cdn'))
      ) {
        urls.add(u)
      }
    }
  }

  return Array.from(urls).slice(0, 10)
}

// ---------- Goo-net parser ----------
function parseGooNet(html: string) {
  // Model name: try h1 first, then title
  let modelName = 'TOYOTA HIACE VAN'
  const h1 = html.match(/<h1[^>]*>([^<]*(?:HIACE|ハイエース|hiace)[^<]*)<\/h1>/i)
  if (h1) {
    modelName = h1[1].trim().replace(/\s+/g, ' ')
  } else {
    const titleM = html.match(/<title>([^<|]+)/)
    if (titleM) {
      const t = titleM[1].trim().replace(/\s+/g, ' ').split('の中古')[0].split('|')[0].trim()
      if (t) modelName = t
    }
  }

  // Some Goo-net pages show grade separately
  const gradeField = extractField(html, 'グレード', 'グレード名')

  const yearRaw = extractField(html, '年式', '初年度登録', '初度登録')
  const yearMatch = (yearRaw || '').match(/(\d{4})/)
  const modelYear = yearMatch ? parseInt(yearMatch[1]) : null

  const mileageRaw = extractField(html, '走行距離', '走行')
  const mileageKm = extractNumber(mileageRaw)

  const transRaw = extractField(html, 'ミッション', 'AT/MT', 'トランスミッション')
  const dispRaw = extractField(html, '排気量', 'エンジン排気量')
  const driveRaw = extractField(html, '駆動方式', '駆動')
  const colorRaw = extractField(html, 'ボディカラー', 'カラー', '車体色')
  const bodyColour = colorRaw ? colorRaw.split(/[（(]/)[0].trim() : null

  const priceJpy = parseJpyPrice(html)
  const sellerNotes = extractSellerNotes(html)

  return {
    modelName: gradeField ? `TOYOTA HIACE ${gradeField}` : modelName,
    grade: gradeField,
    modelYear,
    mileageKm,
    transmission: parseTransmission(transRaw),
    drive: parseDrive(driveRaw),
    displacementCc: extractNumber(dispRaw),
    bodyColour,
    priceJpy,
    sellerNotes,
    hasNav: html.includes('ナビ') || html.includes('カーナビ'),
    hasLeather: html.includes('レザー') || html.includes('本革'),
    hasSunroof: html.includes('サンルーフ') || html.includes('ムーンルーフ'),
    hasAlloys: html.includes('アルミ'),
  }
}

// ---------- Car Sensor parser ----------
function parseCarSensor(html: string) {
  let modelName = 'TOYOTA HIACE VAN'
  const h1 = html.match(/<h1[^>]*>([^<]*(?:HIACE|ハイエース|hiace)[^<]*)<\/h1>/i)
  if (h1) {
    modelName = h1[1].trim().replace(/\s+/g, ' ')
  } else {
    const titleM = html.match(/<title>([^<|]+)/)
    if (titleM) {
      const t = titleM[1].trim().replace(/\s+/g, ' ').split('の中古')[0].split('|')[0].trim()
      if (t) modelName = t
    }
  }

  const gradeField = extractField(html, 'グレード', 'グレード名', '車両グレード')

  const yearRaw = extractField(html, '年式', '初年度登録', '初度登録')
  const yearMatch = (yearRaw || '').match(/(\d{4})/)
  const modelYear = yearMatch ? parseInt(yearMatch[1]) : null

  const mileageRaw = extractField(html, '走行距離', '走行')
  const mileageKm = extractNumber(mileageRaw)

  const transRaw = extractField(html, 'ミッション', 'AT/MT', 'トランスミッション')
  const dispRaw = extractField(html, '排気量', 'エンジン排気量', 'エンジン')
  const driveRaw = extractField(html, '駆動方式', '駆動', '4WD/2WD')
  const colorRaw = extractField(html, 'ボディカラー', 'カラー', '車体色', '色')
  const bodyColour = colorRaw ? colorRaw.split(/[（(]/)[0].trim() : null

  const priceJpy = parseJpyPrice(html)
  const sellerNotes = extractSellerNotes(html)

  return {
    modelName: gradeField ? `TOYOTA HIACE ${gradeField}` : modelName,
    grade: gradeField,
    modelYear,
    mileageKm,
    transmission: parseTransmission(transRaw),
    drive: parseDrive(driveRaw),
    displacementCc: extractNumber(dispRaw),
    bodyColour,
    priceJpy,
    sellerNotes,
    hasNav: html.includes('ナビ') || html.includes('カーナビ'),
    hasLeather: html.includes('レザー') || html.includes('本革'),
    hasSunroof: html.includes('サンルーフ') || html.includes('ムーンルーフ'),
    hasAlloys: html.includes('アルミ'),
  }
}

// ---------- AI Translation ----------
async function translateListing(parsed: {
  modelName: string
  grade: string | null
  bodyColour: string | null
  mileageKm: number | null
  modelYear: number | null
  transmission: string | null
  drive: string | null
  displacementCc: number | null
  priceJpy: number | null
  sellerNotes: string | null
  hasNav: boolean
  hasLeather: boolean
  hasSunroof: boolean
  hasAlloys: boolean
}): Promise<{ modelName: string; grade: string | null; bodyColour: string | null; description: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { modelName: parsed.modelName, grade: parsed.grade, bodyColour: parsed.bodyColour, description: '' }
  }

  try {
    const client = new Anthropic({ apiKey })
    const features = [
      parsed.hasNav && 'Navigation system',
      parsed.hasLeather && 'Leather seats',
      parsed.hasSunroof && 'Sunroof',
      parsed.hasAlloys && 'Alloy wheels',
    ].filter(Boolean).join(', ')

    const notesSection = parsed.sellerNotes
      ? `\nDealer notes (Japanese — use for description context):\n"${parsed.sellerNotes}"`
      : ''

    const prompt = `You are helping list a Japanese import Toyota Hiace van on an Australian car sales website.

Translate and clean up these fields into natural Australian English:
- Model name: ${parsed.modelName}
- Grade: ${parsed.grade ?? 'unknown'}
- Body colour: ${parsed.bodyColour ?? 'unknown'}

Also write a short 2-sentence listing description (max 80 words) for this van using these specs:
Year: ${parsed.modelYear ?? 'unknown'} | Mileage: ${parsed.mileageKm ? parsed.mileageKm.toLocaleString() + ' km' : 'unknown'} | Transmission: ${parsed.transmission ?? 'unknown'} | Drive: ${parsed.drive ?? 'unknown'} | Engine: ${parsed.displacementCc ? parsed.displacementCc + 'cc' : 'unknown'} | Features: ${features || 'none listed'} | Price: ${parsed.priceJpy ? '¥' + parsed.priceJpy.toLocaleString() : 'unknown'}${notesSection}

Respond ONLY with valid JSON in this exact format:
{
  "modelName": "translated model name",
  "grade": "translated grade or null",
  "bodyColour": "translated colour in English or null",
  "description": "short listing description"
}`

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        modelName: result.modelName || parsed.modelName,
        grade: result.grade || null,
        bodyColour: result.bodyColour || null,
        description: result.description || '',
      }
    }
  } catch {
    // Fall through to raw values
  }

  return { modelName: parsed.modelName, grade: parsed.grade, bodyColour: parsed.bodyColour, description: '' }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url?.trim()) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    const source = detectSource(url)
    if (!source) {
      return NextResponse.json(
        { error: 'URL must be from goo-net.com or carsensor.net' },
        { status: 400 }
      )
    }

    const external_id = extractExternalId(url, source)

    // Duplicate check
    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('listings').select('id').eq('external_id', external_id).single()
    if (existing) {
      return NextResponse.json(
        { error: 'This listing is already in your database' },
        { status: 409 }
      )
    }

    // Fetch the public page
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
        'Cache-Control': 'no-cache',
      },
    })

    if (!pageRes.ok) {
      return NextResponse.json(
        { error: `Site returned HTTP ${pageRes.status}` },
        { status: 502 }
      )
    }

    const html = await pageRes.text()

    // Check for JS-only / bot-blocked pages
    if (html.length < 2000 || (html.includes('<script') && !html.includes('<table') && !html.includes('<div'))) {
      return NextResponse.json(
        { error: 'Page appears to require JavaScript or is bot-protected. Try the manual Add Listing form instead.' },
        { status: 422 }
      )
    }

    const parsed = source === 'dealer_goonet'
      ? parseGooNet(html)
      : parseCarSensor(html)

    const photos = extractPhotos(html, source)
    const audEstimate = parsed.priceJpy
      ? Math.round(parsed.priceJpy * 0.0095 + 8500) * 100
      : null

    // Translate Japanese fields and generate English description
    const translated = await translateListing(parsed)

    const { data: inserted, error: insertError } = await supabase
      .from('listings')
      .insert({
        source,
        external_id,
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
        raw_data: { url, source, raw_grade: parsed.grade, raw_colour: parsed.bodyColour },
        scraped_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      listing: {
        id: inserted.id,
        model_name: inserted.model_name,
        model_year: inserted.model_year,
        mileage_km: inserted.mileage_km,
        photos: inserted.photos,
        aud_estimate: inserted.aud_estimate,
        source: inserted.source,
        price_jpy: inserted.start_price_jpy,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
