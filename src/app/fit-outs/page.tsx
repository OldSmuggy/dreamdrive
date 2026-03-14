import Link from 'next/link'
export const metadata = { title: 'Fit-Outs' }

const FITOUTS = [
  { slug: 'tama', name: 'TAMA', desc: 'Our entry-level fit-out — functional, lightweight, and designed for weekend warriors.' },
  { slug: 'mana', name: 'MANA', desc: 'The mid-range build with full cabinetry, premium finishes, and integrated storage.' },
  { slug: 'kuma', name: 'KUMA', desc: 'Our flagship expedition-spec fit-out. Built to live in for months at a time.' },
  { slug: 'grid', name: 'Grid Bed Kit', desc: 'A modular flat-pack bed platform with under-bed storage. Install it yourself.' },
  { slug: 'pop-top', name: 'Pop Top Conversion', desc: 'Add a fibreglass pop top for standing room and extra sleeping space.' },
]

export default function FitOutsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="font-display text-4xl text-forest-900 mb-4">Fit-Outs</h1>
        <p className="text-gray-600 text-lg mb-10">Every build starts with the right fit-out. Choose the one that suits your lifestyle.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FITOUTS.map(f => (
            <Link key={f.slug} href={`/fit-outs/${f.slug}`}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow group">
              <h2 className="font-display text-2xl text-forest-800 mb-2 group-hover:text-forest-600">{f.name}</h2>
              <p className="text-gray-600 text-sm">{f.desc}</p>
              <span className="inline-block mt-4 text-forest-600 text-sm font-semibold">View details →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
