cd "/Users/jaredcampion/Desktop/DD App/dreamdrive"
git add -A
git commit -m "Fix import page via terminal write"
git push
cat > "/Users/jaredcampion/Desktop/DD App/dreamdrive/src/app/login/page.tsx" << 'ENDOFFILE'
'use client'
import { useState, Suspense } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createSupabaseBrowser()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.refresh()
      setTimeout(() => router.push(next), 800)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-500" />
      <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-500" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading}
        className="btn-primary w-full py-3 disabled:opacity-60">
        {loading ? 'Signing in…' : 'Sig
cat > "/Users/jaredcampion/Desktop/DD App/dreamdrive/src/app/login/page.tsx" << 'ENDOFFILE'
'use client'
import { useState, Suspense } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createSupabaseBrowser()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.refresh()
      setTimeout(() => router.push(next), 800)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-500" />
      <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-500" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading}
        className="btn-primary w-full py-3 disabled:opacity-60">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow border border-gray-200 p-8">
        <h1 className="font-display text-2xl text-forest-900 mb-6">Sign In</h1>
        <Suspense fallback={<div className="text-gray-400 text-sm">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
