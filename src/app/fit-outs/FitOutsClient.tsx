'use client'

import { useState } from 'react'
import Link from 'next/link'
import PageEditToolbar from '@/components/admin/PageEditToolbar'
import FitoutHero from '@/components/admin/FitoutHero'

const FITOUTS = [
  {
    slug: 'tama',
    name: 'TAMA Pop Top',
    price: 'From $109,000 driveaway',
    desc: 'The perfect family campervan — 6 seats, sleeps 4, full galley kitchen.',
    image: 'https://images.squarespace-cdn.com/content/v1/6452ed7189507b42ec70bffd/e33c93ae-b139-4367-b43c-2cd96fa2c5ec/IMG_0908.jpg',
  },
  {
    slug: 'mana',
    name: 'MANA Pop Top',
    price: 'From $107,000 driveaway',
    desc: 'Built for couples and solo adventurers — sleeps 2, full kitchen, toilet and shower.',
    image: 'https://images.squarespace-cdn.com/content/v1/6452ed7189507b42ec70bffd/d6b9a9af-7080-46b6-9d0c-03a76d5bf323/IMG_3103.jpeg',
  },
  {
    slug: 'kumaq',
    name: 'KUMAQ',
    price: 'Enquire for pricing',
    desc: 'The ultimate adventure van — Super Long Wheelbase, sleeps 4, full off-road capability.',
    image: 'https://images.squarespace-cdn.com/content/v1/6452ed7189507b42ec70bffd/1683156338722-2KFOTMHKJGX47F9YGRQD/DSC06470.jpg',
  },
]

const STATIC_HERO = '' // Original page has no hero image — uses solid bg

export default function FitOutsClient({ content: initial }: { content: Record<string, string> }) {
  const [content, setContent] = useState(initial)

  const gallery: string[] = (() => { try { return JSON.parse(content.gallery_images || '[]') } catch { return [] } })()

  return (
    <div className="min-h-screen">
      <PageEditToolbar
        pageSlug="fit-outs"
        pageName="Fit-Out Range"
        content={content}
        onContentChange={setContent}
      />

      {/* Hero */}
      <FitoutHero fallbackImage={content.hero_image || STATIC_HERO} heroImage={content.hero_image} heroVideo={content.hero_video}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sand-400 text-sm font-semibold uppercase tracking-widest mb-3">Dream Drive</p>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-5">Dream Drive Fit-Out Range</h1>
          <p className="text-white/70 text-lg md:text-xl leading-relaxed">
            Purpose-built campervans handcrafted in Japan.<br className="hidden sm:block" />
            Every build designed for Australian adventure.
          </p>
        </div>
      </FitoutHero>

      {/* Gallery (if images uploaded) */}
      {gallery.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gallery.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt={`Fit-outs gallery ${i + 1}`} className="w-full h-48 object-cover rounded-xl" />
            ))}
          </div>
        </section>
      )}

      {/* Product cards */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {FITOUTS.map(f => (
            <Link
              key={f.slug}
              href={`/fit-outs/${f.slug}`}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group"
            >
              <div className="relative h-56 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.image}
                  alt={f.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h2 className="font-display text-2xl text-forest-900 mb-1">{f.name}</h2>
                <p className="text-sand-600 text-sm font-semibold mb-3">{f.price}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">{f.desc}</p>
                <span className="inline-flex items-center gap-1 text-forest-700 text-sm font-semibold group-hover:gap-2 transition-all">
                  View details <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-sand-50 border-t border-sand-200">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-3xl text-forest-900 mb-3">Not sure which fit-out is right for you?</h2>
          <p className="text-gray-600 mb-8">Answer a few quick questions and we&apos;ll match you with the perfect build.</p>
          <Link href="/quiz" className="btn-primary text-base px-8 py-3 inline-block">
            Take the Van Quiz →
          </Link>
        </div>
      </section>
    </div>
  )
}
