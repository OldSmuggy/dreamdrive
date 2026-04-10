/**
 * Robust NINJA test — debug login response + try fetching detail pages directly
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

async function ninjaFetch(url: string, form?: Record<string, string>, extraHeaders?: Record<string, string>): Promise<{ text: string; status: number; headers: Headers }> {
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
  const text = await res.text()
  return { text, status: res.status, headers: res.headers }
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
  console.log(`Credentials: ${loginId} / ${password.substring(0, 4)}***`)

  // Step 1: Get session cookie — visit login page
  console.log('\n1. Getting session...')
  const s1 = await fetch(`${BASE}/ninja/`, { headers: { 'User-Agent': UA }, redirect: 'manual' })
  absorbCookies(s1)
  const s1Text = await s1.text()
  console.log(`   /ninja/ status=${s1.status} body=${s1Text.length}`)

  const loc = s1.headers.get('location')
  if (loc) {
    console.log(`   Redirect to: ${loc}`)
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    const r2 = await fetch(ru, { headers: { 'User-Agent': UA, Cookie: _sessionCookie }, redirect: 'manual' })
    absorbCookies(r2)
    const r2Text = await r2.text()
    console.log(`   Follow: status=${r2.status} body=${r2Text.length}`)

    // Follow any further redirects
    const loc2 = r2.headers.get('location')
    if (loc2) {
      console.log(`   Redirect2 to: ${loc2}`)
      const ru2 = loc2.startsWith('http') ? loc2 : `${BASE}${loc2}`
      const r3 = await fetch(ru2, { headers: { 'User-Agent': UA, Cookie: _sessionCookie }, redirect: 'manual' })
      absorbCookies(r3)
      await r3.text()
    }
  }
  console.log(`   Cookie: ${_sessionCookie.substring(0, 100)}...`)
  console.log(`   Has JSESSIONID: ${_sessionCookie.includes('JSESSIONID')}`)

  // Step 2: AJAX login
  console.log('\n2. AJAX login...')
  const { text: loginText, status: loginStatus } = await ninjaFetch(
    `${BASE}/ninja/login.action`,
    { action: 'login', loginId, password, isFlg: '', language: '1' },
    { 'X-Requested-With': 'XMLHttpRequest', Referer: `${BASE}/ninja/` }
  )
  console.log(`   Status: ${loginStatus}`)
  console.log(`   Response: ${loginText.substring(0, 500)}`)

  let lj: any
  try { lj = JSON.parse(loginText) } catch {
    console.error('Login response not JSON!')
    return
  }
  console.log(`   errflg=${lj.errflg} buyerId=${lj.buyerId} memberCode=${lj.memberCode}`)

  if (lj.errflg === '1') {
    console.error('Login REJECTED!')
    return
  }

  // Step 3: loginPrimary
  console.log('\n3. loginPrimary...')
  const { text: lpText, status: lpStatus } = await ninjaFetch(`${BASE}/ninja/login.action`, {
    action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '', token: '',
  })
  console.log(`   Status: ${lpStatus} Body: ${lpText.length} chars`)
  console.log(`   Cookie after: ${_sessionCookie.substring(0, 100)}...`)

  // Step 4: searchcondition
  console.log('\n4. searchcondition...')
  const { text: scHtml, status: scS } = await ninjaFetch(`${BASE}/ninja/searchcondition.action`, {
    action: '', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '22', token: '',
  })
  console.log(`   Status: ${scS} Body: ${scHtml.length}`)
  console.log(`   Has sessionTimeOut: ${scHtml.includes('sessionTimeOut')}`)
  console.log(`   Has brandGroupingCode: ${scHtml.includes('brandGroupingCode')}`)

  if (scHtml.length < 500 || scHtml.includes('sessionTimeOut')) {
    console.error('Search session failed!')
    console.log(`   Body: ${scHtml.substring(0, 500)}`)
    return
  }

  // Step 5: makersearch
  console.log('\n5. makersearch...')
  const scFields = extractFormFields(scHtml)
  scFields['brandGroupingCode'] = '01'
  scFields['bodyType'] = ''
  scFields['cornerSearchCheckCorner'] = ''
  scFields['action'] = 'init'
  const { text: msHtml, status: msS } = await ninjaFetch(`${BASE}/ninja/makersearch.action`, scFields)
  console.log(`   Status: ${msS} Body: ${msHtml.length}`)

  // Step 6: searchresultlist
  console.log('\n6. searchresultlist...')
  const msFields = extractFormFields(msHtml)
  msFields['carCategoryNo'] = '146'
  msFields['action'] = 'seniSearch'
  msFields['page'] = '1'
  delete msFields['evaluation']

  // Debug: show key fields being sent
  console.log(`   carCategoryNo: ${msFields['carCategoryNo']}`)
  console.log(`   action: ${msFields['action']}`)
  console.log(`   brandGroupingCode: ${msFields['brandGroupingCode']}`)
  console.log(`   gamenGroup: ${msFields['gamenGroup']}`)
  console.log(`   Total fields: ${Object.keys(msFields).length}`)

  const { text: srHtml, status: srS } = await ninjaFetch(`${BASE}/ninja/searchresultlist.action`, msFields)
  console.log(`   Status: ${srS} Body: ${srHtml.length}`)

  if (srHtml.length > 0) {
    writeFileSync('/tmp/ninja-sr.html', srHtml)
    console.log('   Saved /tmp/ninja-sr.html')

    // Analyze the HTML
    console.log(`   Has HIACE: ${srHtml.includes('HIACE') || srHtml.includes('ハイエース')}`)
    console.log(`   Has cardetail: ${srHtml.includes('cardetail')}`)
    console.log(`   Has delCarCat: ${srHtml.includes('delCarCat')}`)
    console.log(`   Has sessionTimeOut: ${srHtml.includes('sessionTimeOut')}`)

    // Extract all JS files from this page
    const jsFiles: string[] = []
    const jsRe = /src="([^"]*\.js[^"]*)"/gi
    let m
    while ((m = jsRe.exec(srHtml)) !== null) jsFiles.push(m[1])
    console.log(`   External JS: ${jsFiles.length} files`)
    for (const f of jsFiles) console.log(`     ${f}`)

    // Fetch and analyze key JS files
    for (const jsPath of jsFiles) {
      if (!/buyer|common|search|result/i.test(jsPath)) continue
      const jsUrl = jsPath.startsWith('http') ? jsPath : `${BASE}${jsPath}`
      try {
        const res = await fetch(jsUrl, { headers: { 'User-Agent': UA, Cookie: _sessionCookie } })
        const js = await res.text()
        const name = jsPath.split('/').pop()?.split('?')[0] || 'unknown'
        writeFileSync(`/tmp/ninja-${name}`, js)
        console.log(`\n   === ${name} (${js.length} chars) ===`)

        // Find all function definitions
        const funcs = js.match(/function\s+(\w+)/g) ?? []
        const searchFuncs = funcs.filter(f => /search|result|list|car|seni|detail|bid|auction/i.test(f))
        if (searchFuncs.length > 0) console.log(`   Search-related functions: ${searchFuncs.join(', ')}`)

        // Find seniToCardetail or similar
        for (const pattern of ['seniToCardetail', 'searchresultlist', 'cardetail.action', 'seniSearch']) {
          let idx = -1
          while ((idx = js.indexOf(pattern, idx + 1)) !== -1) {
            const context = js.substring(Math.max(0, idx - 200), idx + 300).replace(/\s+/g, ' ')
            console.log(`   ${pattern}: ...${context.substring(context.indexOf(pattern) - 80, context.indexOf(pattern) + 200)}...`)
            break // Just first occurrence
          }
        }
      } catch {}
    }
  } else {
    console.log('   Empty response! The server returned 500.')
    console.log('   This suggests the form fields are wrong or the session state is invalid.')

    // Try a simpler approach: skip makersearch and go directly to search with HIACE keyword
    console.log('\n7. Alternative: Try freeWord search...')
    const altFields = extractFormFields(scHtml)
    altFields['freeWord'] = 'ハイエース'
    altFields['action'] = 'freeWordSearch'
    const { text: fwHtml, status: fwS } = await ninjaFetch(`${BASE}/ninja/searchresultlist.action`, altFields)
    console.log(`   Status: ${fwS} Body: ${fwHtml.length}`)
    if (fwHtml.length > 0) {
      console.log(`   Has cardetail: ${fwHtml.includes('cardetail')}`)
      console.log(`   Has HIACE: ${fwHtml.includes('HIACE')}`)
      writeFileSync('/tmp/ninja-freeword.html', fwHtml)
    }
  }

  // Step 7: Try fetching cardetail pages directly from carListData
  console.log('\n\n=== Testing direct cardetail access ===')
  const carListMatch = scHtml.match(/name="carListData"[^>]*value="([^"]*)"/)
  if (carListMatch) {
    const entries = carListMatch[1].split(',').filter(e => e.trim())
    console.log(`carListData: ${entries.length} entries`)

    for (const entry of entries.slice(0, 3)) {
      const parts = entry.split('ж')
      if (parts.length >= 4) {
        const [ckt, kc, ac, bn] = parts
        console.log(`\n  cardetail: ${kc}/${ac}/${bn}`)
        const { text: dHtml, status: dS } = await ninjaFetch(`${BASE}/ninja/cardetail.action`, {
          KaijoCode: kc, AuctionCount: ac, BidNo: bn, carKindType: ckt,
        })
        console.log(`  Status: ${dS} Body: ${dHtml.length}`)
        if (dHtml.includes('sessionTimeOut')) {
          console.log('  SESSION TIMEOUT - session lost')
          break
        }
        if (dHtml.includes('グレード')) {
          const gradeM = dHtml.match(/グレード[^<]*<\/th>\s*<td[^>]*>\s*([^<]+)/is)
          const yearM = dHtml.match(/年式[^<]*<\/th>\s*<td[^>]*>\s*([^<]+)/is)
          console.log(`  Grade: ${gradeM?.[1]?.trim() ?? '?'} Year: ${yearM?.[1]?.trim() ?? '?'}`)
          writeFileSync('/tmp/ninja-detail.html', dHtml)
        }
      }
    }
  }
}

main().catch(console.error)
