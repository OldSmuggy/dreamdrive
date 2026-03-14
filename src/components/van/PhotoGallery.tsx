'use client'

import { useState, useEffect, useCallback } from 'react'

interface Props {
  photos: string[]
  modelName: string
  focalPoint?: string | null
}

export default function PhotoGallery({ photos, modelName, focalPoint }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const lightboxPrev = useCallback(() => {
    setLightboxIndex(i => (i === 0 ? photos.length - 1 : i - 1))
  }, [photos.length])

  const lightboxNext = useCallback(() => {
    setLightboxIndex(i => (i === photos.length - 1 ? 0 : i + 1))
  }, [photos.length])

  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
      if (e.key === 'Escape')     closeLightbox()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxOpen, lightboxPrev, lightboxNext])

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxOpen])

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center text-gray-300 text-7xl mb-3" style={{ height: 400 }}>
        🚐
      </div>
    )
  }

  return (
    <>
      {/* Main image — fixed height, cover, click to open lightbox */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-zoom-in mb-3"
        style={{ height: 400 }}
        onClick={() => openLightbox(activeIndex)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[activeIndex]}
          alt={modelName}
          className="w-full h-full object-cover"
          style={{ objectPosition: focalPoint ?? 'center' }}
        />
        {/* Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full select-none">
            {activeIndex + 1} / {photos.length}
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full select-none opacity-0 group-hover:opacity-100 transition-opacity">
          Click to expand
        </div>
      </div>

      {/* Thumbnail grid */}
      {photos.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p}
              alt=""
              onClick={() => setActiveIndex(i)}
              className="w-full rounded object-cover cursor-pointer transition-opacity"
              style={{
                height: 100,
                opacity: i === activeIndex ? 1 : 0.72,
                outline: i === activeIndex ? '2px solid #1a3a2a' : '2px solid transparent',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            ×
          </button>

          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); lightboxPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-2xl"
              aria-label="Previous"
            >
              ‹
            </button>
          )}

          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); lightboxNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-2xl"
              aria-label="Next"
            >
              ›
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightboxIndex]}
            alt={modelName}
            onClick={e => e.stopPropagation()}
            className="rounded-lg select-none"
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }}
          />

          {photos.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm font-medium px-3 py-1.5 rounded-full select-none">
              {lightboxIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
