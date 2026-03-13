'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createSupabaseBrowser()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-forest-950 text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-display text-xl text-sand-400 hover:text-sand-300">
          Dream Drive
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/browse" className="text-white/70 hover:text-white transition-colors">Browse Vans</Link>
          <Link href="/finance" className="text-white/70 hover:text-white transition-colors">Finance</Link>
          <Link href="/build" className="text-white/70 hover:text-white transition-colors">Build My Van</Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-white/70 hover:text-white transition-colors">Admin</Link>
              <button onClick={handleSignOut} className="text-white/50 hover:text-white text-xs transition-colors">
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-sand-400 text-forest-950 font-semibold px-4 py-2 rounded-lg hover:bg-sand-300 transition-colors text-sm">
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-forest-900 border-t border-white/10 px-4 py-4 space-y-3 text-sm">
          <Link href="/browse" onClick={() => setMenuOpen(false)} className="block text-white/70 hover:text-white py-2">Browse Vans</Link>
          <Link href="/finance" onClick={() => setMenuOpen(false)} className="block text-white/70 hover:text-white py-2">Finance</Link>
          <Link href="/build" onClick={() => setMenuOpen(false)} className="block text-white/70 hover:text-white py-2">Build My Van</Link>
          {user ? (
            <>
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="block text-white/70 hover:text-white py-2">Admin</Link>
              <button onClick={handleSignOut} className="block text-white/50 hover:text-white py-2">Sign Out</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-sand-400 font-semibold py-2">Sign In</Link>
          )}
        </div>
      )}
    </header>
  )
}