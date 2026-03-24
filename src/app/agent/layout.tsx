'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/agent', label: 'Dashboard' },
  { href: '/agent/add-listing', label: '➕ Add Listing' },
  { href: '/agent/bulk-import', label: '📄 Bulk PDF Import' },
]

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navContent = (
    <>
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/" className="text-sand text-lg" onClick={() => setOpen(false)}>
          Bare Camper
        </Link>
        <p className="text-white/50 text-xs mt-0.5">Agent Dashboard</p>
      </div>
      <div className="flex-1 py-4 space-y-1 px-3">
        {NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === n.href
                ? 'bg-white/15 text-white font-semibold'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {n.label}
          </Link>
        ))}
      </div>
      <div className="px-5 py-4 border-t border-white/10">
        <Link href="/" className="text-white/50 text-xs hover:text-white" onClick={() => setOpen(false)}>
          ← Back to site
        </Link>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex">
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-charcoal text-white p-2.5 rounded-lg shadow-lg"
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle menu"
      >
        <span className="block w-5 h-0.5 bg-white mb-1" />
        <span className="block w-5 h-0.5 bg-white mb-1" />
        <span className="block w-5 h-0.5 bg-white" />
      </button>
      {open && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}
      <nav className={`fixed md:static top-0 left-0 h-full z-40 w-56 bg-charcoal text-white flex flex-col shrink-0 transform transition-transform duration-200 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {navContent}
      </nav>
      <main className="flex-1 bg-gray-50 overflow-auto min-w-0">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
