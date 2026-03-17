export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import { getSiteSettings } from '@/lib/site-settings'
import SettingsEditor from './SettingsEditor'
import SiteSettingsClient from './SiteSettingsClient'

export const metadata = { title: 'Settings | Admin' }

export default async function AdminSettingsPage() {
  const admin = createAdminClient()

  const [{ data }, siteSettings] = await Promise.all([
    admin.from('settings').select('*').order('key'),
    getSiteSettings(),
  ])

  const settings = data ?? []

  return (
    <div>
      <h1 className="font-display text-3xl text-forest-900 mb-2">Settings</h1>
      <p className="text-gray-500 text-sm mb-8">
        Manage site appearance and configuration.
      </p>

      {/* ---- Site Assets (logo, video, name) ---- */}
      <div className="mb-10">
        <h2 className="font-display text-xl text-forest-900 mb-4">Site Assets</h2>
        <SiteSettingsClient
          logoUrl={siteSettings.logo_url}
          heroVideoUrl={siteSettings.hero_video_url}
          heroVideoPoster={siteSettings.hero_video_poster}
          siteName={siteSettings.site_name}
        />
      </div>

      {/* ---- Operational Settings ---- */}
      <div>
        <h2 className="font-display text-xl text-forest-900 mb-4">Operational Settings</h2>
        <p className="text-gray-500 text-sm mb-4">
          Click <strong className="text-gray-700">Edit</strong> on any setting to update its value. Changes take effect immediately.
        </p>

        <SettingsEditor initial={settings} />

        <div className="mt-6 bg-sand-50 border border-sand-200 rounded-xl p-5 text-sm">
          <p className="font-semibold text-sand-800 mb-3">Setting reference</p>
          <ul className="space-y-2 text-sand-700">
            <li><code className="bg-sand-100 px-1 rounded">jpy_aud_override</code> — Leave blank to use live rate. Set a number (e.g. <code>0.0095</code>) to lock the JPY/AUD rate.</li>
            <li><code className="bg-sand-100 px-1 rounded">shipping_estimate</code> — AUD cents. E.g. <code>350000</code> = $3,500.</li>
            <li><code className="bg-sand-100 px-1 rounded">import_duty_pct</code> — Percentage × 100. E.g. <code>500</code> = 5%.</li>
            <li><code className="bg-sand-100 px-1 rounded">compliance_estimate</code> — AUD cents for compliance. E.g. <code>200000</code> = $2,000.</li>
            <li><code className="bg-sand-100 px-1 rounded">show_gst</code> — <code>true</code> or <code>false</code>.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
