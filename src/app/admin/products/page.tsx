export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import type { Product } from '@/types'
import ProductsEditor from './ProductsEditor'

export const metadata = { title: 'Products & Pricing' }

export default async function AdminProductsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .order('category')
    .order('sort_order')
  const products = (data ?? []) as Product[]

  return (
    <div>
      <h1 className="font-display text-3xl text-forest-900 mb-2">Products & Pricing</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Click <strong className="text-gray-700">Edit</strong> on any product to update its name, description,
        price, or run a sale. Changes go live immediately in the configurator and on product pages.
      </p>
      <ProductsEditor initial={products} />
    </div>
  )
}
