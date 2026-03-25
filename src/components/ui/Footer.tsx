import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-8 text-center text-gray-400 text-xs space-y-4">
      {/* Partnership */}
      <div className="flex items-center justify-center gap-3 text-gray-500 text-sm">
        <span>A joint venture between</span>
        <span className="font-semibold text-charcoal">Dream Drive</span>
        <span>×</span>
        <span className="font-semibold text-charcoal">DIY RV Solutions</span>
      </div>

      <p className="text-gray-400">Bare Camper · Brisbane &amp; Tokyo</p>
      <p>
        <a href="mailto:hello@barecamper.com.au" className="hover:text-gray-600">hello@barecamper.com.au</a>
        {' · '}
        <a href="tel:0432182892" className="hover:text-gray-600">0432 182 892</a>
      </p>
      <p>Workshop: 1/10 Jones Road, Capalaba QLD 4157</p>
      <div className="flex justify-center gap-4 mt-2">
        <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
      </div>
    </footer>
  )
}
