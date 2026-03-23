import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-6 text-center text-gray-400 text-xs space-y-1">
      <p>Bare Camper &middot; Brisbane &amp; Tokyo</p>
      <p>
        <a href="mailto:hello@barecamper.com" className="hover:text-gray-600">hello@barecamper.com</a>
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
