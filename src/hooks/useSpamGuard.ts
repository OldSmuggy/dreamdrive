'use client'

import { useState, useRef, useCallback } from 'react'

/**
 * Lightweight client-side spam guard using:
 * 1. Honeypot field — hidden input that bots fill, humans don't
 * 2. Timing check — rejects submissions faster than 3 seconds (bot speed)
 * 3. Submission count — max 2 submissions per session
 *
 * Usage:
 *   const { honeypotProps, isSpam, markSubmitted } = useSpamGuard()
 *   // Render honeypot: <input {...honeypotProps} />
 *   // Before submit: if (isSpam()) return
 *   // After submit: markSubmitted()
 */
export function useSpamGuard() {
  const [honeypot, setHoneypot] = useState('')
  const mountedAt = useRef(Date.now())
  const submitCount = useRef(0)

  const honeypotProps = {
    value: honeypot,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHoneypot(e.target.value),
    tabIndex: -1,
    autoComplete: 'off',
    'aria-hidden': true as const,
    style: { position: 'absolute' as const, left: '-9999px', top: '-9999px', opacity: 0, height: 0, width: 0 },
    name: 'website_url', // bots love filling "website" fields
    placeholder: 'Your website',
  }

  const isSpam = useCallback((): boolean => {
    // Honeypot filled = bot
    if (honeypot.length > 0) {
      console.warn('[spam-guard] honeypot triggered')
      return true
    }
    // Submitted in under 3 seconds = bot
    if (Date.now() - mountedAt.current < 3000) {
      console.warn('[spam-guard] too fast')
      return true
    }
    // More than 2 submissions = suspicious
    if (submitCount.current >= 2) {
      console.warn('[spam-guard] too many submissions')
      return true
    }
    return false
  }, [honeypot])

  const markSubmitted = useCallback(() => {
    submitCount.current++
  }, [])

  return { honeypotProps, isSpam, markSubmitted }
}
