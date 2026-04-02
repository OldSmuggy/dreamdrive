import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase'
import Footer from '@/components/ui/Footer'
import { centsToAud, effectivePrice, activeSpecial } from '@/lib/utils'
import type { Product } from '@/types'
import ImageCarousel from '@/components/ui/ImageCarousel'

// ---- Static feature lists per known product slug ----
const EXTRAS: Record<string, { icon: string; tagline: string; features: string[] }> = {
  'tama': {
    icon: '🪑',
    tagline: 'The family-first van conversion',
    features: [
      '6 rear seat positions with individual 3-point seatbelts',
      'Rear bench folds flat to a full-size sleeping platform',
      'Galley kitchen with sink, fridge space & overhead storage',
      'Full carpet lining and acoustic insulation throughout',
      'Dual-zone climate compatibility ready',
    ],
  },
  'mana': {
    icon: '🏕️',
    tagline: 'Your complete home on the road',
    features: [
      'Full standing room — 1.85m+ interior height',
      'Composting toilet with privacy screen',
      '55L fresh water tank with 12V pump',
      '200AH lithium (LiFePO4) battery system included',
      'Roof vent fan, USB charging & LED lighting throughout',
    ],
  },
  'grid-bed-kit': {
    icon: '🛏️',
    tagline: 'Modular sleeping without the full conversion',
    features: [
      'Quick-release grid rail system — no tools required',
      'Folds up to retain full cargo space during the week',
      'Fits 2WD and 4WD H200 Hiace variants',
      'Compatible with Electrical Cabinet add-on',
      'Ideal for weekenders who need cargo flexibility',
    ],
  },
  'poptop': {
    icon: '🏠',
    tagline: 'Park anywhere. Stand up inside.',
    features: [
      '+600mm internal standing height when raised',
      'Fits standard car park height limits when lowered',
      '10–15 second raise and lower',
      'Fibreglass shell — lightweight and UV-stable',
      'Designed and installed at our Brisbane factory',
    ],
  },
  'elec-cabinet': {
    icon: '⚡',
    tagline: 'The perfect starter electrical package',
    features: [
      '100AH AGM auxiliary battery',
      'Dual battery isolator to protect your starter battery',
      'USB and 12V socket outlets throughout',
      'LED interior lighting circuit',
      'Ideal for weekend trips and day drives',
    ],
  },
  'elec-off-grid': {
    icon: '⚡',
    tagline: 'Full off-grid capability',
    features: [
      '200AH lithium (LiFePO4) battery bank',
      'MPPT solar controller — panel-ready',
      '2000W pure sine wave inverter',
      'Shore power charger (240V hookup)',
      'Suitable for extended remote camping',
    ],
  },
  'elec-pro': {
    icon: '⚡',
    tagline: 'Maximum power for full-time van life',
    features: [
      '300AH lithium battery bank',
      '400W rooftop solar array',
      '3000W pure sine wave inverter',
      'DC-DC charger for alternator top-up on the go',
      'Battery management system (BMS) included',
    ],
  },
}

const CATEGORY_LABEL: Record<string, string> = {
  fitout: 'Fit-Out Package',
  electrical: 'Electrical System',
  poptop: 'Pop Top Roof',
}

export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('products').select('slug').eq('visible', true)
  return (data ?? []).map(p => ({ slug: p.slug }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', params.slug)
    .single()
  if (!data) return { title: 'Product Not Found' }
  return {
    title: data.name,
    description: data.description ?? undefined,
  }
}

export default async function ProductPage({ params, searchParams }: { params: { slug: string }; searchParams: Promise<{ van?: string }> }) {
  const supabase = createAdminClient()
  const [{ data }, resolvedSearchParams] = await Promise.all([
    supabase.from('products').select('*').eq('slug', params.slug).eq('visible', true).single(),
    searchParams,
  ])

  if (!data) notFound()
  const product = data as Product

  const extras = EXTRAS[product.slug]
  const isSpecial = activeSpecial(product)
  const price = effectivePrice(product)
  const categoryLabel = CATEGORY_LABEL[product.category] ?? product.category

  const isFitout = product.category === 'fitout' || product.slug === 'tama' || product.slug === 'mana'
  const vanParam = resolvedSearchParams.van
  const configuratorBase = `https://dreamdrive-configurator-3d.vercel.app/?model=${product.slug === 'mana' ? 'mana' : 'tama'}`
  const configuratorUrl = vanParam
    ? `${configuratorBase}&source=barecamper&van_id=${vanParam}`
    : configuratorBase

  return (
    <div className="min-h-screen">

      {/* ---- Hero ---- */}
      <section className="bg-charcoal text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex items-start gap-6">
            {extras?.icon && (
              <span className="text-5xl md:text-6xl leading-none mt-1">{extras.icon}</span>
            )}
            <div>
              <span className="inline-block bg-charcoal text-ocean text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded mb-4">
                {categoryLabel}
              </span>
              <h1 className="text-4xl md:text-5xl leading-tight mb-3">
                {product.name}
              </h1>
              {extras?.tagline && (
                <p className="text-gray-300 text-lg max-w-xl">{extras.tagline}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Price + CTA ---- */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl text-ocean">
              {price > 0 ? centsToAud(price) : 'Contact for price'}
            </span>
            {isSpecial && product.rrp_aud > 0 && price !== product.rrp_aud && (
              <span className="text-xl text-gray-400 line-through">{centsToAud(product.rrp_aud)}</span>
            )}
            {isSpecial && product.special_label && (
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded">
                🔥 {product.special_label}
              </span>
            )}
            <span className="text-sm text-gray-400">Ex GST</span>
          </div>
          <Link href="/build" className="btn-primary px-7 py-3">
            Add to My Build →
          </Link>
        </div>
      </section>

      {/* ---- Image carousel ---- */}
      {product.images && product.images.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pt-10">
          <ImageCarousel images={product.images} alt={product.name} />
        </section>
      )}

      {/* ---- Description + Features ---- */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl text-charcoal mb-5">About this product</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              {product.description ?? 'Contact us for more information about this product.'}
            </p>

            {isSpecial && product.special_end && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-amber-800">
                  🔥 {product.special_label ?? 'Sale'} — ends {new Date(product.special_end).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-amber-700 mt-1">
                  Save {centsToAud(product.rrp_aud - price)} off the regular price.
                </p>
              </div>
            )}
          </div>

          {extras?.features && (
            <div>
              <h2 className="text-3xl text-charcoal mb-5">What&apos;s included</h2>
              <ul className="space-y-3">
                {extras.features.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="text-ocean font-bold mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ---- CTA section ---- */}
      <section className="bg-cream py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl text-charcoal mb-3">Ready to build?</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Add this to your van build, combine with electrical and a pop top, then book a free
            consultation call to confirm everything.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/build" className="btn-primary text-base px-8 py-4">
              Start My Build →
            </Link>
            {isFitout && (
              <a href={configuratorUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-base px-8 py-4">
                Customise in 3D ↗
              </a>
            )}
            {!isFitout && (
              <Link href="/browse" className="btn-secondary text-base px-8 py-4">
                Browse Vans First
              </Link>
            )}
          </div>
        </div>
      </section>

      <Footer />

    </div>
  )
}
