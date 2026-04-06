/**
 * NINJA search with minimal form fields — find what's required
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  }
} catch {}

const BASE = 'https://www.ninja-cartrade.jp'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
let _sessionCookie = ''

function absorbCookies(res: Response) {
  const existing = new Map<string, string>()
  for (const pair of _sessionCookie.split('; ')) {
    const [k, ...v] = pair.split('=')
    if (k?.trim()) existing.set(k.trim(), v.join('='))
  }
  const setCookies = res.headers.getSetCookie?.() ?? []
  for (const sc of setCookies) {
    const [pair] = sc.split(';')
    const [k, ...v] = pair.split('=')
    if (k?.trim()) existing.set(k.trim(), v.join('=').trim())
  }
  if (setCookies.length === 0) {
    const raw = res.headers.get('set-cookie') || ''
    for (const part of raw.split(/,(?=\s*\w+=)/)) {
      const [pair] = part.split(';')
      const [k, ...v] = pair.split('=')
      if (k?.trim()) existing.set(k.trim(), v.join('=').trim())
    }
  }
  _sessionCookie = Array.from(existing.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}

async function ninjaFetch(url: string, form?: Record<string, string>, extraHeaders?: Record<string, string>): Promise<{ text: string; status: number }> {
  const headers: Record<string, string> = { 'User-Agent': UA, Cookie: _sessionCookie, ...extraHeaders }
  const init: RequestInit = { headers, redirect: 'manual' }
  if (form) {
    init.method = 'POST'
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    init.body = new URLSearchParams(form).toString()
  }
  let res = await fetch(url, init)
  absorbCookies(res)
  let redirects = 0
  while (res.status >= 300 && res.status < 400 && redirects < 5) {
    const loc = res.headers.get('location')
    if (!loc) break
    await res.text()
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await fetch(ru, { headers: { 'User-Agent': UA, Cookie: _sessionCookie, Referer: url }, redirect: 'manual' })
    absorbCookies(res)
    redirects++
  }
  return { text: await res.text(), status: res.status }
}

function extractFormFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const re = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi
  let m
  while ((m = re.exec(html)) !== null) fields[m[1]] = m[2]
  return fields
}

async function doLogin(): Promise<{ loginJson: any; scHtml: string; msHtml: string }> {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!

  // Session
  const s1 = await fetch(`${BASE}/ninja/`, { headers: { 'User-Agent': UA }, redirect: 'manual' })
  absorbCookies(s1); await s1.text()
  const loc = s1.headers.get('location')
  if (loc) {
    const r2 = await fetch(loc.startsWith('http') ? loc : `${BASE}${loc}`, {
      headers: { 'User-Agent': UA, Cookie: _sessionCookie }, redirect: 'manual'
    })
    absorbCookies(r2); await r2.text()
  }

  // Login
  const { text: lt } = await ninjaFetch(`${BASE}/ninja/login.action`,
    { action: 'login', loginId, password, isFlg: '', language: '1' },
    { 'X-Requested-With': 'XMLHttpRequest', Referer: `${BASE}/ninja/` })
  const lj = JSON.parse(lt)
  console.log(`Login: errflg=${lj.errflg} buyerId=${lj.buyerId}`)

  // loginPrimary
  await ninjaFetch(`${BASE}/ninja/login.action`, {
    action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '', token: '',
  })

  // searchcondition
  const { text: scHtml } = await ninjaFetch(`${BASE}/ninja/searchcondition.action`, {
    action: '', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '22', token: '',
  })

  // makersearch
  const scFields = extractFormFields(scHtml)
  scFields['brandGroupingCode'] = '01'
  scFields['bodyType'] = ''
  scFields['cornerSearchCheckCorner'] = ''
  scFields['action'] = 'init'
  const { text: msHtml } = await ninjaFetch(`${BASE}/ninja/makersearch.action`, scFields)

  return { loginJson: lj, scHtml, msHtml }
}

async function main() {
  // Attempt 1: Full fields WITH evaluation
  console.log('=== Attempt 1: Full form fields WITH evaluation ===')
  let { msHtml } = await doLogin()
  console.log(`makersearch: ${msHtml.length} chars`)

  let msFields = extractFormFields(msHtml)
  msFields['carCategoryNo'] = '146'
  msFields['action'] = 'seniSearch'
  msFields['page'] = '1'
  // Keep evaluation this time!
  console.log(`evaluation: ${msFields['evaluation']}`)
  console.log(`Total fields: ${Object.keys(msFields).length}`)

  let { text: sr1, status: s1 } = await ninjaFetch(`${BASE}/ninja/searchresultlist.action`, msFields)
  console.log(`Result: ${s1} ${sr1.length} chars`)
  console.log(`Has cardetail: ${sr1.includes('cardetail')}`)
  console.log(`Has delCarCat: ${sr1.includes('delCarCat')}`)

  if (sr1.length > 0) {
    // Check for JS and listing data
    const jsFiles = sr1.match(/src="([^"]*\.js[^"]*)"/gi) ?? []
    console.log(`JS files: ${jsFiles.length}`)

    // Check for photo/img
    const imgs = sr1.match(/<img[^>]+src="[^"]+"/gi) ?? []
    console.log(`<img> tags: ${imgs.length}`)
    if (imgs.length > 0) console.log(`First img: ${imgs[0]}`)

    // Check for table rows
    const trs = sr1.match(/<tr/gi) ?? []
    console.log(`<tr> tags: ${trs.length}`)

    // Extract all onclick handlers that have parameters
    const paramOnclicks = sr1.match(/onclick="[^"]*\([^)]+\)[^"]*"/gi) ?? []
    console.log(`onclick with params: ${paramOnclicks.length}`)
    for (const oc of paramOnclicks.slice(0, 5)) console.log(`  ${oc}`)
  }

  // Attempt 2: Try with fewer fields — just session, search, and category
  if (s1 === 500 || sr1.length === 0) {
    console.log('\n=== Attempt 2: Login again and try minimal fields ===')
    const result2 = await doLogin()
    msHtml = result2.msHtml
    msFields = extractFormFields(msHtml)

    // Only keep essential fields
    const minFields: Record<string, string> = {
      action: 'seniSearch',
      carCategoryNo: '146',
      page: '1',
      language: msFields['language'] || '1',
      site: msFields['site'] || '2',
      memberCode: msFields['memberCode'] || '',
      branchCode: msFields['branchCode'] || '',
      buyerId: msFields['buyerId'] || '',
      gamenGroup: msFields['gamenGroup'] || '22',
      brandGroupingCode: msFields['brandGroupingCode'] || '01',
      bodyType: msFields['bodyType'] || '',
      token: msFields['token'] || '',
      evaluation: msFields['evaluation'] || '',
    }
    console.log(`Posting ${Object.keys(minFields).length} fields`)
    const { text: sr2, status: s2 } = await ninjaFetch(`${BASE}/ninja/searchresultlist.action`, minFields)
    console.log(`Result: ${s2} ${sr2.length} chars`)
    console.log(`Has cardetail: ${sr2.includes('cardetail')}`)
  }

  // Attempt 3: If still failing, try a GET-style URL for cardetail directly
  console.log('\n=== Attempt 3: Direct cardetail via GET ===')
  // Use a known listing ref (from carListData)
  const { text: detHtml, status: detS } = await ninjaFetch(
    `${BASE}/ninja/cardetail.action?KaijoCode=TK&AuctionCount=1559&BidNo=40341&carKindType=1`
  )
  console.log(`cardetail GET: ${detS} ${detHtml.length} chars`)
  if (detHtml.includes('グレード')) {
    console.log('  SUCCESS! Can access detail pages directly.')
    const grade = detHtml.match(/グレード[^<]*<\/th>\s*<td[^>]*>\s*([^<]+)/is)
    const year = detHtml.match(/年式[^<]*<\/th>\s*<td[^>]*>\s*([^<]+)/is)
    console.log(`  Grade: ${grade?.[1]?.trim()} Year: ${year?.[1]?.trim()}`)
  } else if (detHtml.includes('sessionTimeOut')) {
    console.log('  Session timeout — the searchresultlist 500 killed the session')

    // Try one more login + direct detail access
    console.log('\n=== Attempt 4: Fresh login → direct cardetail ===')
    await doLogin()
    const { text: det2, status: ds2 } = await ninjaFetch(
      `${BASE}/ninja/cardetail.action?KaijoCode=TK&AuctionCount=1559&BidNo=40341&carKindType=1`
    )
    console.log(`cardetail: ${ds2} ${det2.length} chars`)
    if (det2.includes('グレード')) {
      const grade = det2.match(/グレード[^<]*<\/th>\s*<td[^>]*>\s*([^<]+)/is)
      console.log(`  Grade: ${grade?.[1]?.trim()}`)
      console.log(`  Direct cardetail WORKS after login without searchresultlist!`)
      console.log(`\n  CONCLUSION: searchresultlist.action causes a 500 error and kills the session.`)
      console.log(`  But we CAN access cardetail pages directly if we have listing refs.`)
      console.log(`  The carListData from searchcondition has ${(result2.scHtml.match(/carListData/g) || []).length > 0 ? 'some' : 'no'} listing refs.`)

      // Try to get more listing refs — maybe there's an API endpoint
      console.log('\n=== Attempt 5: Try AJAX endpoints for listing search ===')
      for (const endpoint of [
        'searchresultlist.action',
        'searchresult.action',
        'carlist.action',
        'searchCarList.action',
        'getCarList.action',
      ]) {
        const { text: t, status: s } = await ninjaFetch(`${BASE}/ninja/${endpoint}`, {
          action: 'search',
          carCategoryNo: '146',
          brandGroupingCode: '01',
          page: '1',
        }, { 'X-Requested-With': 'XMLHttpRequest' })
        console.log(`  ${endpoint}: ${s} ${t.length} chars ${t.includes('cardetail') ? 'HAS CARDETAIL' : ''} ${t.includes('sessionTimeOut') ? 'TIMEOUT' : ''}`)
        if (s !== 200 || t.includes('sessionTimeOut')) {
          console.log('  Session died, re-logging in...')
          await doLogin()
        }
      }
    }
  }
}

main().catch(console.error)
