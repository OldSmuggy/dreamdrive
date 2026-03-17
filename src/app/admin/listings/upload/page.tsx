'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UploadAuctionPdfPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return }
    if (f.size > 10 * 1024 * 1024) { setError('File must be under 10MB.'); return }
    setFile(f)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/listings/extract-pdf', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Extraction failed')
        if (data.raw) setError(prev => `${prev}\n\nRaw AI response:\n${data.raw}`)
        setLoading(false)
        return
      }

      router.push(`/admin/drafts`)
    } catch (err) {
      setError(String(err))
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/listings" className="text-gray-400 hover:text-gray-600 text-sm">← Listings</Link>
        <span className="text-gray-300">/</span>
        <h1 className="font-display text-xl text-forest-900">Upload Auction PDF</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <p className="text-sm text-gray-600">
          Upload a NINJA Car Trade auction sheet (PDF). We&apos;ll use AI to extract the vehicle details and create a draft listing you can review and edit.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-colors ${
            dragging ? 'border-forest-500 bg-forest-50' :
            file     ? 'border-forest-400 bg-forest-50/50' :
                       'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          {file ? (
            <div>
              <p className="text-3xl mb-2">📄</p>
              <p className="text-sm font-semibold text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
              <p className="text-xs text-forest-600 mt-2">Click to change file</p>
            </div>
          ) : (
            <div>
              <p className="text-4xl mb-2">📤</p>
              <p className="text-sm font-semibold text-gray-700">Drag and drop a PDF here</p>
              <p className="text-xs text-gray-400 mt-1">or click to select — max 10MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="w-full btn-primary py-3 text-sm disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Reading auction sheet…
            </span>
          ) : (
            'Extract Listing Details'
          )}
        </button>
      </div>
    </div>
  )
}
