'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavSection = {
  label: string | null
  items: { href: string; label: string }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      { href: '/admin/analytics', label: '📊 Dashboard' },
    ],
  },
  {
    label: 'IMPORTING',
    items: [
      { href: '/admin/listings',        label: '🚐 Listings' },
      { href: '/admin/drafts',          label: '📝 Draft Listings' },
      { href: '/admin/add-listing',     label: '➕ Add Listing' },
      { href: '/admin/bulk-import',     label: '📄 Bulk PDF Import' },
      { href: '/admin/import',          label: '📥 Import Vehicle' },
      { href: '/admin/scrape',          label: '🤖 Full Auto-Scrape' },
      { href: '/admin/vehicle-tips',    label: '💡 Van Tips' },
      { href: '/admin/van-submissions', label: '📬 Van Submissions' },
    ],
  },
  {
    label: 'SALES',
    items: [
      { href: '/admin/leads',             label: '📋 Leads' },
      { href: '/admin/customers',         label: '👥 Customers' },
      { href: '/admin/customers/add',     label: '➕ Add Customer' },
      { href: '/admin/deals',             label: '🤝 Deals' },
      { href: '/admin/auctions',          label: '🏴 Auctions' },
      { href: '/admin/vehicles-for-sale', label: '🏷️ For Sale' },
    ],
  },
  {
    label: 'PRODUCTS',
    items: [
      { href: '/admin/products', label: '💰 Products & Pricing' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { href: '/admin/settings', label: '⚙️ Settings' },
    ],
  },
]

export default function AdminNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (pathname === href) return true
    if (pathname.startsWith(href + '/')) return true
    return false
  }

  const navContent = (
    <>
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/" className="text-sand text-lg" onClick={() => setOpen(false)}>
          Bare Camper
        </Link>
        <p className="text-white/50 text-xs mt-0.5">Admin</p>
      </div>
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        {NAV_SECTIONS.map((section, i) => (
          <div key={section.label ?? 'top'} className={i > 0 ? 'mt-5' : ''}>
            {section.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(n.href)
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
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
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-charcoal text-white p-2.5 rounded-lg shadow-lg"
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle menu"
      >
        <span className="block w-5 h-0.5 bg-white mb-1" />
        <span className="block w-5 h-0.5 bg-white mb-1" />
        <span className="block w-5 h-0.5 bg-white" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile (slides in), static on desktop */}
      <nav
        className={`
          fixed md:static top-0 left-0 h-full z-40 w-56 bg-charcoal text-white flex flex-col shrink-0
          transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {navContent}
      </nav>
    </>
  )
}
