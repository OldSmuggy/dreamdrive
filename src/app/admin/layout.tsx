import AdminNav from './AdminNav'

export const metadata = { title: { template: '%s | Admin — Bare Camper', default: 'Admin' } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <AdminNav />
      <main className="flex-1 bg-gray-50 overflow-auto min-w-0">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
