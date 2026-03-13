// Debug script v2: test AJAX login flow and inspect search pages
// Run with: node scripts/debug-ninja2.mjs

import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const BASE = 'https://www.ninja-cartrade.jp'
const loginId = process.env.NINJA_LOGIN_ID || 'Y3502K01'
const password = process.env.NINJA_PASSWORD || '18479042'

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ja-JP',
    })

    // 1. Load login page to establish JSESSIONID
    console.log('1. Loading login page to establish session...')
    const page = await context.newPage()
    await page.goto(`${BASE}/ninja/`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.close()
    console.log('   Done.')

    const req = context.request

    // 2. AJAX login
    console.log('2. AJAX login POST...')
    const loginAjaxRes = await req.post(`${BASE}/ninja/login.action`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest', Referer: `${BASE}/ninja/` },
      form: { action: 'login', loginId, password, isFlg: '', language: '1' },
    })
    const loginJson = await loginAjaxRes.json()
    console.log('   Status:', loginAjaxRes.status())
    console.log('   Response JSON:', JSON.stringify(loginJson, null, 2))

    // 3. Handle errflg==9 (multi-buyer: submit loginPrimary)
    if (loginJson.errflg === '9') {
      console.log('3. errflg=9 — submitting loginPrimary to login.action...')
      const lpRes = await req.post(`${BASE}/ninja/login.action`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: `${BASE}/ninja/` },
        form: {
          action: 'loginPrimary',
          loginPrimaryGamen: '1',
          site: '2',
          memberCode: loginJson.memberCode ?? '',
          branchCode: loginJson.branchCode ?? '',
          memberName: loginJson.memberName ?? '',
          buyerId: loginJson.buyerId ?? '',
          buyerName: loginJson.buyerName ?? '',
          buyerImagePath: loginJson.buyerImagePath ?? '',
          buyerKaijoNameOpenFlg: loginJson.buyerKaijoNameOpenFlg ?? '',
          language: '1',
          token: '',
        },
      })
      const lpBody = await lpRes.text()
      writeFileSync('/tmp/ninja-loginprimary.html', lpBody)
      console.log('   loginPrimary status:', lpRes.status(), 'length:', lpBody.length)
      console.log('   Saved to /tmp/ninja-loginprimary.html')
      console.log('   Snippet:', lpBody.substring(0, 600).replace(/\s+/g, ' '))
    }

    // 4. POST to searchcondition.action — replicate seniToSearchcondition():
    //    action="" (empty), gamenGroup="22"
    console.log('4. POSTing to searchcondition.action (seniToSearchcondition equivalent)...')
    const scRes = await req.post(`${BASE}/ninja/searchcondition.action`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: `${BASE}/ninja/login.action` },
      form: {
        action: '',          // ← seniToSearchcondition sets action="" (empty)
        loginPrimaryGamen: '1',
        site: '2',
        memberCode: loginJson.memberCode ?? '',
        branchCode: loginJson.branchCode ?? '',
        memberName: loginJson.memberName ?? '',
        buyerId: loginJson.buyerId ?? '',
        buyerName: loginJson.buyerName ?? '',
        buyerImagePath: loginJson.buyerImagePath ?? '',
        buyerKaijoNameOpenFlg: loginJson.buyerKaijoNameOpenFlg ?? '',
        language: '1',
        errflg: '',
        ID: '',
        gamenGroup: '22',   // ← seniToSearchcondition sets gamenGroup="22"
        token: '',
      },
    })
    const scHtml = await scRes.text()
    writeFileSync('/tmp/ninja-searchcondition.html', scHtml)
    console.log('   Status:', scRes.status(), 'length:', scHtml.length)
    console.log('   Has sessionTimeOut:', scHtml.includes('sessionTimeOut'))
    console.log('   Has buyerHeader:', scHtml.includes('buyerHeader'))
    // Show .action URLs on this page
    const scActions = [...scHtml.matchAll(/(?:href|action)="([^"]*\.action[^"]*)"/gi)].map(m => m[1])
    console.log('   .action URLs:', [...new Set(scActions)])
    console.log('   HTML snippet:', scHtml.substring(0, 1000).replace(/\s+/g, ' '))
    console.log('   Saved to /tmp/ninja-searchcondition.html')

    // 5. POST to makersearch.action — extract ALL form1 fields from searchcondition and
    //    override brandGroupingCode='01', action='init' (replicating seniBrand('01'))
    console.log('\n5. Extracting ALL form1 hidden fields from searchcondition page...')

    // Parse all input[name][value] from the searchcondition HTML (form1 fields)
    const formFields = {}
    const inputRe = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*>/gi
    let im
    while ((im = inputRe.exec(scHtml)) !== null) {
      formFields[im[1]] = im[2]
    }
    // Also grab textarea/select defaults if any
    console.log('   Form fields found:', Object.keys(formFields).join(', '))
    console.log('   carListData:', formFields['carListData']?.substring(0, 100))

    // Override for seniBrand('01')
    formFields['brandGroupingCode'] = '01'
    formFields['bodyType'] = ''
    formFields['cornerSearchCheckCorner'] = ''
    formFields['action'] = 'init'

    console.log('\n   POSTing to makersearch.action with all form fields...')
    const msRes = await req.post(`${BASE}/ninja/makersearch.action`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: `${BASE}/ninja/searchcondition.action` },
      form: formFields,
    })
    const msHtml = await msRes.text()
    writeFileSync('/tmp/ninja-makersearch.html', msHtml)
    console.log('   Status:', msRes.status(), 'length:', msHtml.length)
    console.log('   Saved to /tmp/ninja-makersearch.html')
    console.log('   Snippet:', msHtml.substring(0, 600).replace(/\s+/g, ' '))

    // 6. Extract ALL form1 fields from makersearch page and POST to searchresultlist
    //    Replicate makerListChoiceCarCat('146') flow with BOTH 146 and 198
    console.log('\n6. Extracting ALL form1 fields from makersearch page...')
    const msFormFields = {}
    const msInputRe = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*>/gi
    let mim
    while ((mim = msInputRe.exec(msHtml)) !== null) {
      msFormFields[mim[1]] = mim[2]  // msHtml = the makersearch HTML above
    }
    console.log('   makersearch form fields:', Object.keys(msFormFields).join(', '))

    // Override for makerListChoiceCarCat - try with single '146' first, then '146,198'
    msFormFields['carCategoryNo'] = '146'    // HIACE VAN
    msFormFields['action'] = 'seniSearch'
    msFormFields['brandGroupingCode'] = '01'  // Toyota
    // Try to also trigger REGIUS ACE VAN (198) search
    // The form might accept comma-separated values
    delete msFormFields['evaluation']  // don't send checkbox-style values

    console.log('   POSTing to searchresultlist.action (carCategoryNo=146)...')
    const srRes = await req.post(`${BASE}/ninja/searchresultlist.action`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: `${BASE}/ninja/makersearch.action` },
      form: msFormFields,
    })
    const srHtml = await srRes.text()
    writeFileSync('/tmp/ninja-searchresultlist.html', srHtml)
    console.log('   Status:', srRes.status(), 'length:', srHtml.length)
    console.log('   cardetail occurrences:', (srHtml.match(/cardetail/gi) || []).length)
    console.log('   KaijoCode occurrences:', (srHtml.match(/KaijoCode/gi) || []).length)
    console.log('   Snippet:', srHtml.substring(0, 1000).replace(/\s+/g, ' '))
    console.log('   Saved to /tmp/ninja-searchresultlist.html')

  } finally {
    await browser.close()
  }
}

main().catch(console.error)
