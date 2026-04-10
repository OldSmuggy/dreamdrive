/**
 * Shared parsers for Goo-net and Car Sensor dealer listings.
 * Used by both the single-URL importer (/api/import-dealer)
 * and the bulk search scraper (/api/dealer-search).
 */

import Anthropic from '@anthropic-ai/sdk'

export type DealerSource = 'dealer_goonet' | 'dealer_carsensor'

export function detectSource(url: string): DealerSource | null {
  if (url.includes('goo-net.com')) return 'dealer_goonet'
  if (url.includes('carsensor.net')) return 'dealer_carsensor'
  return null
}

export function extractExternalId(url: string, source: DealerSource): string {
  if (source === 'dealer_goonet') {
    const m = url.match(/\/(\d{10,})\.html/)
    if (m) return `goo-${m[1]}`
  }
  if (source === 'dealer_carsensor') {
    const m = url.match(/\/detail\/([A-Z0-9]+)\/?/)
    if (m) return `cs-${m[1]}`
  }
  return `dealer-${Date.now()}`
}

// Try multiple HTML patterns to extract a labelled field
export function extractField(html: string, ...labels: string[]): string | null {
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

export function extractNumber(str: string | null): number | null {
  if (!str) return null
  const n = parseInt(str.replace(/[^\d]/g, ''), 10)
  return isNaN(n) ? null : n
}

// Parse Japanese yen prices: "298万円", "1,280万円", "2,980,000円" → integer yen
export function parseJpyPrice(html: string): number | null {
  if (/応談|価格応談|お問い合わせ/.test(html.slice(0, 5000))) {
    // Fall through and try to parse anyway
  }

  const manMatch = html.match(/([\d,]+(?:\.\d+)?)\s*万円/)
  if (manMatch) {
    const num = parseFloat(manMatch[1].replace(/,/g, ''))
    if (!isNaN(num) && num > 0) return Math.round(num * 10000)
  }

  const yenMatch = html.match(/([1-9]\d{0,2}(?:,\d{3}){1,4})円/)
  if (yenMatch) return parseInt(yenMatch[1].replace(/,/g, ''), 10)

  return null
}

export function extractSellerNotes(html: string): string | null {
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

export function parseTransmission(raw: string | null): 'IA' | 'AT' | 'MT' | null {
  if (!raw) return null
  if (raw.includes('IA') || raw.includes('CVT') || raw.includes('無段変速')) return 'IA'
  if (raw.includes('AT') || raw.includes('自動')) return 'AT'
  if (raw.includes('MT') || raw.includes('手動')) return 'MT'
  return null
}

export function parseDrive(raw: string | null): '2WD' | '4WD' | null {
  if (!raw) return null
  return (raw.includes('4WD') || raw.includes('4×4') || raw.includes('AWD') || raw.includes('四輪')) ? '4WD' : '2WD'
}

// Preferred photo categories for Car Sensor smart selection
const PREFERRED_EXTERIOR = ['左斜前', '正面', '左', '右', '右斜後', '後']
const PREFERRED_INTERIOR = ['インパネ全体', '運転席', '後部座席', 'シートアレンジ']
const PREFERRED_CATEGORIES = [...PREFERRED_EXTERIOR, ...PREFERRED_INTERIOR]

function extractCarSensorPhotos(html: string): string[] {
  const photoRe = /<a[^>]*class="[^"]*js-photo[^"]*"[^>]*>/gi
  const photos: { url: string; category: string }[] = []
  let m

  while ((m = photoRe.exec(html)) !== null) {
    const tag = html.slice(m.index, html.indexOf('>', m.index + m[0].length - 1) + 1)
    const hqMatch = tag.match(/data-photohq="(https?:\/\/[^"]+)"/)
    const medMatch = tag.match(/data-photo="(https?:\/\/[^"]+)"/)
    const url = hqMatch?.[1] || medMatch?.[1]
    if (!url) continue

    const catMatch = tag.match(/data-categoryname="([^"]*)"/)
    const category = catMatch?.[1] ?? ''
    photos.push({ url, category })
  }

  if (photos.length === 0) return []

  const selected: string[] = []
  const used = new Set<number>()

  for (const cat of PREFERRED_CATEGORIES) {
    if (selected.length >= 10) break
    const idx = photos.findIndex((p, i) => !used.has(i) && p.category === cat)
    if (idx !== -1) {
      selected.push(photos[idx].url)
      used.add(idx)
    }
  }

  for (let i = 0; i < photos.length && selected.length < 10; i++) {
    if (!used.has(i)) {
      selected.push(photos[i].url)
      used.add(i)
    }
  }

  return selected
}

export function extractPhotos(html: string, source: DealerSource): string[] {
  if (source === 'dealer_carsensor') {
    const csPhotos = extractCarSensorPhotos(html)
    if (csPhotos.length > 0) return csPhotos
  }

  const urls = new Set<string>()
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

// ---------- Parsers ----------

export interface ParsedListing {
  modelName: string
  grade: string | null
  modelYear: number | null
  mileageKm: number | null
  transmission: 'IA' | 'AT' | 'MT' | null
  drive: '2WD' | '4WD' | null
  displacementCc: number | null
  bodyColour: string | null
  priceJpy: number | null
  sellerNotes: string | null
  hasNav: boolean
  hasLeather: boolean
  hasSunroof: boolean
  hasAlloys: boolean
}

export function parseGooNet(html: string): ParsedListing {
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

export function parseCarSensor(html: string): ParsedListing {
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

export async function translateListing(parsed: ParsedListing): Promise<{
  modelName: string
  grade: string | null
  bodyColour: string | null
  description: string
}> {
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
  } catch (err) {
    const msg = String(err).toLowerCase()
    if (msg.includes('credit') || msg.includes('insufficient_balance') || msg.includes('billing')) {
      console.warn('[dealer-parsers] Anthropic API credits unavailable — using raw Japanese values')
    } else {
      console.error('[dealer-parsers] Translation error:', err)
    }
  }

  return { modelName: parsed.modelName, grade: parsed.grade, bodyColour: parsed.bodyColour, description: '' }
}

// ---------- Fetch helpers ----------

export const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
  'Cache-Control': 'no-cache',
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
