import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase'
import { centsToAud } from '@/lib/utils'
import LeadFormModal from '@/components/leads/LeadFormModal'
import type { Build } from '@/types'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `Build #${params.slug} | Dream Drive`,
    description: 'View this custom campervan build from Dream Drive. Configure your own or enquire about this one.',
    openGraph: {
      title: `Custom Campervan Build | Dream Drive`,
      description: 'A custom campervan build from Dream Drive. Browse, configure, or get in touch.',
    },
  }
}

export default async function BuildSharePage({ params }: Props) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('builds')
    .select(`
      *,
      listing:listing_id(*),
      fitout_product:fitout_product_id(*),
      elec_product:elec_product_id(*),
      poptop_product:poptop_product_id(*)
    `)
    .eq('share_slug', params.slug)
    .single()

  if (!data) notFound()

  const build = data as Build
  const fitout = build.fitout_product
  const elec = build.elec_product
  const poptop = build.poptop_product
  const van = build.listing

  const total = build.total_aud_min ?? 0
  const fitoutName = fitout?.name ?? (fitout ? 'Conversion' : null)
  const isTamaMana = fitout?.slug === 'tama' || fitout?.slug === 'mana'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-forest-950 text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-white">Dream Drive</Link>
          <Link href="/configurator" className="btn-ghost btn-sm text-sm">
            Build One Like This →
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <p className="text-gray-500 text-sm mb-1">Shared Build</p>
          <h1 className="font-display text-3xl text-forest-900">Custom Campervan Build</h1>
          <p className="text-gray-400 text-xs mt-1">
            Created {new Date(build.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-5 lg:gap-8 lg:items-start">

          {/* ── Left: build details ── */}
          <div className="lg:col-span-3 space-y-4 mb-6 lg:mb-0">

            {/* Van */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Van</h3>
              </div>
              <div className="px-5 py-4">
                {van ? (
                  <div className="flex items-start gap-3">
                    {van.photos?.[0] && (
                      <img src={van.photos[0]} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 leading-tight">{van.model_name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {van.model_year && `${van.model_year} · `}
                        {van.mileage_km ? `${van.mileage_km.toLocaleString()} km` : ''}
                      </p>
                      {van.source === 'auction' && (
                        <span className="badge-auction text-xs mt-1 inline-block">Auction</span>
                      )}
                      {van.source === 'au_stock' && (
                        <span className="badge-au-stock text-xs mt-1 inline-block">AU Stock</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Van to be sourced — contact us to find one.</p>
                )}
              </div>
            </div>

            {/* Conversion */}
            {fitout && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Conversion</h3>
                </div>
                <div className="px-5 py-4 space-y-2">
                  <p className="font-semibold text-gray-900">{fitoutName}</p>
                  {elec && (
                    <p className="text-sm text-gray-600">⚡ {elec.name}</p>
                  )}
                  {poptop && (
                    <p className="text-sm text-gray-600">🔼 {poptop.name}</p>
                  )}
                  {build.poptop_japan && (
                    <p className="text-xs text-gray-400">Pop top fitted in Brisbane after Japan shipping</p>
                  )}
                </div>
              </div>
            )}

            {/* Notice */}
            <div className="bg-forest-50 border border-forest-200 rounded-xl px-4 py-3 text-sm text-forest-800">
              This is a shared build configuration. Prices are indicative — confirmed at consultation.
            </div>
          </div>

          {/* ── Right: price + CTA ── */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-24">

            {/* Price card */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-forest-950 text-white px-5 py-4">
                <h3 className="font-display text-xl">Estimated Price</h3>
                <p className="text-white/60 text-xs mt-0.5">Confirmed at consultation</p>
              </div>
              <div className="px-5 py-5">
                {total > 0 ? (
                  <>
                    <p className="font-display text-4xl text-forest-700">{centsToAud(total)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isTamaMana ? 'Van + full conversion included.' : 'Estimate. Van price based on current exchange rates.'}
                      {' '}All prices AUD incl. GST.
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">Price to be confirmed at consultation.</p>
                )}
              </div>
            </div>

            {/* CTAs */}
            <LeadFormModal
              trigger="Enquire About This Build"
              source={`share_page_${params.slug}`}
              buildSlug={params.slug}
              className="btn-primary w-full py-3 text-center"
            />

            <Link
              href={fitout?.slug ? `/configurator?fitout=${fitout.slug}` : '/configurator'}
              className="btn-secondary w-full py-3 text-center block"
            >
              Build One Like This →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
