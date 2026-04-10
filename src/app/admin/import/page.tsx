'use client'

import { useState } from 'react'

interface ImportResult {
  id: string
  model_name: string
  model_year: number | null
  mileage_km: number | null
  inspection_score: string | null
  photos: string[]
  aud_estimate: number | null
  source?: string
  price_jpy?: number | null
}

type Tab = 'ninja' | 'dealer' | 'search'

export default function AdminImportPage() {
  const [tab, setTab] = useState<Tab>('ninja')

  // NINJA state
  const [sessionCookie, setSessionCookie] = useState('')
  const [ninjaUrls, setNinjaUrls] = useState('')
  const [ninjaLoading, setNinjaLoading] = useState(false)
  const [ninjaResults, setNinjaResults] = useState<Array<{ url: string; success: boolean; data?: ImportResult; error?: string }>>([])
  const [cookieSaved, setCookieSaved] = useState(false)

  // Dealer state
  const [dealerUrls, setDealerUrls] = useState('')
  const [dealerLoading, setDealerLoading] = useState(false)
  const [dealerResults, setDealerResults] = useState<Array<{ url: string; success: boolean; data?: ImportResult; error?: string }>>([])

  // Dealer Search state
  const [searchModel, setSearchModel] = useState('hiace_van')
  const [searchYearMin, setSearchYearMin] = useState('2015')
  const [searchYearMax, setSearchYearMax] = useState('2025')
  const [searchPriceMin, setSearchPriceMin] = useState('')
  const [searchPriceMax, setSearchPriceMax] = useState('5000000')
  const [searchDrive, setSearchDrive] = useState('any')
  const [searchFuel, setSearchFuel] = useState('any')
  const [searchTransmission, setSearchTransmission] = useState('any')
  const [searchGrade, setSearchGrade] = useState('dx_only')
  const [searchMaxPages, setSearchMaxPages] = useState('3')
  const [searchDryRun, setSearchDryRun] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchLog, setSearchLog] = useState<string[]>([])
  const [searchSummary, setSearchSummary] = useState<{ found: number; imported: number; skipped: number; errors: number } | null>(null)

  const handleSaveCookie = () => {
    if (sessionCookie.trim()) {
      localStorage.setItem('ninja_session_cookie', sessionCookie.trim())
      setCookieSaved(true)
      setTimeout(() => setCookieSaved(false), 2000)
    }
  }

  const handleLoadCookie = () => {
    const saved = localStorage.getItem('ninja_session_cookie')
    if (saved) setSessionCookie(saved)
  }

  const handleNinjaImport = async () => {
    const urlList = ninjaUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.includes('ninja-cartrade.jp'))

    if (urlList.length === 0) {
      alert('Paste at least one NINJA URL')
      return
    }
    if (!sessionCookie.trim()) {
      alert('Paste your session cookie first — see instructions below')
      return
    }

    setNinjaLoading(true)
    setNinjaResults([])
    const newResults: typeof ninjaResults = []

    for (const url of urlList) {
      try {
        const res = await fetch('/api/import-ninja', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, sessionCookie: sessionCookie.trim() }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          newResults.push({ url, success: true, data: data.listing })
        } else {
          newResults.push({ url, success: false, error: data.error || 'Unknown error' })
        }
      } catch (err) {
        newResults.push({ url, success: false, error: String(err) })
      }
      setNinjaResults([...newResults])
    }

    setNinjaLoading(false)
  }

  const handleDealerImport = async () => {
    const urlList = dealerUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.includes('goo-net.com') || u.includes('carsensor.net'))

    if (urlList.length === 0) {
      alert('Paste at least one Goo-net or Car Sensor URL')
      return
    }

    setDealerLoading(true)
    setDealerResults([])
    const newResults: typeof dealerResults = []

    for (const url of urlList) {
      try {
        const res = await fetch('/api/import-dealer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          newResults.push({ url, success: true, data: data.listing })
        } else {
          newResults.push({ url, success: false, error: data.error || 'Unknown error' })
        }
      } catch (err) {
        newResults.push({ url, success: false, error: String(err) })
      }
      setDealerResults([...newResults])
    }

    setDealerLoading(false)
  }

  const handleDealerSearch = async () => {
    setSearchLoading(true)
    setSearchLog([])
    setSearchSummary(null)

    try {
      const res = await fetch('/api/dealer-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: searchModel,
          yearMin: searchYearMin ? Number(searchYearMin) : undefined,
          yearMax: searchYearMax ? Number(searchYearMax) : undefined,
          priceMin: searchPriceMin ? Number(searchPriceMin) : undefined,
          priceMax: searchPriceMax ? Number(searchPriceMax) : undefined,
          drive: searchDrive,
          fuel: searchFuel,
          transmission: searchTransmission,
          grade: searchGrade,
          maxPages: Number(searchMaxPages),
          dryRun: searchDryRun,
        }),
      })

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.message) {
              setSearchLog(prev => [...prev, data.message])
            }
            if (data.type === 'complete' && data.result) {
              setSearchSummary(data.result)
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (err) {
      setSearchLog(prev => [...prev, `Error: ${String(err)}`])
    }

    setSearchLoading(false)
  }

  const validDealerCount = dealerUrls
    .split('\n')
    .filter(u => u.includes('goo-net.com') || u.includes('carsensor.net')).length

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl text-charcoal">Import Vehicle</h1>
        <p className="text-gray-500 text-sm mt-1">
          Import vehicles from Japan auction or dealer sites directly into your database.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('ninja')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'ninja'
              ? 'bg-white text-charcoal shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Import Vehicle
        </button>
        <button
          onClick={() => setTab('dealer')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'dealer'
              ? 'bg-white text-charcoal shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Goo-net / Car Sensor
        </button>
        <button
          onClick={() => setTab('search')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'search'
              ? 'bg-white text-charcoal shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔍 Dealer Search
        </button>
      </div>

      {/* ---- NINJA TAB ---- */}
      {tab === 'ninja' && (
        <>
          {/* Step 1 — Cookie */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-ocean text-white text-sm font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <h2 className="font-semibold text-gray-900">Paste your NINJA session cookie</h2>
                <p className="text-sm text-gray-500 mt-0.5">This lets the import tool log in as you. You only need to do this once per browser session.</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-900">
              <p className="font-semibold mb-2">How to get your session cookie:</p>
              <ol className="list-decimal list-inside space-y-1 text-amber-800">
                <li>Open <strong>ninja-cartrade.jp</strong> in Chrome and log in</li>
                <li>Right-click anywhere on the page → <strong>Inspect</strong></li>
                <li>Click the <strong>Network</strong> tab at the top</li>
                <li>Refresh the page (press F5)</li>
                <li>Click the first request in the list (e.g. <code className="bg-amber-100 px-1 rounded">ninja</code>)</li>
                <li>Scroll down in the right panel to find <strong>Request Headers</strong></li>
                <li>Find the line starting with <strong>cookie:</strong> and copy the entire value</li>
                <li>Paste it below</li>
              </ol>
            </div>

            <div className="flex gap-2 mb-2">
              <button onClick={handleLoadCookie} className="text-xs text-ocean underline">
                Load saved cookie
              </button>
            </div>

            <textarea
              value={sessionCookie}
              onChange={e => setSessionCookie(e.target.value)}
              placeholder="JSESSIONID=abc123; NINJA_SESSION=xyz789; ..."
              className="w-full h-20 text-xs font-mono border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ocean"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveCookie}
                className="text-sm px-4 py-1.5 bg-ocean text-white rounded-lg hover:bg-ocean"
              >
                {cookieSaved ? '✓ Saved' : 'Save cookie for later'}
              </button>
            </div>
          </div>

          {/* Step 2 — URLs */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-ocean text-white text-sm font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <h2 className="font-semibold text-gray-900">Paste vehicle URLs</h2>
                <p className="text-sm text-gray-500 mt-0.5">One URL per line. Copy the URL from the browser address bar when viewing a vehicle detail page.</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-xs font-mono text-gray-500">
              https://www.ninja-cartrade.jp/ninja/cardetail.action?KaijoCode=TK&AuctionCount=1557&BidNo=40261&carKindType=1
            </div>

            <textarea
              value={ninjaUrls}
              onChange={e => setNinjaUrls(e.target.value)}
              placeholder={"Paste URLs here, one per line...\nhttps://www.ninja-cartrade.jp/ninja/cardetail.action?KaijoCode=TK&..."}
              className="w-full h-36 text-sm font-mono border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ocean"
            />
            <p className="text-xs text-gray-400 mt-1">
              {ninjaUrls.split('\n').filter(u => u.includes('ninja-cartrade.jp')).length} valid URLs detected
            </p>
          </div>

          {/* Step 3 — Import */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-ocean text-white text-sm font-bold flex items-center justify-center shrink-0">3</div>
              <div>
                <h2 className="font-semibold text-gray-900">Import</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fetches each vehicle page and saves it to your database.</p>
              </div>
            </div>

            <button
              onClick={handleNinjaImport}
              disabled={ninjaLoading}
              className="w-full py-3 bg-ocean text-white font-semibold rounded-xl hover:bg-ocean disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {ninjaLoading ? '⏳ Importing...' : '🚐 Import Listings'}
            </button>
          </div>

          {/* NINJA Results */}
          {ninjaResults.length > 0 && (
            <ResultsList results={ninjaResults} />
          )}
        </>
      )}

      {/* ---- DEALER TAB ---- */}
      {tab === 'dealer' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-900">
            <p className="font-semibold mb-1">No login required</p>
            <p className="text-blue-800">Goo-net and Car Sensor listings are publicly accessible — just paste the URL from the listing page.</p>
          </div>

          {/* Step 1 — URLs */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-ocean text-white text-sm font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <h2 className="font-semibold text-gray-900">Paste listing URLs</h2>
                <p className="text-sm text-gray-500 mt-0.5">One URL per line. Accepts goo-net.com and carsensor.net listing pages.</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-500">
                https://www.goo-net.com/usedcar/spread/goo/16/700070002030260213001.html
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-500">
                https://www.carsensor.net/usedcar/detail/HR0202697143/
              </div>
            </div>

            <textarea
              value={dealerUrls}
              onChange={e => setDealerUrls(e.target.value)}
              placeholder={"Paste URLs here, one per line...\nhttps://www.goo-net.com/usedcar/spread/goo/..."}
              className="w-full h-36 text-sm font-mono border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ocean"
            />
            <p className="text-xs text-gray-400 mt-1">
              {validDealerCount} valid URL{validDealerCount !== 1 ? 's' : ''} detected
            </p>
          </div>

          {/* Step 2 — Import */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-ocean text-white text-sm font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <h2 className="font-semibold text-gray-900">Import</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fetches each listing page and saves it to your database as a dealer listing.</p>
              </div>
            </div>

            <button
              onClick={handleDealerImport}
              disabled={dealerLoading}
              className="w-full py-3 bg-ocean text-white font-semibold rounded-xl hover:bg-ocean disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {dealerLoading ? '⏳ Importing...' : '🚐 Import Dealer Listings'}
            </button>
          </div>

          {/* Dealer Results */}
          {dealerResults.length > 0 && (
            <ResultsList results={dealerResults} showSource />
          )}

          {/* Bulk Goo-net Scraper Guide */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mt-8">
            <h2 className="font-semibold text-charcoal text-lg mb-1">Bulk Import from Goo-net</h2>
            <p className="text-sm text-gray-500 mb-4">
              For importing many Goo-net listings at once with high-res photos, use the terminal scraper.
              This downloads photos to our storage (so they persist after the listing expires) and extracts
              full specs including engine type, condition scores, and equipment.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-ocean text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-semibold text-gray-900">Browse Goo-net and open listings you want</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Search on <a href="https://www.goo-net.com/usedcar/brand-TOYOTA/car-HIACE_VAN/" target="_blank" rel="noopener noreferrer" className="text-ocean underline">goo-net.com</a> and
                    open each van you like in a new tab.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-ocean text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-semibold text-gray-900">Copy all tab URLs to a file</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    In Chrome: select all tabs (click first, Shift+click last), right-click → &quot;Copy links for all tabs&quot;.
                    Or use the &quot;Copy All URLs&quot; Chrome extension. Save to a text file (one URL per line).
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2 font-mono text-xs text-gray-500">
                    /tmp/goonet-urls.txt
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-ocean text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-semibold text-gray-900">Run the scraper in Terminal</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Takes ~15–30s per listing. Downloads up to 20 high-res photos each. Duplicates are automatically skipped.
                  </p>
                  <div className="bg-gray-950 text-green-400 rounded-lg p-3 mt-2 font-mono text-xs overflow-x-auto">
                    cd ~/Desktop/&quot;DD App&quot;/dreamdrive && npx tsx scripts/run-goonet-scrape.ts --urls-file /tmp/goonet-urls.txt
                  </div>
                  <p className="text-gray-400 text-xs mt-1.5">
                    Add <code className="bg-gray-100 px-1 rounded">--max 5</code> to test with just a few first.
                    Full command builder available on the <a href="/admin/scrape" className="text-ocean underline">Scrape page</a>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-ocean text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
                <div>
                  <p className="font-semibold text-gray-900">Review drafts and publish</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Imported listings go to <strong>Draft</strong> status. Review them in{' '}
                    <a href="/admin/listings" className="text-ocean underline">Listings</a>, check the photos and specs, then change status to &quot;available&quot; to publish.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Requires <code className="bg-gray-100 px-1 rounded">ANTHROPIC_API_KEY</code> in <code className="bg-gray-100 px-1 rounded">.env.local</code> for AI translation.
                First time setup: <code className="bg-gray-100 px-1 rounded">npx playwright install chromium</code>
              </p>
            </div>
          </div>
        </>
      )}

      {/* ---- DEALER SEARCH TAB ---- */}
      {tab === 'search' && (
        <>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-5 text-sm text-purple-900">
            <p className="font-semibold mb-1">Bulk Search — Car Sensor</p>
            <p className="text-purple-800">Set your filters and scrape all matching listings. Results import as drafts — nothing goes live until you approve.</p>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
            <h2 className="font-semibold text-gray-900 mb-4">Search Filters</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Model</label>
                <select
                  value={searchModel}
                  onChange={e => setSearchModel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                >
                  <option value="hiace_van">Hiace Van</option>
                  <option value="regius_ace">Regius Ace</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Drive</label>
                <select
                  value={searchDrive}
                  onChange={e => setSearchDrive(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                >
                  <option value="any">Any</option>
                  <option value="4WD">4WD only</option>
                  <option value="2WD">2WD only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Year from</label>
                <input
                  type="number"
                  value={searchYearMin}
                  onChange={e => setSearchYearMin(e.target.value)}
                  placeholder="2015"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Year to</label>
                <input
                  type="number"
                  value={searchYearMax}
                  onChange={e => setSearchYearMax(e.target.value)}
                  placeholder="2025"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Price from (¥)</label>
                <input
                  type="number"
                  value={searchPriceMin}
                  onChange={e => setSearchPriceMin(e.target.value)}
                  placeholder="e.g. 1000000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Price to (¥)</label>
                <input
                  type="number"
                  value={searchPriceMax}
                  onChange={e => setSearchPriceMax(e.target.value)}
                  placeholder="e.g. 5000000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fuel</label>
                <select
                  value={searchFuel}
                  onChange={e => setSearchFuel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                >
                  <option value="any">Any</option>
                  <option value="diesel">Diesel</option>
                  <option value="petrol">Petrol</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Transmission</label>
                <select
                  value={searchTransmission}
                  onChange={e => setSearchTransmission(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                >
                  <option value="any">Any</option>
                  <option value="AT">Automatic</option>
                  <option value="MT">Manual</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Grade Filter</label>
                <select
                  value={searchGrade}
                  onChange={e => setSearchGrade(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                >
                  <option value="dx_only">DX + DX GL Package only (recommended)</option>
                  <option value="all">All grades (includes Super GL, Dark Prime, etc.)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">DX grades are best for campervan conversions. Super GL and Dark Prime are excluded by default.</p>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Max pages:</label>
                <select
                  value={searchMaxPages}
                  onChange={e => setSearchMaxPages(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean"
                >
                  {[1, 2, 3, 5, 10].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? '(~30 vans)' : `(~${n * 30} vans)`}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchDryRun}
                  onChange={e => setSearchDryRun(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-ocean focus:ring-ocean"
                />
                <span className="text-gray-700 font-medium">Dry run</span>
                <span className="text-gray-400 text-xs">(test only, no DB writes)</span>
              </label>
            </div>
          </div>

          {/* Start button */}
          <div className="mb-5">
            <button
              onClick={handleDealerSearch}
              disabled={searchLoading}
              className="w-full py-3 bg-ocean text-white font-semibold rounded-xl hover:bg-ocean/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {searchLoading ? '⏳ Searching & importing...' : '🔍 Start Dealer Search'}
            </button>
          </div>

          {/* Summary card */}
          {searchSummary && (
            <div className="grid grid-cols-4 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-charcoal">{searchSummary.found}</p>
                <p className="text-xs text-gray-500 mt-1">Found</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{searchSummary.imported}</p>
                <p className="text-xs text-gray-500 mt-1">Imported</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{searchSummary.skipped}</p>
                <p className="text-xs text-gray-500 mt-1">Skipped</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{searchSummary.errors}</p>
                <p className="text-xs text-gray-500 mt-1">Errors</p>
              </div>
            </div>
          )}

          {/* Live progress log */}
          {searchLog.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4 mb-5 max-h-96 overflow-y-auto">
              <div className="space-y-0.5 font-mono text-xs">
                {searchLog.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.includes('✓') ? 'text-green-400'
                        : line.includes('Skipped') ? 'text-amber-400'
                        : line.includes('Error') || line.includes('error') ? 'text-red-400'
                        : line.includes('===') ? 'text-white font-bold'
                        : 'text-gray-400'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchSummary && searchSummary.imported > 0 && !searchDryRun && (
            <div className="text-center">
              <a href="/admin/drafts" className="text-ocean text-sm font-semibold underline">
                → Review draft listings
              </a>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ResultsList({
  results,
  showSource,
}: {
  results: Array<{ url: string; success: boolean; data?: ImportResult; error?: string }>
  showSource?: boolean
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Results</h3>
      {results.map((r, i) => (
        <div
          key={i}
          className={`rounded-xl border p-4 ${r.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
        >
          {r.success && r.data ? (
            <div className="flex gap-4 items-start">
              {r.data.photos?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.data.photos[0]}
                  alt=""
                  className="w-24 h-16 object-cover rounded-lg shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-green-700 font-bold text-sm">✓ Imported</span>
                  {r.data.inspection_score && (
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">
                      Score {r.data.inspection_score}
                    </span>
                  )}
                  {showSource && r.data.source && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded capitalize">
                      {r.data.source.replace('dealer_', '')}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate">{r.data.model_name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {r.data.model_year && `${r.data.model_year} · `}
                  {r.data.mileage_km && `${r.data.mileage_km.toLocaleString()} km · `}
                  {r.data.aud_estimate
                    ? `~A$${Math.round(r.data.aud_estimate / 100).toLocaleString()}`
                    : r.data.price_jpy
                    ? `¥${r.data.price_jpy.toLocaleString()}`
                    : ''}
                </p>
                <p className="text-gray-400 text-xs mt-1 truncate">{r.url}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-red-700 font-semibold text-sm">✗ Failed</p>
              <p className="text-red-600 text-sm mt-0.5">{r.error}</p>
              <p className="text-gray-400 text-xs mt-1 truncate">{r.url}</p>
            </div>
          )}
        </div>
      ))}

      {results.every(r => r.success) && (
        <div className="text-center pt-2">
          <a href="/admin/listings" className="text-ocean text-sm font-semibold underline">
            → View all listings
          </a>
        </div>
      )}
    </div>
  )
}
