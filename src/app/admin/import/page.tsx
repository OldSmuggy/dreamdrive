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

type Tab = 'ninja' | 'dealer'

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

  const validDealerCount = dealerUrls
    .split('\n')
    .filter(u => u.includes('goo-net.com') || u.includes('carsensor.net')).length

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-forest-900">Import Vehicle</h1>
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
              ? 'bg-white text-forest-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Import Vehicle
        </button>
        <button
          onClick={() => setTab('dealer')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'dealer'
              ? 'bg-white text-forest-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Goo-net / Car Sensor
        </button>
      </div>

      {/* ---- NINJA TAB ---- */}
      {tab === 'ninja' && (
        <>
          {/* Step 1 — Cookie */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-forest-600 text-white text-sm font-bold flex items-center justify-center shrink-0">1</div>
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
              <button onClick={handleLoadCookie} className="text-xs text-forest-600 underline">
                Load saved cookie
              </button>
            </div>

            <textarea
              value={sessionCookie}
              onChange={e => setSessionCookie(e.target.value)}
              placeholder="JSESSIONID=abc123; NINJA_SESSION=xyz789; ..."
              className="w-full h-20 text-xs font-mono border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveCookie}
                className="text-sm px-4 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700"
              >
                {cookieSaved ? '✓ Saved' : 'Save cookie for later'}
              </button>
            </div>
          </div>

          {/* Step 2 — URLs */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-forest-600 text-white text-sm font-bold flex items-center justify-center shrink-0">2</div>
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
              className="w-full h-36 text-sm font-mono border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              {ninjaUrls.split('\n').filter(u => u.includes('ninja-cartrade.jp')).length} valid URLs detected
            </p>
          </div>

          {/* Step 3 — Import */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-forest-600 text-white text-sm font-bold flex items-center justify-center shrink-0">3</div>
              <div>
                <h2 className="font-semibold text-gray-900">Import</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fetches each vehicle page and saves it to your database.</p>
              </div>
            </div>

            <button
              onClick={handleNinjaImport}
              disabled={ninjaLoading}
              className="w-full py-3 bg-forest-600 text-white font-semibold rounded-xl hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <div className="w-7 h-7 rounded-full bg-forest-600 text-white text-sm font-bold flex items-center justify-center shrink-0">1</div>
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
              className="w-full h-36 text-sm font-mono border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              {validDealerCount} valid URL{validDealerCount !== 1 ? 's' : ''} detected
            </p>
          </div>

          {/* Step 2 — Import */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-forest-600 text-white text-sm font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <h2 className="font-semibold text-gray-900">Import</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fetches each listing page and saves it to your database as a dealer listing.</p>
              </div>
            </div>

            <button
              onClick={handleDealerImport}
              disabled={dealerLoading}
              className="w-full py-3 bg-forest-600 text-white font-semibold rounded-xl hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {dealerLoading ? '⏳ Importing...' : '🚐 Import Dealer Listings'}
            </button>
          </div>

          {/* Dealer Results */}
          {dealerResults.length > 0 && (
            <ResultsList results={dealerResults} showSource />
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
          <a href="/admin/listings" className="text-forest-600 text-sm font-semibold underline">
            → View all listings
          </a>
        </div>
      )}
    </div>
  )
}
