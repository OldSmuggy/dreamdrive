'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const VEHICLES = [
  {
    id: 'h200_lwb',
    label: 'H200 LWB',
    image: '/images/vans/h200-lwb-icon.png',
    href: '/browse?model=hiace_h200&size=LWB',
    comingSoon: false,
  },
  {
    id: 'h200_slwb',
    label: 'H200 SLWB',
    image: '/images/vans/h200-slwb-icon.png',
    href: '/browse?model=hiace_h200&size=SLWB',
    comingSoon: false,
  },
  {
    id: 'h300_lwb',
    label: '300 LWB',
    image: '/images/vans/300-lwb-icon.png',
    href: '/browse?model=hiace_300&size=LWB',
    comingSoon: true,
  },
  {
    id: 'h300_slwb',
    label: '300 SLWB',
    image: '/images/vans/300-slwb-icon.png',
    href: '/browse?model=hiace_300&size=SLWB',
    comingSoon: true,
  },
]

function VanCard({ v, isHovered, isSiblingHovered, onHover, onLeave }: {
  v: typeof VEHICLES[number]
  isHovered: boolean
  isSiblingHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const sharedStyle: React.CSSProperties = {
    transform: isHovered
      ? 'scale(1.1) translateY(-12px)'
      : isSiblingHovered
      ? 'scale(0.92)'
      : 'scale(1)',
    opacity: isSiblingHovered ? 0.5 : 1,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: isHovered
      ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))'
      : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
  }

  const inner = (
    <>
      {v.comingSoon && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 -rotate-12">
          <span className="bg-sand text-charcoal text-[10px] md:text-xs font-bold px-3 py-1 md:px-4 md:py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-lg">
            Coming Soon
          </span>
        </div>
      )}
      <div
        className="relative w-full aspect-[2/1]"
        style={{ opacity: v.comingSoon ? 0.5 : 1 }}
      >
        <Image
          src={v.image}
          alt={v.label}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 44vw, 320px"
        />
      </div>
      <span
        className="text-xs md:text-sm font-semibold mt-2 transition-all duration-300"
        style={{
          color: isHovered ? '#E8CFA0' : 'rgba(255,255,255,0.6)',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        {v.label}
      </span>
    </>
  )

  if (v.comingSoon) {
    return (
      <div
        className="flex flex-col items-center flex-shrink-0 w-[44%] sm:w-[36%] md:w-auto md:flex-1 md:max-w-[320px] relative cursor-default snap-start"
        style={sharedStyle}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        {inner}
      </div>
    )
  }

  return (
    <Link
      href={v.href}
      className="flex flex-col items-center flex-shrink-0 w-[44%] sm:w-[36%] md:w-auto md:flex-1 md:max-w-[320px] relative snap-start"
      style={sharedStyle}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {inner}
    </Link>
  )
}

export default function VehicleSelector() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="max-w-6xl mx-auto px-4">
      <p
        className="text-center text-white text-sm font-semibold tracking-widest uppercase mb-4"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
      >
        Find Your Base Vehicle
      </p>
      <div className="flex items-end overflow-x-auto snap-x snap-mandatory gap-3 pb-2 -mx-4 px-4 md:justify-center md:overflow-visible md:mx-0 md:px-0 md:gap-6 scrollbar-hide">
        {VEHICLES.map((v) => (
          <VanCard
            key={v.id}
            v={v}
            isHovered={hovered === v.id}
            isSiblingHovered={hovered !== null && hovered !== v.id}
            onHover={() => setHovered(v.id)}
            onLeave={() => setHovered(null)}
          />
        ))}
      </div>
    </div>
  )
}
