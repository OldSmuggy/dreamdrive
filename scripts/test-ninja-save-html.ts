/**
 * Save the NINJA search result HTML and all JS files for analysis
 */
import { readFileSync, writeFileSync } from 'fs'
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

async function main() {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!

  // Step 1: Session
  const s1 = await fetch(`${BASE}/ninja/`, { headers: { 'User-Agent': UA }, redirect: 'manual' })
  absorbCookies(s1); await s1.text()
  const loc = s1.headers.get('location')
  if (loc) {
    const r2 = await fetch(loc.startsWith('http') ? loc : `${BASE}${loc}`, {
      headers: { 'User-Agent': UA, Cookie: _sessionCookie }, redirect: 'manual'
    })
    absorbCookies(r2); await r2.text()
  }
  console.log(`Cookie: ${_sessionCookie.substring(0, 60)}...`)

  // Step 2: Login
  const { text: loginText } = await ninjaFetch(`${BASE}/ninja/login.action`,
    { action: 'login', loginId, password, isFlg: '', language: '1' },
    { 'X-Requested-With': 'XMLHttpRequest' })
  const lj = JSON.parse(loginText)
  console.log(`Login: errflg=${lj.errflg}`)

  // Step 3: loginPrimary
  await ninjaFetch(`${BASE}/ninja/login.action`, {
    action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '', token: '',
  })

  // Step 4: searchcondition
  const { text: scHtml, status: scS } = await ninjaFetch(`${BASE}/ninja/searchcondition.action`, {
    action: '', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '22', token: '',
  })
  console.log(`searchcondition: ${scS} ${scHtml.length} chars`)

  // Step 5: makersearch
  const scFields = extractFormFields(scHtml)
  scFields['brandGroupingCode'] = '01'
  scFields['bodyType'] = ''
  scFields['cornerSearchCheckCorner'] = ''
  scFields['action'] = 'init'
  const { text: msHtml, status: msS } = await ninjaFetch(`${BASE}/ninja/makersearch.action`, scFields)
  console.log(`makersearch: ${msS} ${msHtml.length} chars`)

  // Step 6: searchresultlist
  const msFields = extractFormFields(msHtml)
  msFields['carCategoryNo'] = '146'
  msFields['action'] = 'seniSearch'
  msFields['page'] = '1'
  delete msFields['evaluation']
  const { text: srHtml, status: srS } = await ninjaFetch(`${BASE}/ninja/searchresultlist.action`, msFields)
  console.log(`searchresultlist: ${srS} ${srHtml.length} chars`)

  // Save HTML
  writeFileSync('/tmp/ninja-sr.html', srHtml)
  console.log('Saved /tmp/ninja-sr.html')

  // Extract all external JS files
  const jsFiles: string[] = []
  const jsRe = /src="([^"]*\.js[^"]*)"/gi
  let m
  while ((m = jsRe.exec(srHtml)) !== null) jsFiles.push(m[1])
  console.log(`\nExternal JS files: ${jsFiles.length}`)
  for (const f of jsFiles) console.log(`  ${f}`)

  // Fetch each JS file
  for (const jsPath of jsFiles) {
    const jsUrl = jsPath.startsWith('http') ? jsPath : `${BASE}${jsPath}`
    try {
      const res = await fetch(jsUrl, { headers: { 'User-Agent': UA } })
      const js = await res.text()
      const filename = jsPath.split('/').pop()?.replace(/\?.*/, '') || 'unknown.js'
      writeFileSync(`/tmp/ninja-${filename}`, js)
      console.log(`\n  ${filename} (${js.length} chars)`)

      // Search for key patterns
      if (js.includes('cardetail')) {
        const idx = js.indexOf('cardetail')
        console.log(`    cardetail at: ...${js.substring(Math.max(0, idx - 100), idx + 200).replace(/\s+/g, ' ')}...`)
      }
      if (js.includes('searchresultlist')) {
        let si = -1
        while ((si = js.indexOf('searchresultlist', si + 1)) !== -1) {
          console.log(`    searchresultlist: ...${js.substring(Math.max(0, si - 80), si + 120).replace(/\s+/g, ' ')}...`)
        }
      }
      // Find $.ajax calls
      const ajaxRe = /\$\.ajax\s*\(\s*\{[^}]{0,500}\}/gs
      const ajaxMatches = js.match(ajaxRe)
      if (ajaxMatches) {
        for (const a of ajaxMatches) {
          if (/search|result|list|car/i.test(a)) {
            console.log(`    AJAX: ${a.replace(/\s+/g, ' ').substring(0, 300)}`)
          }
        }
      }
    } catch (err) {
      console.log(`    Error fetching ${jsPath}: ${err}`)
    }
  }

  // Look for inline scripts with AJAX calls
  console.log('\n\n=== Inline scripts with AJAX/fetch ===')
  const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi
  while ((m = scriptRe.exec(srHtml)) !== null) {
    const content = m[1].trim()
    if (content.length > 50 && (/ajax|fetch|result|search|list|car/i.test(content))) {
      console.log(`\n--- Inline script (${content.length} chars) ---`)
      console.log(content.substring(0, 500).replace(/\s+/g, ' '))
    }
  }

  // Also try directly calling cardetail with the carListData entries
  console.log('\n\n=== Testing carListData from searchcondition ===')
  const carListMatch = scHtml.match(/name="carListData"[^>]*value="([^"]*)"/)
  if (carListMatch) {
    const data = carListMatch[1]
    const entries = data.split(',').filter(e => e.trim())
    console.log(`carListData has ${entries.length} entries`)

    for (const entry of entries.slice(0, 3)) {
      const parts = entry.split('ж')
      if (parts.length >= 4) {
        const [carKindType, kaijoCode, auctionCount, bidNo] = parts
        console.log(`\nTesting cardetail: carKindType=${carKindType} KaijoCode=${kaijoCode} AuctionCount=${auctionCount} BidNo=${bidNo}`)
        const { text: detHtml, status: detS } = await ninjaFetch(`${BASE}/ninja/cardetail.action`, {
          KaijoCode: kaijoCode,
          AuctionCount: auctionCount,
          BidNo: bidNo,
          carKindType: carKindType,
        })
        console.log(`  Status: ${detS} HTML: ${detHtml.length} chars`)
        console.log(`  Has grade: ${detHtml.includes('グレード')}`)
        console.log(`  Has photo: ${detHtml.includes('mainPhoto') || detHtml.includes('.jpg')}`)
        if (detHtml.includes('グレード')) {
          const gradeMatch = detHtml.match(/グレード[^<]*<\/th>\s*<td[^>]*>\s*([^<]+)/is)
          console.log(`  Grade: ${gradeMatch?.[1]?.trim() ?? 'not found'}`)
        }
        if (detHtml.includes('sessionTimeOut')) {
          console.log('  >>> SESSION TIMEOUT!')
          break
        }
      }
    }
  }
}

main().catch(console.error)
