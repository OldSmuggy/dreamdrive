/**
 * Simple in-memory rate limiter for API routes.
 * Limits requests per IP address within a sliding window.
 *
 * Note: On Vercel serverless, each function instance has its own memory,
 * so this provides per-instance limiting. For stricter limits, use
 * Vercel KV or Upstash Redis.
 */

const windowMs = 60 * 1000 // 1 minute
const maxRequests = 5       // max 5 requests per minute per IP

const requests = new Map<string, { count: number; resetAt: number }>()

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  requests.forEach((val, key) => {
    if (val.resetAt < now) requests.delete(key)
  })
}, 5 * 60 * 1000)

export function rateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = requests.get(ip)

  if (!entry || entry.resetAt < now) {
    requests.set(ip, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: maxRequests - 1 }
  }

  entry.count++
  if (entry.count > maxRequests) {
    return { ok: false, remaining: 0 }
  }

  return { ok: true, remaining: maxRequests - entry.count }
}
