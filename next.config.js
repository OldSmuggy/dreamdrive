/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.ninja-cartrade.jp' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
    ],
  },
  // Prevent webpack from bundling Playwright and Chromium — they are
  // native server-only modules used exclusively in /api/scrape at runtime.
  experimental: {
    serverComponentsExternalPackages: [
      'playwright-core',
      '@sparticuz/chromium',
    ],
  },
}

module.exports = nextConfig
