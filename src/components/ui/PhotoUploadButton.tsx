'use client'

import { useRef, useState } from 'react'

/**
 * Size threshold above which we use the signed-URL (direct-to-storage) path.
 * Vercel serverless functions have a hard 4.5 MB request body limit.
 * We set 3.5 MB to leave headroom for FormData/multipart overhead.
 */
const SIGNED_URL_THRESHOLD = 3.5 * 1024 * 1024 // 3.5 MB

/** Content types that ALWAYS bypass the proxy (go direct to Supabase) */
const ALWAYS_DIRECT_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

/**
 * Small images (< 3.5 MB): POST to /api/upload  (proxied through Vercel)
 * Videos & large files: get a signed URL, then PUT directly to Supabase Storage
 */
async function uploadFile(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  // Videos always go direct — even small ones — to avoid proxy body-size issues
  if (ALWAYS_DIRECT_TYPES.includes(file.type) || file.size >= SIGNED_URL_THRESHOLD) {
    return uploadViaSigned(file, onProgress)
  }
  return uploadViaProxy(file, onProgress)
}

/** Upload small files through the /api/upload serverless function */
function uploadViaProxy(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && data.url) {
          resolve(data.url)
        } else {
          reject(new Error(data.error ?? `HTTP ${xhr.status}`))
        }
      } catch {
        reject(new Error(`HTTP ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.open('POST', '/api/upload')
    xhr.send(form)
  })
}

/** Upload large files directly to Supabase Storage via a signed URL */
async function uploadViaSigned(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  // 1. Get signed URL from our API
  const res = await fetch('/api/upload/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  const { signedUrl, token, publicUrl } = await res.json()

  // 2. Upload directly to Supabase Storage using XHR for progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(publicUrl)
      } else {
        reject(new Error(`Upload failed: HTTP ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))

    // Supabase signed upload URL already has the token in the query string.
    // We also pass it as a header for compatibility with newer Supabase versions.
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.setRequestHeader('x-upsert', 'false')
    if (token) xhr.setRequestHeader('x-supabase-upload-token', token)
    xhr.send(file)
  })
}

export default function PhotoUploadButton({
  onUploaded,
  onUploadingChange,
  label = '📁 Upload',
  accept = 'image/*',
  multiple = true,
}: {
  onUploaded: (url: string) => void
  onUploadingChange?: (uploading: boolean) => void
  label?: string
  accept?: string
  multiple?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    onUploadingChange?.(true)
    for (const file of files) {
      setProgress(0)
      try {
        const url = await uploadFile(file, setProgress)
        onUploaded(url)
      } catch (err) {
        alert(String(err))
      }
    }

    setProgress(null)
    onUploadingChange?.(false)
    e.target.value = ''
  }

  const uploading = progress !== null

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-60 shrink-0 flex items-center gap-1.5 min-h-[44px] md:min-h-0"
      >
        {uploading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin shrink-0" />
            {progress! < 100 ? `${progress}%` : 'Processing…'}
          </>
        ) : (
          label
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
    </>
  )
}
