import { createAdminClient } from '@/lib/supabase-server'

export const metadata = { title: 'Settings' }

export default async function AdminSettingsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('settings').select('*').order('key')
  const settings = data ?? []

  return (
    <div>
      <h1 className="font-display text-3xl text-forest-900 mb-2">Settings</h1>
      <p className="text-gray-500 text-sm mb-6">
        Edit these directly in{' '}
        <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/_/editor`} target="_blank" rel="noopener"
          className="text-forest-600 font-semibold hover:underline">
          Supabase Dashboard → settings table
        </a>.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {settings.map((s, i) => (
          <div key={s.key} className={`flex gap-4 px-5 py-3.5 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
            <div className="w-64 shrink-0">
              <p className="font-mono text-xs text-gray-500">{s.key}</p>
              {s.label && <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-800 font-medium truncate">{s.value || <span className="text-gray-300 italic">empty</span>}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-sand-50 border border-sand-200 rounded-xl p-5 text-sm">
        <p className="font-semibold text-sand-800 mb-3">Setting reference</p>
        <ul className="space-y-2 text-sand-700">
          <li><code className="bg-sand-100 px-1 rounded">jpy_aud_override</code> — Leave blank to use live Open Exchange Rates API. Set a number (e.g. <code>0.0095</code>) to lock the rate.</li>
          <li><code className="bg-sand-100 px-1 rounded">shipping_estimate</code> — AUD cents added to Japan van prices. E.g. <code>350000</code> = $3,500.</li>
          <li><code className="bg-sand-100 px-1 rounded">import_duty_pct</code> — Percentage × 100. E.g. <code>500</code> = 5%.</li>
          <li><code className="bg-sand-100 px-1 rounded">compliance_estimate</code> — AUD cents for compliance. E.g. <code>200000</code> = $2,000.</li>
          <li><code className="bg-sand-100 px-1 rounded">show_gst</code> — <code>true</code> or <code>false</code>. Show GST in price estimate breakdown.</li>
        </ul>
      </div>
    </div>
  )
}
