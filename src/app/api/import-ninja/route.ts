export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api-auth'

function extractField(html: string, label: string): string | null {
  const patterns = [
    new RegExp(`${label}[^<]*</th>\\s*<td[^>]*>([^<]+)<`, 'i'),
    new RegExp(`${label}[^<]*</td>\\s*<td[^>]*>([^<]+)<`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return m[1].trim()
  }
  return null
}

function extractNumber(str: string | null): number | null {
  if (!str) return null
  const n = parseInt(str.replace(/[^\d]/g, ''), 10)
  return isNaN(n) ? null : n
}

function extractPhotos(html: string): string[] {
  const urls: string[] = []
  const mainMatch = html.match(/id="mainPhoto"[^>]*src="([^"]+)"/)
  if (mainMatch) urls.push(mainMatch[1])
  const thumbRe = /class="[^"]*thumb[^"]*"[^>]*src="([^"]+)"/gi
  let m
  while ((m = thumbRe.exec(html)) !== null) {
    const url = m[1]
    if (!urls.includes(url) && !url.includes('noimage')) urls.push(url)
  }
  const photoRe = /src="(https:\/\/[^"]*ninja-cartrade[^"]*\.(jpg|jpeg|png))[^"]*"/gi
  while ((m = photoRe.exec(html)) !== null) {
    const url = m[1]
    if (!urls.includes(url) && !url.includes('noimage')) urls.push(url)
  }
  return urls.slice(0, 7)
}

function parseNinjaUrl(url: string): { KaijoCode: string; AuctionCount: string; BidNo: string } | null {
  try {
    const u = new URL(url)
    const KaijoCode = u.searchParams.get('KaijoCode')
    const AuctionCount = u.searchParams.get('AuctionCount')
    const BidNo = u.searchParams.get('BidNo')
    if (KaijoCode && AuctionCount && BidNo) return { KaijoCode, AuctionCount, BidNo }
  } catch {}
  return null
}

export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  try {
    const { url, sessionCookie } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    if (!sessionCookie) return NextResponse.json({ error: 'No session cookie provided' }, { status: 400 })

    const params = parseNinjaUrl(url)
    if (!params) return NextResponse.json({ error: 'Could not parse NINJA URL' }, { status: 400 })

    const { KaijoCode, AuctionCount, BidNo } = params
    const body = new URLSearchParams({ KaijoCode, AuctionCount, BidNo, carKindType: '1' })

    const res = await fetch('https://www.ninja-cartrade.jp/ninja/cardetail.action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.ninja-cartrade.jp/ninja/searchresultlist.action',
      },
      body: body.toString(),
    })

    if (!res.ok) return NextResponse.json({ error: `NINJA returned HTTP ${res.status}` }, { status: 502 })

    const html = await res.text()

    if (html.includes('loginId') || (html.includes('ログイン') && html.includes('password'))) {
      return NextResponse.json({ error: 'Session expired — please get a fresh cookie' }, { status: 401 })
    }

    const modelName = extractField(html, '車名') || 'TOYOTA HIACE VAN'
    const grade = extractField(html, 'グレード')
    const chassisCode = extractField(html, '型式')
    const yearRaw = extractField(html, '年式')
    const mileageRaw = extractField(html, '走行距離')
    const colourRaw = extractField(html, 'ボディカラー')
    const transRaw = extractField(html, 'ミッション')
    const dispRaw = extractField(html, '排気量')
    const scoreRaw = extractField(html, '評価点')
    const priceRaw = extractField(html, '開始価格')
    const driveRaw = extractField(html, '駆動')
    const auctionDateRaw = extractField(html, '開催日')

    const yearMatch = (yearRaw || '').match(/(\d{4})/)
    const modelYear = yearMatch ? parseInt(yearMatch[1]) : null
    const mileageKm = extractNumber(mileageRaw)
    const displacementCc = extractNumber(dispRaw)
    const startPriceJpy = extractNumber(priceRaw)

    let transmission: 'IA' | 'AT' | 'MT' | null = null
    if (transRaw) {
      if (transRaw.includes('IA') || transRaw.includes('CVT')) transmission = 'IA'
      else if (transRaw.includes('AT')) transmission = 'AT'
      else if (transRaw.includes('MT')) transmission = 'MT'
    }

    let drive: '2WD' | '4WD' | null = null
    if (driveRaw) {
      drive = (driveRaw.includes('4WD') || driveRaw.includes('4×4') || driveRaw.includes('AWD')) ? '4WD' : '2WD'
    }

    const validScores = ['S', '6', '5.5', '5', '4.5', '4', '3.5', '3', 'R', 'RA', 'X']
    const scoreClean = (scoreRaw || '').trim().toUpperCase()
    const inspectionScore = validScores.includes(scoreClean) ? scoreClean : null
    const auctionDate = auctionDateRaw ? auctionDateRaw.replace(/\//g, '-').split(' ')[0] : null
    const bodyColour = colourRaw ? colourRaw.split(/[（(]/)[0].trim() : null
    const photos = extractPhotos(html)
    const cleanModel = grade ? `TOYOTA HIACE ${grade}` : modelName
    const audEstimate = startPriceJpy ? Math.round(startPriceJpy * 0.0095 + 8500) * 100 : null
    const external_id = `${KaijoCode}-${AuctionCount}-${BidNo}`

    const supabase = createAdminClient()
    const { data: existing } = await supabase.from('listings').select('id').eq('external_id', external_id).single()
    if (existing) return NextResponse.json({ error: 'This listing already exists in your database' }, { status: 409 })

    const { data: inserted, error: insertError } = await supabase.from('listings').insert({
      source: 'auction',
      external_id,
      kaijo_code: KaijoCode,
      auction_count: AuctionCount,
      bid_no: BidNo,
      auction_date: auctionDate,
      model_name: cleanModel,
      grade,
      chassis_code: chassisCode,
      model_year: modelYear,
      transmission,
      displacement_cc: displacementCc,
      drive,
      mileage_km: mileageKm,
      inspection_score: inspectionScore,
      body_colour: bodyColour,
      start_price_jpy: startPriceJpy,
      aud_estimate: audEstimate,
      status: 'available',
      has_nav: html.includes('ナビ'),
      has_leather: html.includes('レザー'),
      has_sunroof: html.includes('サンルーフ'),
      has_alloys: html.includes('アルミ'),
      photos,
      raw_data: { url, params },
      scraped_at: new Date().toISOString(),
    }).select().single()

    if (insertError) return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 500 })

    return NextResponse.json({
      success: true,
      listing: {
        id: inserted.id,
        model_name: inserted.model_name,
        model_year: inserted.model_year,
        mileage_km: inserted.mileage_km,
        inspection_score: inserted.inspection_score,
        photos: inserted.photos,
        aud_estimate: inserted.aud_estimate,
      }
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
