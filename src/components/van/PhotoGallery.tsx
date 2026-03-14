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

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [lightboxOpen])

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden bg-[#f5f5f5] aspect-video flex items-center justify-center text-gray-300 text-7xl mb-3">
        🚐
      </div>
    )
  }

  return (
    <>
      {/* Main image */}
      <div
        className="relative rounded-2xl overflow-hidden bg-[#f5f5f5] aspect-video mb-3 cursor-zoom-in"
        onClick={() => openLightbox(activeIndex)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[activeIndex]}
          alt={modelName}
          className="w-full h-full object-contain"
          style={{ objectPosition: focalPoint ?? '50% 50%' }}
        />
        {/* Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full select-none">
            {activeIndex + 1} / {photos.length}
          </div>
        )}
        {/* Expand hint */}
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full select-none opacity-0 hover:opacity-100 transition-opacity">
          Click to expand
        </div>
      </div>

      {/* Scrollable thumbnails */}
      {photos.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p}
              alt=""
              onClick={() => setActiveIndex(i)}
              className="rounded-lg object-cover cursor-pointer shrink-0 transition-opacity"
              style={{
                width: 80,
                height: 60,
                minWidth: 80,
                opacity: i === activeIndex ? 1 : 0.65,
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
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            ×
          </button>

          {/* Left arrow */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); lightboxPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-2xl"
              aria-label="Previous"
            >
              ‹
            </button>
          )}

          {/* Right arrow */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); lightboxNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-2xl"
              aria-label="Next"
            >
              ›
            </button>
          )}

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightboxIndex]}
            alt={modelName}
            onClick={e => e.stopPropagation()}
            className="rounded-lg select-none"
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }}
          />

          {/* Counter */}
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
