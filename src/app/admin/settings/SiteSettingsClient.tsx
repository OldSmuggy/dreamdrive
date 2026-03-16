'use client'

import { useState, useRef } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

interface Props {
  logoUrl: string
  heroVideoUrl: string
  heroVideoPoster: string
  siteName: string
}

const STORAGE_BUCKET = 'site-assets'

async function saveSetting(key: string, value: string) {
  const res = await fetch('/api/site-settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  })
  if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
}

export default function SiteSettingsClient({ logoUrl: initLogoUrl, heroVideoUrl: initVideoUrl, heroVideoPoster: initPoster, siteName: initSiteName }: Props) {
  // Logo
  const [logoUrl, setLogoUrl] = useState(initLogoUrl)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const [logoSaved, setLogoSaved] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Hero video
  const [videoUrl, setVideoUrl] = useState(initVideoUrl)
  const [poster, setPoster] = useState(initPoster)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [posterUploading, setPosterUploading] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [videoSaved, setVideoSaved] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)

  // Site name
  const [siteName, setSiteName] = useState(initSiteName)
  const [siteNameSaving, setSiteNameSaving] = useState(false)
  const [siteNameSaved, setSiteNameSaved] = useState(false)

  // ---- Logo ----
  const handleLogoUpload = async (file: File) => {
    setLogoError('')
    if (file.size > 2 * 1024 * 1024) { setLogoError('Max file size is 2MB'); return }
    const allowed = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
    if (!allowed.includes(file.type)) { setLogoError('Accepted formats: PNG, SVG, JPG, WEBP'); return }
    setLogoUploading(true)
    try {
      const supabase = createSupabaseBrowser()
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `logo/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw new Error(uploadError.message)
      const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      await saveSetting('logo_url', publicUrl)
      setLogoUrl(publicUrl + '?t=' + Date.now())
      setLogoSaved(true)
      setTimeout(() => setLogoSaved(false), 3000)
    } catch (e) {
      setLogoError(String(e))
    } finally {
      setLogoUploading(false)
    }
  }

  const handleLogoRemove = async () => {
    await saveSetting('logo_url', '')
    setLogoUrl('')
    setLogoSaved(true)
    setTimeout(() => setLogoSaved(false), 3000)
  }

  // ---- Hero Video — XHR upload for progress ----
  const uploadWithProgress = (
    url: string,
    file: File,
    token: string,
    onProgress: (pct: number) => void,
  ): Promise<void> => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.send(file)
  })

  const handleVideoUpload = async (file: File) => {
    setVideoError('')
    if (!file.type.startsWith('video/')) { setVideoError('Please upload a video file'); return }
    setVideoUploading(true)
    setVideoProgress(0)
    try {
      const supabase = createSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const path = 'hero/hero-video.mp4'
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${path}`
      await uploadWithProgress(uploadUrl, file, token, setVideoProgress)
      const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      const finalUrl = publicUrl + '?t=' + Date.now()
      setVideoUrl(finalUrl)
      await saveSetting('hero_video_url', finalUrl)
      setVideoSaved(true)
      setTimeout(() => setVideoSaved(false), 4000)
    } catch (e) {
      setVideoError(String(e))
    } finally {
      setVideoUploading(false)
      setVideoProgress(0)
    }
  }

  const handlePosterUpload = async (file: File) => {
    setVideoError('')
    if (!file.type.startsWith('image/')) { setVideoError('Please upload an image file for the poster'); return }
    setPosterUploading(true)
    try {
      const supabase = createSupabaseBrowser()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `hero/hero-poster.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw new Error(uploadError.message)
      const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      const finalUrl = publicUrl + '?t=' + Date.now()
      setPoster(finalUrl)
      await saveSetting('hero_video_poster', finalUrl)
    } catch (e) {
      setVideoError(String(e))
    } finally {
      setPosterUploading(false)
    }
  }

  const handleVideoUrlSave = async () => {
    setVideoError('')
    try {
      await saveSetting('hero_video_url', videoUrl)
      setVideoSaved(true)
      setTimeout(() => setVideoSaved(false), 3000)
    } catch (e) {
      setVideoError(String(e))
    }
  }

  const handleVideoRemove = async () => {
    await Promise.all([
      saveSetting('hero_video_url', ''),
      saveSetting('hero_video_poster', ''),
    ])
    setVideoUrl('')
    setPoster('')
    setVideoSaved(true)
    setTimeout(() => setVideoSaved(false), 3000)
  }

  // ---- Site Name ----
  const handleSiteNameSave = async () => {
    setSiteNameSaving(true)
    try {
      await saveSetting('site_name', siteName)
      setSiteNameSaved(true)
      setTimeout(() => setSiteNameSaved(false), 3000)
    } finally {
      setSiteNameSaving(false)
    }
  }

  return (
    <div className="space-y-8">

      {/* ---- Logo ---- */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-display text-xl text-forest-900 mb-1">Logo</h2>
        <p className="text-gray-500 text-sm mb-5">Upload your site logo. Accepted: PNG, SVG, JPG, WEBP — max 2MB. If no logo is set, the site name text is used.</p>

        {/* Preview */}
        {logoUrl && (
          <div className="mb-4 p-4 bg-forest-950 rounded-xl inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Logo preview" style={{ maxWidth: 200, height: 40, objectFit: 'contain' }} />
          </div>
        )}
        {!logoUrl && (
          <div className="mb-4 p-4 bg-forest-950 rounded-xl inline-block">
            <span className="font-display text-xl text-sand-400">Dream Drive</span>
            <p className="text-white/40 text-xs mt-1">Fallback text (no logo set)</p>
          </div>
        )}

        {/* Current URL */}
        {logoUrl && (
          <p className="text-xs text-gray-400 font-mono break-all mb-4">{logoUrl.split('?')[0]}</p>
        )}

        {logoError && <p className="text-red-600 text-sm mb-3">{logoError}</p>}
        {logoSaved && <p className="text-forest-700 text-sm font-medium mb-3">✓ Logo updated</p>}

        <div className="flex flex-wrap gap-3">
          <input
            ref={logoInputRef}
            type="file"
            accept=".png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
          />
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={logoUploading}
            className="text-sm px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 font-semibold"
          >
            {logoUploading ? 'Uploading…' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
          </button>
          {logoUrl && (
            <button
              onClick={handleLogoRemove}
              className="text-sm px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              Remove Logo
            </button>
          )}
        </div>
      </section>

      {/* ---- Hero Video ---- */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-display text-xl text-forest-900 mb-1">Hero Video</h2>
        <p className="text-gray-500 text-sm mb-5">
          Background video for the homepage hero. If no video is set, the static forest-green background is used.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 mb-5">
          ⚠ Large videos (&gt;50MB) may load slowly for users. We recommend keeping hero videos under 20MB.
        </div>

        {/* Bucket setup note */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-600 font-mono mb-5">
          If uploads fail, run in Supabase SQL Editor:<br />
          <code>INSERT INTO storage.buckets (id, name, public) VALUES (&apos;site-assets&apos;, &apos;site-assets&apos;, true) ON CONFLICT DO NOTHING;</code>
        </div>

        {videoError && <p className="text-red-600 text-sm mb-3">{videoError}</p>}
        {videoSaved && <p className="text-forest-700 text-sm font-medium mb-3">✓ Saved</p>}

        {/* Paste URL */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Video URL (MP4)</label>
          <p className="text-xs text-gray-400 mb-2">Paste a direct MP4 URL from Cloudflare, S3, or any CDN.</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleVideoUrlSave}
              className="text-sm px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 font-semibold shrink-0"
            >
              Save URL
            </button>
          </div>
        </div>

        {/* Upload video */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Video File</label>
          {videoUploading && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading…</span>
                <span>{videoProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-forest-600 h-2 rounded-full transition-all"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f) }}
          />
          <button
            onClick={() => videoInputRef.current?.click()}
            disabled={videoUploading}
            className="text-sm px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {videoUploading ? 'Uploading…' : 'Upload Video to Storage'}
          </button>
        </div>

        {/* Poster image */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Poster / Thumbnail</label>
          <p className="text-xs text-gray-400 mb-2">Shown while video loads, especially on mobile. Optional.</p>
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="Poster preview" className="rounded-lg mb-2 object-cover" style={{ maxWidth: 320, height: 180 }} />
          )}
          <input
            ref={posterInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePosterUpload(f) }}
          />
          <button
            onClick={() => posterInputRef.current?.click()}
            disabled={posterUploading}
            className="text-sm px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {posterUploading ? 'Uploading…' : poster ? 'Replace Poster' : 'Upload Poster Image'}
          </button>
        </div>

        {/* Inline preview */}
        {videoUrl && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
            <video
              src={videoUrl}
              poster={poster || undefined}
              controls
              muted
              className="rounded-xl w-full max-w-lg"
              style={{ maxHeight: 280, objectFit: 'cover' }}
            />
          </div>
        )}

        {videoUrl && (
          <button
            onClick={handleVideoRemove}
            className="text-sm px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            Remove Video
          </button>
        )}
      </section>

      {/* ---- Site Name ---- */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-display text-xl text-forest-900 mb-1">Site Name</h2>
        <p className="text-gray-500 text-sm mb-5">Used in page titles and as fallback text when no logo is set.</p>
        <div className="flex gap-2 max-w-sm">
          <input
            type="text"
            value={siteName}
            onChange={e => setSiteName(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Dream Drive"
          />
          <button
            onClick={handleSiteNameSave}
            disabled={siteNameSaving}
            className="text-sm px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 font-semibold shrink-0"
          >
            {siteNameSaving ? 'Saving…' : siteNameSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </section>
    </div>
  )
}
