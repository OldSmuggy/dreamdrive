/**
 * Test NINJA search via Firecrawl actions — renders JS-loaded results
 * Run with: npx tsx scripts/test-ninja-firecrawl.ts
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

import Firecrawl from '@mendable/firecrawl-js'

const loginId = process.env.NINJA_LOGIN_ID!
const password = process.env.NINJA_PASSWORD!
const apiKey = process.env.FIRECRAWL_API_KEY!

const BASE = 'https://www.ninja-cartrade.jp'

async function main() {
  console.log('=== NINJA Firecrawl Search Test ===\n')

  const fc = new Firecrawl({ apiKey })

  // Full flow: login → search → extract results
  // All done inside Firecrawl's browser via actions
  const script = `
    (async function() {
      try {
        // Step 1: AJAX login
        const loginRes = await fetch('/ninja/login.action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: new URLSearchParams({
            action: 'login',
            loginId: ${JSON.stringify(loginId)},
            password: ${JSON.stringify(password)},
            isFlg: '',
            language: '1'
          }).toString()
        });
        const loginJson = await loginRes.json();

        if (loginJson.errflg === '1') {
          return JSON.stringify({ error: 'Login rejected', details: loginJson });
        }

        // Step 2: loginPrimary
        await fetch('/ninja/login.action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
            memberCode: loginJson.memberCode || '',
            branchCode: loginJson.branchCode || '',
            memberName: loginJson.memberName || '',
            buyerId: loginJson.buyerId || '',
            buyerName: loginJson.buyerName || '',
            buyerImagePath: loginJson.buyerImagePath || '',
            buyerKaijoNameOpenFlg: loginJson.buyerKaijoNameOpenFlg || '',
            language: '1', errflg: '', ID: '', gamenGroup: '', token: ''
          }).toString()
        });

        // Step 3: searchcondition
        await fetch('/ninja/searchcondition.action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            action: '', loginPrimaryGamen: '1', site: '2',
            memberCode: loginJson.memberCode || '',
            branchCode: loginJson.branchCode || '',
            memberName: loginJson.memberName || '',
            buyerId: loginJson.buyerId || '',
            buyerName: loginJson.buyerName || '',
            buyerImagePath: loginJson.buyerImagePath || '',
            buyerKaijoNameOpenFlg: loginJson.buyerKaijoNameOpenFlg || '',
            language: '1', errflg: '', ID: '', gamenGroup: '22', token: ''
          }).toString()
        });

        // Step 4: Navigate the browser to searchcondition page
        // Set location to trigger full page navigation with cookies
        document.location.href = '/ninja/searchcondition.action';
        await new Promise(r => setTimeout(r, 3000));

        return JSON.stringify({
          success: true,
          step: 'login_complete',
          cookies: document.cookie,
          url: document.location.href,
          loginJson: loginJson
        });
      } catch (err) {
        return JSON.stringify({ error: String(err) });
      }
    })()
  `

  console.log('Step 1: Login via Firecrawl actions...')
  try {
    const result = await fc.scrape(`${BASE}/ninja/`, {
      formats: ['rawHtml'],
      timeout: 60000,
      waitFor: 3000,
      actions: [
        { type: 'wait', milliseconds: 2000 },
        { type: 'executeJavascript', script },
        { type: 'wait', milliseconds: 3000 },
        { type: 'scrape' },
      ],
    })

    const jsReturns = (result as any)?.actions?.javascriptReturns ?? []
    const scrapes = (result as any)?.actions?.scrapes ?? []

    console.log(`JS returns: ${jsReturns.length}`)
    console.log(`Scrapes: ${scrapes.length}`)

    if (jsReturns.length > 0) {
      const val = jsReturns[0]?.value
      try {
        const parsed = typeof val === 'string' ? JSON.parse(val) : val
        console.log(`Login result: ${JSON.stringify(parsed).substring(0, 300)}`)
      } catch {
        console.log(`JS return (raw): ${String(val).substring(0, 300)}`)
      }
    }

    // Now try navigating to search with a second Firecrawl call
    // But first we need the cookies from the login
    const rawHtml = result.rawHtml || result.html || ''
    console.log(`\nPost-login HTML length: ${rawHtml.length}`)
    console.log(`Has searchcondition form: ${rawHtml.includes('searchcondition')}`)

  } catch (err) {
    console.error('Firecrawl login error:', err)
  }

  // Alternative approach: Use Firecrawl to directly scrape a search results URL
  // by first setting cookies via executeJavascript
  console.log('\n\nStep 2: Try full search flow in single Firecrawl call...')

  const fullScript = `
    (async function() {
      try {
        // Login
        const loginRes = await fetch('/ninja/login.action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: 'action=login&loginId=${loginId}&password=${password}&isFlg=&language=1'
        });
        const lj = await loginRes.json();
        if (lj.errflg === '1') return JSON.stringify({ error: 'Login failed' });

        // loginPrimary
        await fetch('/ninja/login.action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'action=loginPrimary&loginPrimaryGamen=1&site=2&memberCode=' +
            encodeURIComponent(lj.memberCode || '') +
            '&branchCode=' + encodeURIComponent(lj.branchCode || '') +
            '&memberName=' + encodeURIComponent(lj.memberName || '') +
            '&buyerId=' + encodeURIComponent(lj.buyerId || '') +
            '&buyerName=' + encodeURIComponent(lj.buyerName || '') +
            '&language=1&errflg=&ID=&gamenGroup=&token='
        });

        // searchcondition
        const scRes = await fetch('/ninja/searchcondition.action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'action=&loginPrimaryGamen=1&site=2&memberCode=' +
            encodeURIComponent(lj.memberCode || '') +
            '&branchCode=' + encodeURIComponent(lj.branchCode || '') +
            '&memberName=' + encodeURIComponent(lj.memberName || '') +
            '&buyerId=' + encodeURIComponent(lj.buyerId || '') +
            '&buyerName=' + encodeURIComponent(lj.buyerName || '') +
            '&language=1&errflg=&ID=&gamenGroup=22&token='
        });
        const scHtml = await scRes.text();

        // Extract form fields from searchcondition
        const parser = new DOMParser();
        const scDoc = parser.parseFromString(scHtml, 'text/html');
        const inputs = scDoc.querySelectorAll('input[name][value]');
        const formData = new URLSearchParams();
        inputs.forEach(inp => {
          formData.set(inp.getAttribute('name'), inp.getAttribute('value') || '');
        });

        // makersearch (Toyota = brandGroupingCode 01)
        formData.set('brandGroupingCode', '01');
        formData.set('bodyType', '');
        formData.set('cornerSearchCheckCorner', '');
        formData.set('action', 'init');

        const msRes = await fetch('/ninja/makersearch.action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });
        const msHtml = await msRes.text();

        // Extract form fields from makersearch
        const msDoc = parser.parseFromString(msHtml, 'text/html');
        const msInputs = msDoc.querySelectorAll('input[name][value]');
        const msFormData = new URLSearchParams();
        msInputs.forEach(inp => {
          msFormData.set(inp.getAttribute('name'), inp.getAttribute('value') || '');
        });

        // searchresultlist with HIACE VAN category
        msFormData.set('carCategoryNo', '146');
        msFormData.set('action', 'seniSearch');
        msFormData.set('page', '1');
        msFormData.delete('evaluation');

        const srRes = await fetch('/ninja/searchresultlist.action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: msFormData.toString()
        });
        const srHtml = await srRes.text();

        // Now navigate the BROWSER to search results
        // Create a form and submit it (this triggers full page navigation)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/ninja/searchresultlist.action';
        form.style.display = 'none';

        // Copy all form fields
        for (const [key, value] of msFormData.entries()) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();

        // Wait for navigation
        await new Promise(r => setTimeout(r, 5000));

        // After navigation, capture the rendered page
        return JSON.stringify({
          success: true,
          loginOk: true,
          scLen: scHtml.length,
          msLen: msHtml.length,
          srLen: srHtml.length,
          srHasCardetail: srHtml.includes('cardetail'),
          srHasTable: srHtml.includes('<table'),
          pageTitle: document.title,
          pageUrl: document.location.href,
          bodyText: document.body?.innerText?.substring(0, 500) || '(empty)',
          bodyHtml: document.body?.innerHTML?.substring(0, 500) || '(empty)'
        });
      } catch (err) {
        return JSON.stringify({ error: String(err), stack: err.stack });
      }
    })()
  `

  try {
    const result2 = await fc.scrape(`${BASE}/ninja/`, {
      formats: ['rawHtml'],
      timeout: 90000,
      waitFor: 5000,
      actions: [
        { type: 'wait', milliseconds: 2000 },
        { type: 'executeJavascript', script: fullScript },
        { type: 'wait', milliseconds: 8000 },
        { type: 'scrape' },
      ],
    })

    const jsReturns2 = (result2 as any)?.actions?.javascriptReturns ?? []
    const scrapes2 = (result2 as any)?.actions?.scrapes ?? []

    if (jsReturns2.length > 0) {
      const val = jsReturns2[0]?.value
      try {
        const parsed = typeof val === 'string' ? JSON.parse(val) : val
        console.log(`Full flow result: ${JSON.stringify(parsed, null, 2).substring(0, 1000)}`)
      } catch {
        console.log(`Full flow raw: ${String(val).substring(0, 500)}`)
      }
    }

    if (scrapes2.length > 0) {
      const scraped = scrapes2[0]
      const html = scraped?.rawHtml || scraped?.html || ''
      console.log(`\nScraped HTML after form submit: ${html.length} chars`)
      console.log(`Has cardetail: ${html.includes('cardetail')}`)
      console.log(`Has seniToCardetail: ${html.includes('seniToCardetail')}`)
      console.log(`Has KaijoCode: ${html.includes('KaijoCode')}`)
      console.log(`Has table: ${html.includes('<table')}`)

      const cdMatches = html.match(/cardetail/gi)
      console.log(`cardetail count: ${cdMatches?.length ?? 0}`)

      // Look for listing patterns
      const trCount = (html.match(/<tr/gi) || []).length
      console.log(`<tr> count: ${trCount}`)

      const imgCount = (html.match(/<img/gi) || []).length
      console.log(`<img> count: ${imgCount}`)

      // Dump snippet
      if (html.length > 1000) {
        const mid = Math.floor(html.length / 3)
        console.log(`\nHTML at 1/3: ${html.substring(mid, mid + 500).replace(/\s+/g, ' ')}`)
      }
    }

    // Also check the main rawHtml from the page
    const mainHtml = result2.rawHtml || result2.html || ''
    console.log(`\nMain page HTML: ${mainHtml.length} chars`)
    console.log(`Has cardetail: ${mainHtml.includes('cardetail')}`)
    console.log(`Has table: ${mainHtml.includes('<table')}`)

  } catch (err) {
    console.error('Full flow error:', err)
  }
}

main().catch(console.error)
