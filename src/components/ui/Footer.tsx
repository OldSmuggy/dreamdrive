import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
      <p className="mb-2">&copy; {new Date().getFullYear()} Bare Camper</p>
      <div className="flex justify-center gap-4 text-xs">
        <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
      </div>
    </footer>
  )
}
