'use client'

import { useState } from 'react'

interface Props {
  photos: string[]
  modelName: string
  focalPoint?: string | null
}

export default function VanGallery({ photos, modelName, focalPoint }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (photos.length === 0) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-[#f5f5f5] aspect-video mb-3 flex items-center justify-center text-gray-300 text-7xl">
        🚐
      </div>
    )
  }

  return (
    <div>
      {/* Main image */}
      <div className="relative rounded-2xl overflow-hidden bg-[#f5f5f5] aspect-video mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[activeIndex]}
          alt={modelName}
          className="w-full h-full object-contain"
          style={{ objectPosition: focalPoint ?? '50% 50%' }}
        />
        {/* Photo counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {activeIndex + 1} / {photos.length}
          </div>
        )}
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
              className={`rounded-lg object-cover cursor-pointer shrink-0 transition-opacity ${
                i === activeIndex ? 'ring-2 ring-forest-600 opacity-100' : 'opacity-75 hover:opacity-100'
              }`}
              style={{ width: 80, height: 60, minWidth: 80 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
