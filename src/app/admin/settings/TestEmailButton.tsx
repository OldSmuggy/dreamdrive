'use client'

import { useState } from 'react'

export default function TestEmailButton() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const send = async () => {
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/test-email', { method: 'POST' })
      const text = await res.text()
      let data: { success?: boolean; error?: string } = {}
      try { data = JSON.parse(text) } catch { data = { error: text } }

      if (res.ok && data.success) {
        setStatus('success')
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setErrorMsg(`HTTP ${res.status}: ${data.error || text}`)
        setStatus('error')
      }
    } catch (err) {
      setErrorMsg(String(err))
      setStatus('error')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700 font-medium">Test email delivery</p>
          <p className="text-xs text-gray-400">Sends a test email to jared@dreamdrive.life via Resend</p>
        </div>
        <button
          onClick={send}
          disabled={status === 'sending'}
          className={`text-sm px-4 py-2 rounded-lg font-medium shrink-0 disabled:opacity-50 ${
            status === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-ocean text-white hover:bg-ocean'
          }`}
        >
          {status === 'sending' ? 'Sending...' : status === 'success' ? 'Sent!' : 'Send test email'}
        </button>
      </div>
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-xs text-red-700 font-mono break-all">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
