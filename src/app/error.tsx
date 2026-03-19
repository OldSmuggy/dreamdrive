'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="text-center max-w-lg">
        <p className="text-sand text-sm font-semibold tracking-widest uppercase mb-4">Error</p>
        <h2 className="text-4xl text-charcoal mb-4">Something went wrong</h2>
        <p className="text-gray-500 mb-2 text-sm leading-relaxed">{error.message}</p>
        {error.digest && (
          <p className="text-gray-400 text-xs mb-6 font-mono">digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="btn-primary"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
