'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

const NAV = [
  { label: 'Buy a Van', href: '/browse' },
  { label: 'Roof Conversion', href: '/pop-top' },
  { label: 'Full Build', href: '/tama' },
  { label: 'Pricing', href: '/import-costs' },
  { label: 'Sell', href: '/tip-a-van' },
]

export default function Header({ logoUrl }: { logoUrl?: string }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAgent, setIsAgent] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user ?? null
      setUser(u)
      if (!u) return
      if (u.email?.endsWith('@dreamdrive.life')) {
        setIsAdmin(true)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', u.id)
        .single()
      if (profile?.is_admin) setIsAdmin(true)
      if (profile?.role === 'buyer_agent') setIsAgent(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setIsAdmin(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  if (pathname.startsWith('/admin') || pathname.startsWith('/agent')) return null

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-charcoal text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/barecamper-logo-dark-400.png"
            alt="Bare Camper"
            className="w-auto object-contain invert"
            style={{ height: 32 }}
          />
        </Link>

        {/* Desktop nav — flat, no dropdowns */}
        <nav className="hidden lg:flex items-center gap-1 text-sm flex-1 justify-center">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right — user icon + Browse CTA */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* User icon */}
          <div className="relative" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
            <button className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>
            {userMenuOpen && (
              <div className="absolute top-full right-0 bg-white border border-gray-200/80 rounded-xl shadow-lg py-1.5 min-w-[180px] z-50" style={{ animation: 'dd-fade .12s ease-out' }}>
                {user ? (
                  <>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-ocean hover:bg-cream transition-colors">Admin</Link>
                    )}
                    {isAgent && (
                      <Link href="/agent" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-ocean hover:bg-cream transition-colors">Agent</Link>
                    )}
                    <Link href="/account" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-ocean hover:bg-cream transition-colors">My Account</Link>
                    <button onClick={handleSignOut} className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-400 hover:text-ocean hover:bg-cream transition-colors">Sign Out</button>
                  </>
                ) : (
                  <Link href="/login" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-ocean hover:bg-cream transition-colors">Sign In</Link>
                )}
              </div>
            )}
          </div>

          {/* Browse Vans CTA */}
          <Link href="/browse" className="bg-sand text-charcoal font-semibold px-4 py-2 rounded-lg hover:bg-sand-light transition-colors text-sm">
            Browse Vans
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-charcoal-light border-t border-white/10 overflow-y-auto max-h-[80vh]">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-4 py-3.5 text-sm text-white/80 hover:text-white hover:bg-white/5 border-b border-white/5 min-h-[44px] transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {/* Browse Vans CTA */}
          <div className="px-4 py-3">
            <Link href="/browse" onClick={() => setMenuOpen(false)} className="block text-center bg-sand text-charcoal font-semibold px-4 py-3 rounded-lg text-sm">
              Browse Vans
            </Link>
          </div>
          {/* Auth */}
          <div className="px-4 py-3 border-t border-white/10 space-y-1">
            {user ? (
              <>
                {isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center py-3 text-sm text-white/70 hover:text-white min-h-[44px]">Admin</Link>}
                {isAgent && <Link href="/agent" onClick={() => setMenuOpen(false)} className="flex items-center py-3 text-sm text-white/70 hover:text-white min-h-[44px]">Agent</Link>}
                <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center py-3 text-sm text-white/70 hover:text-white min-h-[44px]">My Account</Link>
                <button onClick={handleSignOut} className="flex items-center py-3 text-sm text-white/50 hover:text-white min-h-[44px] w-full text-left">Sign Out</button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center py-3 text-sand font-semibold text-sm min-h-[44px]">Sign In</Link>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes dd-fade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </header>
  )
}
