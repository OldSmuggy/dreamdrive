'use client'

import { useRef, useState } from 'react'

function uploadWithProgress(
  file: File,
  onProgress: (pct: number) => void
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

export default function PhotoUploadButton({
  onUploaded,
  onUploadingChange,
  label = '📁 Upload',
}: {
  onUploaded: (url: string) => void
  onUploadingChange?: (uploading: boolean) => void
  label?: string
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
        const url = await uploadWithProgress(file, setProgress)
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
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </>
  )
}
