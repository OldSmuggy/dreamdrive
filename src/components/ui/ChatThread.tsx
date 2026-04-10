'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Message {
  id: string
  message: string
  sender_role: 'customer' | 'buyer_agent' | 'admin'
  sender_name?: string
  created_at: string
}

const ROLE_STYLES: Record<string, { bg: string; label: string }> = {
  customer: { bg: 'bg-blue-100 text-blue-800', label: 'Customer' },
  buyer_agent: { bg: 'bg-green-100 text-green-800', label: 'Agent' },
  admin: { bg: 'bg-amber-100 text-amber-800', label: 'Admin' },
}

export default function ChatThread({
  customerVehicleId,
  currentUserRole,
}: {
  customerVehicleId: string
  currentUserRole: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/agent/messages?customer_vehicle_id=${customerVehicleId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      }
    } catch { /* silent */ }
  }, [customerVehicleId])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 15000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function send() {
    if (!draft.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/agent/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_vehicle_id: customerVehicleId, message: draft.trim() }),
      })
      if (res.ok) {
        setDraft('')
        await fetchMessages()
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-[200px] max-h-[400px]">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No messages yet. Start the conversation.</p>
        )}
        {messages.map(m => {
          const style = ROLE_STYLES[m.sender_role] ?? ROLE_STYLES.customer
          const isMe = m.sender_role === currentUserRole
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-ocean text-white' : 'bg-gray-100 text-charcoal'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${style.bg}`}>{style.label}</span>
                  {m.sender_name && <span className="text-[10px] opacity-70">{m.sender_name}</span>}
                </div>
                <p className="text-sm leading-relaxed">{m.message}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-200 p-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Type a message..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
        />
        <button
          onClick={send}
          disabled={!draft.trim() || sending}
          className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
