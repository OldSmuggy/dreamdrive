'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

function ResetForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleReset = async () => {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">We'll send you a reset link</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📬</div>
              <p className="font-semibold text-gray-900 mb-1">Check your inbox</p>
              <p className="text-gray-500 text-sm mb-6">We've sent a reset link to <strong>{email}</strong></p>
              <Link href="/login" className="text-ocean text-sm hover:underline">Back to sign in</Link>
            </div>
          ) : (
            <>
              {error && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ocean"
                  autoFocus
                />
              </div>
              <button
                onClick={handleReset}
                disabled={loading || !email}
                className="w-full py-2.5 bg-charcoal text-white font-semibold rounded-lg hover:bg-ocean disabled:opacity-50 text-sm mb-4"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <Link href="/login" className="block text-center text-ocean text-sm hover:underline">Back to sign in</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>
}
