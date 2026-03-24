'use client'

import Image from 'next/image'

/**
 * Renders the hero section for a fit-out page.
 * Uses DB content for hero image/video when available, falls back to static image.
 */
export default function FitoutHero({
  fallbackImage,
  heroImage,
  heroVideo,
  children,
}: {
  fallbackImage: string
  heroImage?: string
  heroVideo?: string
  children: React.ReactNode
}) {
  const bgImage = heroImage || fallbackImage
  const hasVideo = !!heroVideo

  return (
    <section className="relative bg-charcoal overflow-hidden">
      <div className="absolute inset-0">
        {hasVideo ? (
          <video
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-30"
          />
        ) : bgImage ? (
          <Image src={bgImage} alt="" fill className="object-cover opacity-60" sizes="100vw" priority />
        ) : null}
      </div>
      <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
        {children}
      </div>
    </section>
  )
}
