import { createSupabaseServer } from './supabase-server'

export interface SiteSettings {
  logo_url: string
  hero_video_url: string
  hero_video_poster: string
  site_name: string
}

const DEFAULTS: SiteSettings = {
  logo_url: '',
  hero_video_url: '',
  hero_video_poster: '',
  site_name: 'Bare Camper',
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createSupabaseServer()
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
    if (!data) return DEFAULTS
    const map: Record<string, string> = {}
    for (const row of data) map[row.key] = row.value ?? ''
    return {
      logo_url: map.logo_url ?? DEFAULTS.logo_url,
      hero_video_url: map.hero_video_url ?? DEFAULTS.hero_video_url,
      hero_video_poster: map.hero_video_poster ?? DEFAULTS.hero_video_poster,
      site_name: map.site_name || DEFAULTS.site_name,
    }
  } catch {
    return DEFAULTS
  }
}
