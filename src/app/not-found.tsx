import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">🚐</p>
        <h1 className="text-3xl font-bold text-charcoal mb-3">Wrong turn!</h1>
        <p className="text-gray-500 mb-8">
          Looks like this page has gone off-road. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/browse" className="btn-primary px-6 py-3 text-sm">
            Browse Vans
          </Link>
          <Link href="/" className="border border-gray-200 rounded-lg px-6 py-3 text-sm text-charcoal hover:bg-gray-50 transition-colors">
            Back to Home
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap gap-4 justify-center text-sm text-ocean">
          <Link href="/full-build" className="hover:underline">Full Builds</Link>
          <Link href="/pop-top" className="hover:underline">Pop Top</Link>
          <Link href="/finance" className="hover:underline">Finance</Link>
          <Link href="/faqs" className="hover:underline">FAQs</Link>
        </div>
      </div>
    </div>
  )
}
