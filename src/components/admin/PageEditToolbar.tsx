'use client'

import { useState, useEffect, useRef } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  pageSlug: string
  pageName: string
  content: Record<string, string>
  onContentChange: (content: Record<string, string>) => void
  /** Extra editable image keys — e.g. [{ key: 'bed_tama_image', label: 'TAMA Bed Layout' }] */
  extraImages?: { key: string; label: string }[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PageEditToolbar({ pageSlug, pageName, content, onContentChange, extraImages }: Props) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [panel, setPanel]     = useState<'hero' | 'gallery' | 'extra' | null>(null)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  // Draft state for editing
  const [heroImage, setHeroImage]     = useState(content.hero_image ?? '')
  const [heroVideo, setHeroVideo]     = useState(content.hero_video ?? '')
  const [gallery, setGallery]         = useState<string[]>(() => {
    try { return JSON.parse(content.gallery_images || '[]') } catch { return [] }
  })
  const [extraVals, setExtraVals] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const e of extraImages ?? []) m[e.key] = content[e.key] ?? ''
    return m
  })

  // Check admin status
  useEffect(() => {
    const supabase = createSupabaseBrowser()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return
      const u = session.user
      if (u.email?.endsWith('@dreamdrive.life')) { setIsAdmin(true); return }
      supabase.from('profiles').select('is_admin').eq('id', u.id).single()
        .then(({ data }) => { if (data?.is_admin) setIsAdmin(true) })
    })
  }, [])

  // Sync when content prop changes
  useEffect(() => {
    setHeroImage(content.hero_image ?? '')
    setHeroVideo(content.hero_video ?? '')
    try { setGallery(JSON.parse(content.gallery_images || '[]')) } catch { setGallery([]) }
    const m: Record<string, string> = {}
    for (const e of extraImages ?? []) m[e.key] = content[e.key] ?? ''
    setExtraVals(m)
  }, [content, extraImages])

  if (!isAdmin) return null

  const save = async (updates: Record<string, string>) => {
    setSaving(true)
    await fetch(`/api/page-content/${pageSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onContentChange({ ...content, ...updates })
    setPanel(null)
  }

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('path', path)
    const res = await fetch('/api/page-assets/upload', { method: 'POST', body: fd })
    if (!res.ok) return null
    const data = await res.json()
    return data.url
  }

  return (
    <>
      {/* Floating toolbar */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-[#1a3a2a] text-white px-4 py-2.5 flex items-center gap-3 text-sm shadow-lg">
        <span className="font-semibold shrink-0">Admin</span>
        <span className="text-white/50">—</span>
        <span className="text-white/70 truncate">Editing: {pageName}</span>
        <div className="flex-1" />
        <button onClick={() => setPanel(panel === 'hero' ? null : 'hero')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${panel === 'hero' ? 'bg-white text-forest-900' : 'bg-white/15 hover:bg-white/25'}`}>
          Edit Hero
        </button>
        <button onClick={() => setPanel(panel === 'gallery' ? null : 'gallery')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${panel === 'gallery' ? 'bg-white text-forest-900' : 'bg-white/15 hover:bg-white/25'}`}>
          Edit Gallery
        </button>
        {(extraImages ?? []).length > 0 && (
          <button onClick={() => setPanel(panel === 'extra' ? null : 'extra')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${panel === 'extra' ? 'bg-white text-forest-900' : 'bg-white/15 hover:bg-white/25'}`}>
            Edit Images
          </button>
        )}
        {saved && <span className="text-green-300 text-xs">Saved!</span>}
        <button onClick={() => setPanel(null)} className="px-3 py-1 rounded text-xs font-medium bg-white/10 hover:bg-white/20">Done</button>
      </div>

      {/* Spacer so page content isn't hidden under toolbar */}
      <div className="h-10" />

      {/* ── Hero Editor Panel ── */}
      {panel === 'hero' && (
        <EditPanel title="Edit Hero" onClose={() => setPanel(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hero Image</label>
              {heroImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
              )}
              <div className="flex gap-2">
                <FileUploadButton
                  accept="image/*"
                  onUpload={async (file) => {
                    const ext = file.name.split('.').pop() ?? 'jpg'
                    const url = await uploadFile(file, `${pageSlug}/hero.${ext}`)
                    if (url) setHeroImage(url)
                  }}
                  label="Upload Image"
                />
                {heroImage && <button onClick={() => setHeroImage('')} className="text-xs text-red-500 hover:text-red-700">Clear</button>}
              </div>
              <input
                type="text"
                value={heroImage}
                onChange={e => setHeroImage(e.target.value)}
                placeholder="Or paste image URL…"
                className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hero Video <span className="text-gray-400 font-normal">(overrides image)</span></label>
              {heroVideo && <p className="text-xs text-gray-500 truncate mb-1">{heroVideo}</p>}
              <div className="flex gap-2">
                <FileUploadButton
                  accept="video/mp4,video/webm"
                  onUpload={async (file) => {
                    const url = await uploadFile(file, `${pageSlug}/hero-video.mp4`)
                    if (url) setHeroVideo(url)
                  }}
                  label="Upload Video"
                />
                {heroVideo && <button onClick={() => setHeroVideo('')} className="text-xs text-red-500 hover:text-red-700">Clear</button>}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Keep videos under 20MB for fast loading</p>
              <input
                type="text"
                value={heroVideo}
                onChange={e => setHeroVideo(e.target.value)}
                placeholder="Or paste video URL…"
                className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-1.5 text-xs"
              />
            </div>

            <button
              onClick={() => save({ hero_image: heroImage, hero_video: heroVideo })}
              disabled={saving}
              className="w-full btn-primary py-2 text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Hero'}
            </button>
          </div>
        </EditPanel>
      )}

      {/* ── Gallery Editor Panel ── */}
      {panel === 'gallery' && (
        <EditPanel title="Edit Gallery" onClose={() => setPanel(null)}>
          <div className="space-y-3">
            {gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((url, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-20 object-cover rounded" />
                    <button
                      onClick={() => setGallery(g => g.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {i > 0 && (
                      <button
                        onClick={() => {
                          const n = [...gallery]
                          ;[n[0], n[i]] = [n[i], n[0]]
                          setGallery(n)
                        }}
                        className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Set as hero
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <FileUploadButton
              accept="image/*"
              multiple
              onUpload={async (file) => {
                const ext = file.name.split('.').pop() ?? 'jpg'
                const url = await uploadFile(file, `${pageSlug}/gallery-${Date.now()}.${ext}`)
                if (url) setGallery(g => [...g, url])
              }}
              label="+ Add Images"
            />

            <AddByUrlInput onAdd={url => setGallery(g => [...g, url])} />

            <button
              onClick={() => save({ gallery_images: JSON.stringify(gallery) })}
              disabled={saving}
              className="w-full btn-primary py-2 text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : `Save Gallery (${gallery.length} images)`}
            </button>
          </div>
        </EditPanel>
      )}

      {/* ── Extra Images Panel ── */}
      {panel === 'extra' && (extraImages ?? []).length > 0 && (
        <EditPanel title="Edit Images" onClose={() => setPanel(null)}>
          <div className="space-y-4">
            {(extraImages ?? []).map(ei => (
              <div key={ei.key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{ei.label}</label>
                {extraVals[ei.key] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={extraVals[ei.key]} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                )}
                <div className="flex gap-2">
                  <FileUploadButton
                    accept="image/*"
                    onUpload={async (file) => {
                      const ext = file.name.split('.').pop() ?? 'jpg'
                      const url = await uploadFile(file, `${pageSlug}/${ei.key}.${ext}`)
                      if (url) setExtraVals(v => ({ ...v, [ei.key]: url }))
                    }}
                    label="Upload"
                  />
                  {extraVals[ei.key] && (
                    <button onClick={() => setExtraVals(v => ({ ...v, [ei.key]: '' }))} className="text-xs text-red-500">Clear</button>
                  )}
                </div>
                <input
                  type="text"
                  value={extraVals[ei.key] ?? ''}
                  onChange={e => setExtraVals(v => ({ ...v, [ei.key]: e.target.value }))}
                  placeholder="Or paste URL…"
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
            ))}
            <button
              onClick={() => save(extraVals)}
              disabled={saving}
              className="w-full btn-primary py-2 text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Images'}
            </button>
          </div>
        </EditPanel>
      )}
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EditPanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed top-10 right-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-2xl z-[99] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function FileUploadButton({
  accept,
  multiple,
  onUpload,
  label,
}: {
  accept: string
  multiple?: boolean
  onUpload: (file: File) => Promise<void>
  label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      await onUpload(files[i])
    }
    setUploading(false)
    if (ref.current) ref.current.value = ''
  }

  return (
    <>
      <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleChange} />
      <button
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="text-xs px-3 py-1.5 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : label}
      </button>
    </>
  )
}

function AddByUrlInput({ onAdd }: { onAdd: (url: string) => void }) {
  const [url, setUrl] = useState('')
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Paste image URL…"
        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs"
      />
      <button
        onClick={() => { if (url.trim()) { onAdd(url.trim()); setUrl('') } }}
        disabled={!url.trim()}
        className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        Add
      </button>
    </div>
  )
}

// ── Helper: Editable Image Placeholder ────────────────────────────────────────
// Use this on fit-out pages where "photo coming soon" placeholders exist

export function EditableImage({
  src,
  alt,
  className,
  placeholderText,
  isAdmin,
  onEdit,
}: {
  src: string | null | undefined
  alt: string
  className?: string
  placeholderText?: string
  isAdmin?: boolean
  onEdit?: () => void
}) {
  if (src) {
    return (
      <div className={`relative group ${className ?? ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        {isAdmin && onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
          >
            ✏️
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={`bg-gray-100 flex items-center justify-center text-center ${className ?? ''} ${isAdmin && onEdit ? 'cursor-pointer hover:bg-gray-200 transition-colors' : ''}`}
      onClick={isAdmin && onEdit ? onEdit : undefined}
    >
      <div>
        <p className="text-gray-400 text-sm">{placeholderText ?? 'Photo coming soon'}</p>
        {isAdmin && onEdit && <p className="text-forest-600 text-xs mt-1 font-medium">Click to add image</p>}
      </div>
    </div>
  )
}
