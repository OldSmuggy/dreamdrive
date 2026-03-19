'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const next = searchParams.get('next') || '/account'

  const [tab, setTab] = useState<'signin' | 'signup'>(searchParams.get('tab') === 'signup' ? 'signup' : 'signin')

  // Sign in state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Sign up state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignIn = async () => {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    window.location.href = next
  }

  const handleSignUp = async () => {
    setError('')
    if (signupPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (!agreedTerms) { setError('Please accept the Terms & Conditions'); return }
    if (signupPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { data: { first_name: firstName, last_name: lastName } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      // Create profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: firstName || null,
        last_name: lastName || null,
      })
    }
    // If we got a session immediately (email confirmation disabled), redirect now
    if (data.session) {
      // Send welcome email (fire-and-forget)
      fetch('/api/auth/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName }),
      }).catch(() => {})
      setSuccessMsg('Account created! Welcome to Dream Drive.')
      setSuccess(true)
      setTimeout(() => { window.location.href = next }, 800)
      setLoading(false)
      return
    }
    // Fallback: if email confirmation is still enabled, try signing in directly
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: signupEmail,
      password: signupPassword,
    })
    if (signInData.session) {
      setSuccessMsg('Account created! Welcome to Dream Drive.')
      setSuccess(true)
      setTimeout(() => { window.location.href = next }, 800)
      setLoading(false)
      return
    }
    // If neither worked, show check-email message
    setSuccessMsg('Check your email to confirm your account.')
    setSuccess(true)
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError('')
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
    if (error) setError(error.message)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{successMsg}</h2>
          <p className="text-gray-500 text-sm mb-4">Redirecting you now...</p>
          <Link href={next} className="text-ocean text-sm hover:underline">Go to your account</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl text-charcoal hover:text-ocean">Dream Drive</Link>
          <p className="text-gray-500 text-sm mt-1">{tab === 'signin' ? 'Sign in to your account' : 'Create your account'}</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setTab('signin'); setError('') }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError('') }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Create Account
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 h-11 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5"
            style={{ border: '1px solid #dadce0' }}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {tab === 'signin' ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                  placeholder="you@example.com" className={inputCls} autoFocus />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                  placeholder="••••••••" className={inputCls} />
              </div>
              <div className="text-right mb-5">
                <Link href="/reset-password" className="text-xs text-ocean hover:underline">Forgot password?</Link>
              </div>
              <button onClick={handleSignIn} disabled={loading || !email || !password}
                className="w-full py-2.5 bg-charcoal text-white font-semibold rounded-lg hover:bg-ocean disabled:opacity-50 text-sm">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" className={inputCls} autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" className={inputCls} />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                  placeholder="you@example.com" className={inputCls} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)}
                  placeholder="Min. 8 characters" className={inputCls} />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignUp()}
                  placeholder="••••••••" className={inputCls} />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer mb-5">
                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-ocean shrink-0" />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-ocean hover:underline">Terms &amp; Conditions</Link>
                </span>
              </label>
              <button onClick={handleSignUp} disabled={loading || !signupEmail || !signupPassword || !agreedTerms}
                className="w-full py-2.5 bg-charcoal text-white font-semibold rounded-lg hover:bg-ocean disabled:opacity-50 text-sm">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
