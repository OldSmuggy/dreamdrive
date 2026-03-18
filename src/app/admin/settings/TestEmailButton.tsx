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
      const data = await res.json()
      if (data.success) {
        setStatus('success')
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setErrorMsg(data.error || 'Send failed')
        setStatus('error')
      }
    } catch (err) {
      setErrorMsg(String(err))
      setStatus('error')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 flex items-center gap-4">
      <div className="flex-1">
        <p className="text-sm text-gray-700 font-medium">Test email delivery</p>
        <p className="text-xs text-gray-400">Sends a test email to jared@dreamdrive.life via Resend</p>
      </div>
      <button
        onClick={send}
        disabled={status === 'sending'}
        className="text-sm px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 shrink-0"
      >
        {status === 'sending' ? 'Sending...' : status === 'success' ? 'Sent!' : 'Send test email'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
