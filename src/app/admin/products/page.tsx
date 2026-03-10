import { createAdminClient } from '@/lib/supabase-server'
import { centsToAud } from '@/lib/utils'
import type { Product } from '@/types'

export const metadata = { title: 'Products & Pricing' }

export default async function AdminProductsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('products').select('*').order('category').order('sort_order')
  const products = (data ?? []) as Product[]

  const now = Date.now()

  return (
    <div>
      <h1 className="font-display text-3xl text-forest-900 mb-2">Products & Pricing</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Update prices and specials in your{' '}
        <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/_/editor`} target="_blank" rel="noopener"
          className="text-forest-600 font-semibold hover:underline">
          Supabase Dashboard → products table
        </a>.
        Changes reflect immediately.
      </p>

      <div className="space-y-4">
        {products.map(p => {
          const isSpecial = p.special_price_aud && p.special_start && p.special_end
            && now >= new Date(p.special_start).getTime() && now <= new Date(p.special_end).getTime()

          return (
            <div key={p.id} className={`bg-white border rounded-xl p-5 ${!p.visible ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{p.name}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{p.category}</span>
                    {!p.visible && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Hidden</span>}
                    {isSpecial && p.special_label && (
                      <span className="text-xs bg-amber-400 text-amber-900 font-bold px-2 py-0.5 rounded">🔥 {p.special_label}</span>
                    )}
                  </div>
                  {p.description && <p className="text-sm text-gray-500 mt-1 max-w-xl">{p.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">RRP: <strong className="text-gray-800">{p.rrp_aud > 0 ? centsToAud(p.rrp_aud) : 'Contact'}</strong></p>
                  {p.special_price_aud && p.special_price_aud > 0 && (
                    <p className="text-sm text-amber-700">Special: <strong>{centsToAud(p.special_price_aud)}</strong></p>
                  )}
                  {isSpecial && p.special_end && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Ends {new Date(p.special_end).toLocaleDateString('en-AU')}
                    </p>
                  )}
                  {p.special_start && p.special_end && !isSpecial && now < new Date(p.special_start).getTime() && (
                    <p className="text-xs text-blue-500 mt-0.5">
                      Scheduled from {new Date(p.special_start).toLocaleDateString('en-AU')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 bg-forest-50 rounded-xl p-5 border border-forest-200 text-sm text-forest-800">
        <p className="font-semibold mb-1">How to update a price or run a special</p>
        <ol className="list-decimal list-inside space-y-1 text-forest-700">
          <li>Open your Supabase Dashboard → Table Editor → products</li>
          <li>Find the product row and click Edit</li>
          <li>Update <code className="bg-forest-100 px-1 rounded">rrp_aud</code> (in cents, e.g. 1190000 = $11,900)</li>
          <li>For a special: set <code className="bg-forest-100 px-1 rounded">special_price_aud</code>, <code className="bg-forest-100 px-1 rounded">special_label</code>, <code className="bg-forest-100 px-1 rounded">special_start</code>, <code className="bg-forest-100 px-1 rounded">special_end</code></li>
          <li>Save — the configurator updates immediately</li>
        </ol>
      </div>
    </div>
  )
}
