/**
 * NINJA scraper using form1 approach - ALL requests submit the same form
 * with different action attribute targets
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
let _cookies: Record<string, string> = {}

function cookieStr() {
  return Object.entries(_cookies).map(([k, v]) => `${k}=${v}`).join('; ')
}

function absorbCookies(res: Response) {
  const setCookies = res.headers.getSetCookie?.() ?? []
  for (const sc of setCookies) {
    const [pair] = sc.split(';')
    const [k, ...v] = pair.split('=')
    if (k?.trim()) _cookies[k.trim()] = v.join('=').trim()
  }
  if (setCookies.length === 0) {
    const raw = res.headers.get('set-cookie') || ''
    for (const part of raw.split(/,(?=\s*\w+=)/)) {
      const [pair] = part.split(';')
      const [k, ...v] = pair.split('=')
      if (k?.trim()) _cookies[k.trim()] = v.join('=').trim()
    }
  }
}

async function postForm(url: string, form: Record<string, string>, referer?: string): Promise<{ text: string; status: number }> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Cookie: cookieStr(),
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: referer || `${BASE}/ninja/login.action`,
  }
  let res = await fetch(url, {
    method: 'POST', headers, redirect: 'manual',
    body: new URLSearchParams(form).toString()
  })
  absorbCookies(res)
  let r = 0
  while (res.status >= 300 && res.status < 400 && r < 5) {
    const loc = res.headers.get('location')
    if (!loc) break
    await res.text()
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await fetch(ru, { headers: { 'User-Agent': UA, Cookie: cookieStr(), Referer: url }, redirect: 'manual' })
    absorbCookies(res)
    r++
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
  console.log('=== NINJA Form1 Approach ===\n')

  // Step 1: Get session
  console.log('1. Session...')
  let res = await fetch(`${BASE}/ninja/`, { headers: { 'User-Agent': UA }, redirect: 'manual' })
  absorbCookies(res); await res.text()
  const loc = res.headers.get('location')
  if (loc) {
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await fetch(ru, { headers: { 'User-Agent': UA, Cookie: cookieStr() }, redirect: 'manual' })
    absorbCookies(res); await res.text()
  }
  console.log(`   JSESSIONID: ${_cookies['JSESSIONID']?.substring(0, 15)}`)

  // Step 2: AJAX Login
  console.log('2. Login...')
  res = await fetch(`${BASE}/ninja/login.action`, {
    method: 'POST',
    headers: {
      'User-Agent': UA, Cookie: cookieStr(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE}/ninja/`,
    },
    body: new URLSearchParams({ action: 'login', loginId, password, isFlg: '', language: '1' }).toString(),
    redirect: 'manual',
  })
  absorbCookies(res)
  const loginText = await res.text()
  const lj = JSON.parse(loginText)
  console.log(`   errflg=${lj.errflg} buyerId=${lj.buyerId}`)

  // Step 3: loginPrimary
  console.log('3. loginPrimary...')
  const { text: primaryHtml } = await postForm(`${BASE}/ninja/login.action`, {
    action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '', token: '',
  })
  console.log(`   Body: ${primaryHtml.length} chars`)

  // Extract form1 fields — this is the BASE for all subsequent navigation
  const form1 = extractFormFields(primaryHtml)
  console.log(`   form1 fields: ${Object.keys(form1).length}`)
  console.log(`   form1.action: ${form1['action']}`)
  console.log(`   form1.site: ${form1['site']}`)
  console.log(`   form1.gamenGroup: ${form1['gamenGroup']}`)

  // Step 4: Navigate to searchcondition using form1
  // Like the browser JS: $('#gamenGroup').val("22"); $('#action').val(""); form1.submit() → searchcondition.action
  console.log('\n4. searchcondition (via form1 submit)...')
  form1['gamenGroup'] = '22'
  form1['action'] = ''
  const { text: scHtml, status: scS } = await postForm(
    `${BASE}/ninja/searchcondition.action`, form1, `${BASE}/ninja/login.action`)
  console.log(`   Status: ${scS} Body: ${scHtml.length} chars`)
  console.log(`   Has brandGroupingCode: ${scHtml.includes('brandGroupingCode')}`)
  console.log(`   Has sessionTimeOut: ${scHtml.includes('sessionTimeOut')}`)

  if (scHtml.includes('sessionTimeOut') || scHtml.length < 500) {
    console.error('Session failed!')
    return
  }

  // Now extract form fields from searchcondition page (this is form2 on that page)
  const scForm = extractFormFields(scHtml)
  console.log(`   scForm fields: ${Object.keys(scForm).length}`)

  // Step 5: makersearch — select Toyota (brandGroupingCode=01)
  console.log('\n5. makersearch (select Toyota)...')
  scForm['brandGroupingCode'] = '01'
  scForm['bodyType'] = ''
  scForm['cornerSearchCheckCorner'] = ''
  scForm['action'] = 'init'
  const { text: msHtml, status: msS } = await postForm(
    `${BASE}/ninja/makersearch.action`, scForm, `${BASE}/ninja/searchcondition.action`)
  console.log(`   Status: ${msS} Body: ${msHtml.length} chars`)

  // Step 6: searchresultlist — select HIACE VAN (146)
  console.log('\n6. searchresultlist (HIACE VAN)...')
  const msForm = extractFormFields(msHtml)
  msForm['carCategoryNo'] = '146'
  msForm['action'] = 'seniSearch'
  msForm['page'] = '1'
  // DON'T delete evaluation this time
  console.log(`   evaluation: ${msForm['evaluation']}`)
  console.log(`   Total fields: ${Object.keys(msForm).length}`)

  const { text: srHtml, status: srS } = await postForm(
    `${BASE}/ninja/searchresultlist.action`, msForm, `${BASE}/ninja/makersearch.action`)
  console.log(`   Status: ${srS} Body: ${srHtml.length} chars`)

  if (srHtml.length > 0) {
    writeFileSync('/tmp/ninja-sr-form1.html', srHtml)
    console.log(`   Has cardetail: ${srHtml.includes('cardetail')}`)
    console.log(`   Has HIACE: ${srHtml.includes('HIACE') || srHtml.includes('ハイエース')}`)
    console.log(`   Has delCarCat: ${srHtml.includes('delCarCat')}`)
    console.log(`   Has table: ${srHtml.includes('<table')}`)

    // Now look for listing data in this page
    const srForm = extractFormFields(srHtml)
    console.log(`   srForm fields: ${Object.keys(srForm).length}`)

    // Check for carListData
    const cldMatch = srHtml.match(/carListData[^"]*value="([^"]+)"/)
    if (cldMatch) {
      const entries = cldMatch[1].split(',').filter(e => e.trim())
      console.log(`   carListData: ${entries.length} entries`)
      for (const e of entries.slice(0, 5)) {
        const parts = e.split('ж')
        console.log(`     ${parts.join(' | ')}`)
      }
    }

    // Try to navigate to a cardetail using form2 from searchresultlist
    // The panCarDetail function: action=search, form1.action=cardetail.action
    console.log('\n7. cardetail from searchresultlist form...')
    srForm['action'] = 'search'
    srForm['KaijoCode'] = 'TK'
    srForm['AuctionCount'] = '1559'
    srForm['BidNo'] = '40341'
    srForm['carKindType'] = '1'
    const { text: detHtml, status: detS } = await postForm(
      `${BASE}/ninja/cardetail.action`, srForm, `${BASE}/ninja/searchresultlist.action`)
    console.log(`   Status: ${detS} Body: ${detHtml.length} chars`)
    console.log(`   Has grade: ${detHtml.includes('グレード')}`)
    if (detHtml.length > 0 && detHtml.length < 5000) {
      console.log(`   Snippet: ${detHtml.substring(0, 300).replace(/\s+/g, ' ')}`)
    }
  } else {
    console.log('   Empty response (500)')

    // Try cardetail directly from form1 on the primary page
    console.log('\n7. cardetail from form1 (loginPrimary page)...')
    form1['action'] = 'search'
    form1['KaijoCode'] = 'TK'
    form1['AuctionCount'] = '1559'
    form1['BidNo'] = '40341'
    form1['carKindType'] = '1'
    const { text: detHtml, status: detS } = await postForm(
      `${BASE}/ninja/cardetail.action`, form1, `${BASE}/ninja/login.action`)
    console.log(`   Status: ${detS} Body: ${detHtml.length} chars`)
    console.log(`   Has grade: ${detHtml.includes('グレード')}`)
    if (detHtml.length > 0) {
      console.log(`   Has sessionTimeOut: ${detHtml.includes('sessionTimeOut')}`)
      if (detHtml.length < 5000) {
        console.log(`   Body: ${detHtml.substring(0, 500).replace(/\s+/g, ' ')}`)
      } else {
        // Success!
        writeFileSync('/tmp/ninja-detail.html', detHtml)
        console.log('   Saved /tmp/ninja-detail.html')
        const grade = detHtml.match(/グレード[^<]*<\/th>\s*<td[^>]*>\s*([^<]+)/is)
        const year = detHtml.match(/年式[^<]*<\/th>\s*<td[^>]*>\s*([^<]+)/is)
        console.log(`   Grade: ${grade?.[1]?.trim()} Year: ${year?.[1]?.trim()}`)
      }
    }
  }
}

main().catch(console.error)
