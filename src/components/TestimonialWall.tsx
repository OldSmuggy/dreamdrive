'use client'

import Image from 'next/image'

// ── Partner logos (text-based with coloured dots) ────────────────────────────
const PARTNERS = [
  { name: 'Camplify', color: '#E85D3A' },
  { name: 'Ironman 4x4', color: '#D4A017' },
  { name: 'KickAss Products', color: '#2D8B4E' },
  { name: 'DIY RV Solutions', color: '#3D6B73' },
  { name: 'Dream Drive', color: '#2C2C2A' },
  { name: 'FLEX', color: '#1A1A1A' },
  { name: 'Caravan Camping QLD', color: '#5B8A7A' },
  { name: 'JRVA', color: '#8B7355' },
  { name: 'Stratton Finance', color: '#2A3A32' },
]

// ── Customer photos ─────────────────────────────────────────────────────────
const CUSTOMERS = [
  { src: '/testimonials/eric.jpg', name: 'Eric' },
  { src: '/testimonials/liam.jpg', name: 'Liam & family' },
  { src: '/testimonials/hana_josiah.jpg', name: 'Hana & Josiah' },
  { src: '/testimonials/sal.jpg', name: 'Sal & family' },
  { src: '/testimonials/luke.jpg', name: 'Luke' },
  { src: '/testimonials/richard_trish.jpg', name: 'Richard & Trish' },
  { src: '/testimonials/kate_luke.jpg', name: 'Kate & Luke' },
  { src: '/testimonials/jack_sam.jpg', name: 'Jack & Sam' },
  { src: '/testimonials/brad.jpg', name: 'Brad' },
  { src: '/testimonials/joel_mis.jpg', name: 'Joel & Mis' },
  { src: '/testimonials/japan_customer.jpg', name: 'Dream Drive Japan' },
]

// Distribute photos across 3 columns for masonry effect
function masonryColumns<T>(items: T[], cols: number): T[][] {
  const columns: T[][] = Array.from({ length: cols }, () => [])
  items.forEach((item, i) => columns[i % cols].push(item))
  return columns
}

// ── Logo Ticker ─────────────────────────────────────────────────────────────
function LogoTicker() {
  // Double the list for seamless infinite scroll
  const doubled = [...PARTNERS, ...PARTNERS]

  return (
    <div className="relative overflow-hidden py-6 border-y border-stone-200 bg-stone-50">
      <div className="flex animate-ticker whitespace-nowrap">
        {doubled.map((p, i) => (
          <span
            key={`${p.name}-${i}`}
            className="inline-flex items-center gap-2 px-6 text-sm font-medium text-stone-500 shrink-0"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Photo Card ──────────────────────────────────────────────────────────────
function PhotoCard({ src, name }: { src: string; name: string }) {
  return (
    <div className="relative group rounded-xl overflow-hidden mb-3">
      <Image
        src={src}
        alt={`${name} — Bare Camper customer`}
        width={600}
        height={400}
        className="w-full h-auto object-cover"
        sizes="(max-width: 768px) 50vw, 33vw"
      />
      {/* Name pill — always visible */}
      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
        {name}
      </span>
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <span className="text-white text-lg font-bold">{name}</span>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function TestimonialWall() {
  const desktopCols = masonryColumns(CUSTOMERS, 3)
  const mobileCols = masonryColumns(CUSTOMERS, 2)

  return (
    <section className="py-16 md:py-24">
      {/* Header */}
      <div className="text-center mb-10 px-4">
        <p className="text-stone-500 text-xs uppercase tracking-widest mb-2">
          Trusted by adventurers &amp; industry leaders
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold text-stone-900">
          Real vans. Real people. Real stories.
        </h2>
      </div>

      {/* Logo ticker */}
      <LogoTicker />

      {/* Photo grid — desktop: 3 cols, mobile: 2 cols */}
      <div className="max-w-6xl mx-auto px-4 mt-10">
        {/* Desktop */}
        <div className="hidden md:grid grid-cols-3 gap-3">
          {desktopCols.map((col, colIdx) => (
            <div key={colIdx}>
              {col.map((customer) => (
                <PhotoCard key={customer.name} {...customer} />
              ))}
            </div>
          ))}
        </div>

        {/* Mobile */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
          {mobileCols.map((col, colIdx) => (
            <div key={colIdx}>
              {col.map((customer) => (
                <PhotoCard key={customer.name} {...customer} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
