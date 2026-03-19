'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'

interface Props {
  photos: string[]
  modelName: string
  focalPoint?: string | null
  isAuction?: boolean
  contactPhone?: string | null
}

export default function PhotoGallery({ photos, modelName, focalPoint, isAuction, contactPhone }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isBlurred, setIsBlurred] = useState(isAuction ?? false)
  const pathname = usePathname()

  // Lift blur once we confirm user is logged in
  useEffect(() => {
    if (!isAuction) return
    const supabase = createSupabaseBrowser()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsBlurred(false)
    })
  }, [isAuction])

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
      <div className="rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center text-gray-300 text-7xl mb-3 h-[300px] md:h-[500px]">
        🚐
      </div>
    )
  }

  const loginUrl = `/login?next=${encodeURIComponent(pathname ?? '')}`

  return (
    <>
      {/* Main image — responsive height, cover, click to open lightbox */}
      <div
        className="relative rounded-2xl overflow-hidden mb-3 h-[400px] md:h-[500px] w-full"
        style={{ cursor: isBlurred ? 'default' : 'zoom-in' }}
        onClick={() => !isBlurred && openLightbox(activeIndex)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[activeIndex]}
          alt={modelName}
          className={`w-full h-full object-cover transition-all duration-300 ${isBlurred ? 'blur-xl scale-110' : ''}`}
          style={{ objectPosition: focalPoint ?? 'center' }}
        />
        {/* Auction blur overlay */}
        {isBlurred && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            style={{ background: 'rgba(15, 40, 25, 0.65)', backdropFilter: 'blur(4px)' }}
          >
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-white text-xl mb-1">Create a free account to view all photos</p>
            <p className="text-white/70 text-sm mb-4">Takes 30 seconds — no credit card needed</p>
            {contactPhone && (
              <a
                href={`tel:${contactPhone.replace(/\s/g, '')}`}
                className="text-sand font-medium mb-4 hover:text-sand transition-colors block"
                style={{ fontSize: '1.5rem' }}
                onClick={e => e.stopPropagation()}
              >
                {contactPhone}
              </a>
            )}
            <a
              href={loginUrl}
              className="bg-ocean text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-ocean transition-colors"
              onClick={e => e.stopPropagation()}
            >
              Sign Up Free
            </a>
            <a
              href={loginUrl}
              className="text-white/60 text-xs mt-3 hover:text-white/80 block"
              onClick={e => e.stopPropagation()}
            >
              Already have an account? Sign in
            </a>
          </div>
        )}
        {/* Counter + view full size */}
        {!isBlurred && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <a
              href={photos[activeIndex]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full select-none hover:bg-black/80 transition-colors"
            >
              View full size
            </a>
            {photos.length > 1 && (
              <span className="bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full select-none">
                {activeIndex + 1} / {photos.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail grid */}
      {!isBlurred && photos.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p}
              alt=""
              onClick={() => setActiveIndex(i)}
              className="w-full rounded-lg object-cover cursor-pointer transition-opacity"
              style={{
                height: 80,
                opacity: i === activeIndex ? 1 : 0.65,
                outline: i === activeIndex ? '2px solid #2C2C2A' : '2px solid transparent',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      )}
      {/* Blurred thumbnail strip */}
      {isBlurred && photos.length > 1 && (
        <div className="relative">
          <div className="grid grid-cols-4 gap-2">
            {photos.slice(0, 4).map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={i} className="relative rounded-lg overflow-hidden" style={{ height: 80 }}>
                <img src={p} alt="" className="w-full h-full object-cover blur-md scale-110" />
                <div className="absolute inset-0 bg-charcoal/50 flex items-center justify-center">
                  <span className="text-white/80 text-lg">🔒</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <a href={loginUrl} className="text-sm text-ocean hover:underline font-medium">
              {photos.length} photos — sign up to view
            </a>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            &times;
          </button>

          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); lightboxPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-2xl"
              aria-label="Previous"
            >
              &lsaquo;
            </button>
          )}

          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); lightboxNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-2xl"
              aria-label="Next"
            >
              &rsaquo;
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

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {photos.length > 1 && (
              <span className="bg-black/60 text-white text-sm font-medium px-3 py-1.5 rounded-full select-none">
                {lightboxIndex + 1} / {photos.length}
              </span>
            )}
            <a
              href={photos[lightboxIndex]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="bg-white/15 text-white text-sm font-medium px-3 py-1.5 rounded-full select-none hover:bg-white/25 transition-colors"
            >
              Open full size
            </a>
          </div>
        </div>
      )}
    </>
  )
}
