/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.ninja-cartrade.jp' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Prevent webpack from bundling Playwright and Chromium — they are
  // native server-only modules used exclusively in /api/scrape at runtime.
  experimental: {
    serverComponentsExternalPackages: [
      'playwright-core',
      '@sparticuz/chromium',
      '@mendable/firecrawl-js',
    ],
    // Allow server actions to accept larger payloads (images up to 4 MB)
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/camperdesigner',
        destination: 'https://dreamdrive-configurator-3d.vercel.app/',
      },
      {
        source: '/camperdesigner/:path*',
        destination: 'https://dreamdrive-configurator-3d.vercel.app/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.facebook.com https://region1.google-analytics.com https://sketchfab.com https://*.sketchfab.com",
              "frame-src 'self' https://www.facebook.com https://*.supabase.co https://sketchfab.com https://*.sketchfab.com",
              "object-src 'self' https://*.supabase.co",
              "media-src 'self' https: blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
