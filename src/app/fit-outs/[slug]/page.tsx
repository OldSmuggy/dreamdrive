import { notFound } from 'next/navigation'
import Link from 'next/link'
import ConversionDetails from '@/components/van/ConversionDetails'

const FITOUTS: Record<string, { name: string; desc: string }> = {
  tama: { name: 'TAMA', desc: 'Our entry-level fit-out — functional, lightweight, and designed for weekend warriors.' },
  mana: { name: 'MANA', desc: 'The mid-range build with full cabinetry, premium finishes, and integrated storage.' },
  kuma: { name: 'KUMA', desc: 'Our flagship expedition-spec fit-out. Built to live in for months at a time.' },
  grid: { name: 'Grid Bed Kit', desc: 'A modular flat-pack bed platform with under-bed storage. Install it yourself.' },
  'pop-top': { name: 'Pop Top Conversion', desc: 'Add a fibreglass pop top for standing room and extra sleeping space.' },
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const fo = FITOUTS[params.slug]
  return { title: fo ? fo.name : 'Fit-Out' }
}

export default function FitOutPage({ params }: { params: { slug: string } }) {
  const fo = FITOUTS[params.slug]
  if (!fo) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/fit-outs" className="text-forest-600 text-sm font-medium hover:underline mb-6 inline-block">← All Fit-Outs</Link>
        <h1 className="font-display text-4xl text-forest-900 mb-4">{fo.name}</h1>
        <p className="text-gray-600 text-lg mb-8">{fo.desc}</p>
        {params.slug === 'pop-top' ? (
          <ConversionDetails />
        ) : (
          <div className="bg-sand-50 rounded-2xl p-8 text-center">
            <p className="text-gray-500 mb-4">Full product details coming soon.</p>
            <Link href="/browse" className="btn-primary inline-block">Browse Vans →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
