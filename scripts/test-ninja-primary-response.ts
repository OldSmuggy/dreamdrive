/**
 * Check what loginPrimary returns and if there's a redirect we need to follow
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
}

async function doFetch(url: string, body?: string, extraHeaders?: Record<string, string>): Promise<{ text: string; status: number }> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Cookie: cookieStr(),
    ...extraHeaders,
  }
  const init: RequestInit = { headers, redirect: 'manual' }
  if (body) {
    init.method = 'POST'
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    init.body = body
  }
  let res = await fetch(url, init)
  absorbCookies(res)
  // Follow redirects
  let r = 0
  while (res.status >= 300 && res.status < 400 && r < 5) {
    const loc = res.headers.get('location')
    if (!loc) break
    await res.text()
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    console.log(`  -> Redirect ${res.status} to ${ru}`)
    res = await fetch(ru, { headers: { 'User-Agent': UA, Cookie: cookieStr(), Referer: url }, redirect: 'manual' })
    absorbCookies(res)
    r++
  }
  return { text: await res.text(), status: res.status }
}

async function main() {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!

  // 1. Session
  console.log('1. Session...')
  const { text: initHtml } = await doFetch(`${BASE}/ninja/`)
  console.log(`   ${initHtml.length} chars, JSESSIONID=${_cookies['JSESSIONID']?.substring(0, 15)}`)

  // 2. Login
  console.log('2. Login...')
  const { text: loginText } = await doFetch(`${BASE}/ninja/login.action`,
    new URLSearchParams({ action: 'login', loginId, password, isFlg: '', language: '1' }).toString(),
    { 'X-Requested-With': 'XMLHttpRequest', Referer: `${BASE}/ninja/` })
  const lj = JSON.parse(loginText)
  console.log(`   errflg=${lj.errflg} JSESSIONID=${_cookies['JSESSIONID']?.substring(0, 15)}`)

  // 3. loginPrimary - dump FULL response
  console.log('3. loginPrimary...')
  const { text: primaryHtml, status: primaryS } = await doFetch(`${BASE}/ninja/login.action`,
    new URLSearchParams({
      action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
      memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
      memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
      buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
      buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
      language: '1', errflg: '', ID: '', gamenGroup: '', token: '',
    }).toString())

  console.log(`   Status: ${primaryS}, Body: ${primaryHtml.length} chars`)
  writeFileSync('/tmp/ninja-primary.html', primaryHtml)
  console.log('   Saved /tmp/ninja-primary.html')

  // Analyze the response
  console.log(`   Has form: ${primaryHtml.includes('<form')}`)
  console.log(`   Has script: ${primaryHtml.includes('<script')}`)
  console.log(`   Has redirect JS: ${primaryHtml.includes('location') || primaryHtml.includes('redirect')}`)
  console.log(`   Has submit: ${primaryHtml.includes('submit')}`)

  // Show the full body (it's only 4685 chars)
  console.log('\n--- loginPrimary response body ---')
  console.log(primaryHtml.replace(/\s+/g, ' ').substring(0, 2000))
  console.log('--- end ---\n')

  // Check if there's a form action that needs submitting
  const formAction = primaryHtml.match(/action="([^"]+)"/i)
  if (formAction) {
    console.log(`   Form action: ${formAction[1]}`)
  }

  // Check for meta refresh or JS redirect
  const metaRefresh = primaryHtml.match(/http-equiv="refresh"[^>]*content="[^"]*url=([^"]+)"/i)
  if (metaRefresh) {
    console.log(`   Meta refresh to: ${metaRefresh[1]}`)
  }

  const jsRedirect = primaryHtml.match(/(?:window\.)?location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i)
  if (jsRedirect) {
    console.log(`   JS redirect to: ${jsRedirect[1]}`)
  }

  // 4. Now try to navigate to the landing page the response suggests
  console.log('\n4. Following loginPrimary flow...')

  // Extract form fields from primary HTML and submit to wherever the form points
  const fields: Record<string, string> = {}
  const inputRe = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi
  let m
  while ((m = inputRe.exec(primaryHtml)) !== null) fields[m[1]] = m[2]
  console.log(`   Found ${Object.keys(fields).length} form fields`)
  console.log(`   Fields: ${JSON.stringify(fields, null, 2).substring(0, 500)}`)

  const targetUrl = formAction
    ? (formAction[1].startsWith('http') ? formAction[1] : `${BASE}${formAction[1].startsWith('/') ? '' : '/ninja/'}${formAction[1]}`)
    : null

  if (targetUrl) {
    console.log(`\n   Submitting form to ${targetUrl}...`)
    const { text: nextHtml, status: nextS } = await doFetch(targetUrl,
      new URLSearchParams(fields).toString())
    console.log(`   Status: ${nextS} Body: ${nextHtml.length} chars`)

    if (nextHtml.length > 1000) {
      console.log(`   Has cardetail: ${nextHtml.includes('cardetail')}`)
      console.log(`   Has searchcondition: ${nextHtml.includes('searchcondition')}`)
      console.log(`   First 300: ${nextHtml.substring(0, 300).replace(/\s+/g, ' ')}`)
    }
  }

  // 5. Try cardetail now
  console.log('\n5. cardetail test...')
  const { text: detHtml, status: detS } = await doFetch(`${BASE}/ninja/cardetail.action`,
    new URLSearchParams({ KaijoCode: 'TK', AuctionCount: '1559', BidNo: '40341', carKindType: '1' }).toString())
  console.log(`   Status: ${detS} Body: ${detHtml.length}`)
  console.log(`   Has grade: ${detHtml.includes('グレード')}`)
  console.log(`   Snippet: ${detHtml.substring(0, 200).replace(/\s+/g, ' ')}`)
}

main().catch(console.error)
