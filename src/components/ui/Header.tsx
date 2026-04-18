'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

type DropdownItem = { label: string; href: string }
type NavItem =
  | { label: string; href: string; dropdown?: never }
  | { label: string; href?: string; dropdown: DropdownItem[] }

const NAV: NavItem[] = [
  { label: 'Browse Vans', href: '/browse' },
  {
    label: 'Conversions',
    dropdown: [
      { label: 'HEXA — Adventure Van', href: '/hexa' },
      { label: 'TAMA — Full Fit-Out', href: '/tama' },
      { label: 'MANA — Off-Grid Pro', href: '/mana' },
      { label: 'Roof Conversions', href: '/pop-top' },
      { label: 'DIY Parts & Kits', href: '/diy' },
    ],
  },
  { label: 'Finance', href: '/finance' },
  { label: 'About', href: '/about' },
]

export default function Header({ logoUrl }: { logoUrl?: string }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null)
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
        .select('is_admin')
        .eq('id', u.id)
        .single()
      if (profile?.is_admin) setIsAdmin(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setIsAdmin(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setOpenDropdown(null)
    setOpenMobileDropdown(null)
  }, [pathname])

  if (pathname.startsWith('/admin')) return null

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Dropdown fade-in keyframe */}
      <style>{`@keyframes dd-fade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}.dd-enter{animation:dd-fade .12s ease-out}`}</style>

      <header className="bg-charcoal text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bare-camper-no-tagline-dark.svg"
              alt="Bare Camper"
              className="w-auto object-contain"
              style={{ height: 40 }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 text-sm flex-1 justify-center">
            {NAV.map(item =>
              item.dropdown ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className="flex items-center gap-1 px-3 py-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                    {item.label}
                    <svg
                      className={`w-3 h-3 transition-transform duration-150 ${openDropdown === item.label ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === item.label && (
                    <div className="dd-enter absolute top-full left-0 mt-1.5 bg-white border border-gray-200/80 rounded-xl shadow-lg py-1.5 min-w-[200px] z-50">
                      {item.dropdown.map(sub => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:text-ocean hover:bg-cream transition-colors min-h-[40px]"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href!}
                  className="px-3 py-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="px-3 py-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors text-sm">
                    Admin
                  </Link>
                )}
                <Link href="/account" className="px-3 py-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors text-sm">
                  My Account
                </Link>
                <button onClick={handleSignOut} className="px-3 py-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors text-sm">
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-dirt text-white font-semibold px-4 py-2 rounded-lg hover:bg-dirt-light transition-colors text-sm">
                Sign In
              </Link>
            )}
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
            {NAV.map(item =>
              item.dropdown ? (
                <div key={item.label}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-white/80 hover:text-white hover:bg-white/5 border-b border-white/5 min-h-[44px] transition-colors"
                    onClick={() => setOpenMobileDropdown(openMobileDropdown === item.label ? null : item.label)}
                  >
                    {item.label}
                    <svg className={`w-4 h-4 transition-transform duration-150 ${openMobileDropdown === item.label ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openMobileDropdown === item.label && (
                    <div className="bg-black/20">
                      {item.dropdown.map(sub => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center px-8 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 border-b border-white/5 min-h-[44px] transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3.5 text-sm text-white/80 hover:text-white hover:bg-white/5 border-b border-white/5 min-h-[44px] transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="px-4 py-4 border-t border-white/10 space-y-1">
              {user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center py-3 text-sm text-white/70 hover:text-white min-h-[44px]">Admin</Link>
                  )}
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center py-3 text-sm text-white/70 hover:text-white min-h-[44px]">My Account</Link>
                  <button onClick={handleSignOut} className="flex items-center py-3 text-sm text-white/50 hover:text-white min-h-[44px] w-full text-left">Sign Out</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center py-3 text-sand font-semibold text-sm min-h-[44px]">Sign In</Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
