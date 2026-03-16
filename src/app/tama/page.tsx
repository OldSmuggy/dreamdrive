import Link from 'next/link'

export const metadata = { title: 'TAMA — Dream Drive' }

export default function TamaPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <p className="text-sand-500 text-sm font-semibold tracking-widest uppercase mb-4">Dream Drive Fit-Out</p>
        <h1 className="font-display text-5xl md:text-6xl text-forest-900 mb-6">TAMA</h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          6-seater family conversion. Rear seat folds flat to a queen bed. Galley kitchen, sink &amp; fridge.
          Full product page coming soon.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/browse" className="btn-primary px-8 py-4 text-base">Browse Vans</Link>
          <Link href="/build" className="btn-secondary px-8 py-4 text-base">Build My Van</Link>
        </div>
      </section>
    </main>
  )
}
