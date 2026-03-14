import { createAdminClient } from '@/lib/supabase'
import SettingsEditor from './SettingsEditor'

export const metadata = { title: 'Settings' }

export default async function AdminSettingsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('settings').select('*').order('key')
  const settings = data ?? []

  return (
    <div>
      <h1 className="font-display text-3xl text-forest-900 mb-2">Settings</h1>
      <p className="text-gray-500 text-sm mb-6">
        Click <strong className="text-gray-700">Edit</strong> on any setting to update its value. Changes take effect immediately.
      </p>

      <SettingsEditor initial={settings} />

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
