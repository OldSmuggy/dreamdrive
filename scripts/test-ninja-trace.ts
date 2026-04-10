/**
 * Trace every request/response/cookie in the NINJA login flow
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
let _cookies: Record<string, string> = {}

function setCookie(key: string, value: string) {
  _cookies[key] = value
}

function cookieStr() {
  return Object.entries(_cookies).map(([k, v]) => `${k}=${v}`).join('; ')
}

function absorbCookies(res: Response, label: string) {
  const before = JSON.stringify(_cookies)
  const setCookies = res.headers.getSetCookie?.() ?? []
  for (const sc of setCookies) {
    const [pair] = sc.split(';')
    const [k, ...v] = pair.split('=')
    if (k?.trim()) {
      const key = k.trim()
      const val = v.join('=').trim()
      if (_cookies[key] !== val) {
        console.log(`   [cookie] ${label}: ${key} = ${val.substring(0, 40)}...`)
      }
      _cookies[key] = val
    }
  }
  // Fallback
  if (setCookies.length === 0) {
    const raw = res.headers.get('set-cookie') || ''
    if (raw) {
      for (const part of raw.split(/,(?=\s*\w+=)/)) {
        const [pair] = part.split(';')
        const [k, ...v] = pair.split('=')
        if (k?.trim()) {
          _cookies[k.trim()] = v.join('=').trim()
        }
      }
    }
  }
}

async function traceFetch(label: string, url: string, options?: RequestInit): Promise<Response> {
  const method = options?.method || 'GET'
  console.log(`\n>> ${label}: ${method} ${url}`)
  if (options?.body) {
    const body = String(options.body)
    console.log(`   Body: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`)
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': UA,
      Cookie: cookieStr(),
      ...(options?.headers as Record<string, string> || {}),
    },
    redirect: 'manual',
  })

  console.log(`<< ${label}: ${res.status} ${res.statusText}`)
  const loc = res.headers.get('location')
  if (loc) console.log(`   Location: ${loc}`)

  absorbCookies(res, label)

  return res
}

async function main() {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!
  console.log('=== NINJA Login Trace ===\n')

  // Step 1: Initial page load
  let res = await traceFetch('INIT', `${BASE}/ninja/`)
  let html = await res.text()
  console.log(`   Body: ${html.length} chars`)

  // Follow redirects
  let loc = res.headers.get('location')
  if (loc) {
    const redirectUrl = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await traceFetch('INIT-R1', redirectUrl)
    html = await res.text()
    console.log(`   Body: ${html.length} chars`)

    loc = res.headers.get('location')
    if (loc) {
      const ru2 = loc.startsWith('http') ? loc : `${BASE}${loc}`
      res = await traceFetch('INIT-R2', ru2)
      html = await res.text()
      console.log(`   Body: ${html.length} chars`)
    }
  }

  console.log(`\n   Cookies after init: ${JSON.stringify(Object.keys(_cookies))}`)
  console.log(`   JSESSIONID: ${_cookies['JSESSIONID']?.substring(0, 20)}...`)

  // Step 2: AJAX Login
  res = await traceFetch('LOGIN', `${BASE}/ninja/login.action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE}/ninja/`,
    },
    body: new URLSearchParams({
      action: 'login', loginId, password, isFlg: '', language: '1',
    }).toString(),
  })
  const loginText = await res.text()
  console.log(`   Response: ${loginText.substring(0, 300)}`)

  const lj = JSON.parse(loginText)

  // Follow redirects from login if any
  loc = res.headers.get('location')
  if (loc) {
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await traceFetch('LOGIN-R', ru)
    await res.text()
  }

  // Step 3: loginPrimary
  res = await traceFetch('PRIMARY', `${BASE}/ninja/login.action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': `${BASE}/ninja/`,
    },
    body: new URLSearchParams({
      action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
      memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
      memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
      buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
      buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
      language: '1', errflg: '', ID: '', gamenGroup: '', token: '',
    }).toString(),
  })
  html = await res.text()
  console.log(`   Body: ${html.length} chars`)
  console.log(`   Has redirect: ${html.includes('location.href') || html.includes('redirect')}`)
  console.log(`   Snippet: ${html.substring(0, 200).replace(/\s+/g, ' ')}`)

  // Follow redirects from loginPrimary
  loc = res.headers.get('location')
  if (loc) {
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await traceFetch('PRIMARY-R', ru)
    await res.text()
  }

  console.log(`\n   Cookies after primary: ${JSON.stringify(Object.keys(_cookies))}`)

  // Step 4: Try cardetail directly (skip search — just verify session works)
  console.log('\n=== Testing session with cardetail ===')
  res = await traceFetch('DETAIL-TEST', `${BASE}/ninja/cardetail.action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': `${BASE}/ninja/searchresultlist.action`,
    },
    body: new URLSearchParams({
      KaijoCode: 'TK', AuctionCount: '1559', BidNo: '40341', carKindType: '1',
    }).toString(),
  })
  html = await res.text()
  console.log(`   Body: ${html.length} chars`)
  console.log(`   Has grade: ${html.includes('グレード')}`)
  console.log(`   Has timeout: ${html.includes('sessionTimeOut')}`)
  if (html.length < 5000) {
    console.log(`   Full body: ${html.substring(0, 500).replace(/\s+/g, ' ')}`)
  }

  // Also try as GET
  res = await traceFetch('DETAIL-GET', `${BASE}/ninja/cardetail.action?KaijoCode=TK&AuctionCount=1559&BidNo=40341&carKindType=1`)
  html = await res.text()
  console.log(`   Body: ${html.length} chars`)
  console.log(`   Has grade: ${html.includes('グレード')}`)
  console.log(`   Has timeout: ${html.includes('sessionTimeOut')}`)
}

main().catch(console.error)
