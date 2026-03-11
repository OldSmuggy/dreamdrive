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
}

export default function AdminImportPage() {
  const [sessionCookie, setSessionCookie] = useState('')
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Array<{ url: string; success: boolean; data?: ImportResult; error?: string }>>([])
  const [cookieSaved, setCookieSaved] = useState(false)

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

  const handleImport = async () => {
    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u.includes('ninja-cartrade.jp'))
    if (urlList.length === 0) { alert('Paste at least one NINJA URL'); return }
    if (!sessionCookie.trim()) { alert('Paste your session cookie first'); return }
    setLoading(true)
    setResults([])
    const newResults: typeof results = []
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
      setResults([...newResults])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-forest-900">Import from NINJA</h1>
        <p className="text-gray-500 text-sm mt-1">Paste vehicle URLs from ninja-cartrade.jp to import listings directly</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-7 h-7 rounded-full bg-forest-600 text-white text-sm font-bold flex items-center justify-center shrink-0">1</div>
          <div>
            <h2 className="font-semibold text-gray-900">Paste your NINJA session cookie</h2>
            <p className="text-sm text-gray-500 mt-0.5">You only need to do this once per session.</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-900">
          <p className="font-semibold mb-2">How to get your session cookie:</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-800">
            <li>Open ninja-cartrade.jp in Chrome and log in</li>
            <li>Right-click anywhere and click Inspect</li>
            <li>Click the Network tab</li>
            <li>Refresh the page</li>
            <li>Click the first request in the list</li>
            <li>Scroll to Request Headers on the right</li>
            <li>Find the cookie: line and copy the whole value</li>
            <li>Paste it below</li>
          </ol>
        </div>
        <button onClick={handleLoadCookie} className="text-xs text-forest-600 underline mb-2 block">Load saved cookie</button>
        <textarea value={sessionCookie} onChange={e => setSessionCookie(e.target.value)}
          placeholder="JSESSIONID=abc123; ..."
          className="w-full h-20 text-xs font-mono border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-forest-500" />
        <div className="flex justify-end mt-2">
          <button onClick={handleSaveCookie} className="text-sm px-4 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700">
            {cookieSaved ? '✓ Saved' : 'Save cookie for later'}
          </button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-7 h-7 rounded-full bg-forest-600 text-white text-sm font-bold flex items-center justify-center shrink-0">2</div>
          <div>
            <h2 className="font-semibold text-gray-900">Paste vehicle URLs</h2>
            <p className="text-sm text-gray-500 mt-0.5">One URL per line from the vehicle detail page.</p>
          </div>
        </div>
        <textarea value={urls} onChange={e => setUrls(e.target.value)}
          placeholder="Paste URLs here, one per line..."
          className="w-full h-36 text-sm font-mono border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-forest-500" />
        <p className="text-xs text-gray-400 mt-1">{urls.split('\n').filter(u => u.includes('ninja-cartrade.jp')).length} valid URLs detected</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-7 h-7 rounded-full bg-forest-600 text-white text-sm font-bold flex items-center justify-center shrink-0">3</div>
          <div>
            <h2 className="font-semibold text-gray-900">Import</h2>
            <p className="text-sm text-gray-500 mt-0.5">Fetches each vehicle and saves it to your database.</p>
          </div>
        </div>
        <button onClick={handleImport} disabled={loading}
          className="w-full py-3 bg-forest-600 text-white font-semibold rounded-xl hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? '⏳ Importing...' : '🚐 Import Listings'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Results</h3>
          {results.map((r, i) => (
            <div key={i} className={`rounded-xl border p-4 ${r.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {r.success && r.data ? (
                <div className="flex gap-4 items-start">
                  {r.data.photos?.[0] && <img src={r.data.photos[0]} alt="" className="w-24 h-16 object-cover rounded-lg shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-700 font-bold text-sm">✓ Imported</span>
                      {r.data.inspection_score && <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">Score {r.data.inspection_score}</span>}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm truncate">{r.data.model_name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {r.data.model_year && `${r.data.model_year} · `}
                      {r.data.mileage_km && `${r.data.mileage_km.toLocaleString()} km · `}
                      {r.data.aud_estimate && `~A$${Math.round(r.data.aud_estimate / 100).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-red-700 font-semibold text-sm">✗ Failed</p>
                  <p className="text-red-600 text-sm mt-0.5">{r.error}</p>
                </div>
              )}
            </div>
          ))}
          {results.every(r => r.success) && (
            <div className="text-center pt-2">
              <a href="/admin/listings" className="text-forest-600 text-sm font-semibold underline">→ View all listings</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
