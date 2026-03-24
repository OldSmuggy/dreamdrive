import { createAdminClient } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

function getAuthClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const cvId = request.nextUrl.searchParams.get('customer_vehicle_id')
  if (!cvId) return NextResponse.json({ error: 'customer_vehicle_id required' }, { status: 400 })

  const supabase = getAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: messages } = await admin
    .from('order_messages')
    .select('id, message, sender_role, user_id, created_at')
    .eq('customer_vehicle_id', cvId)
    .order('created_at', { ascending: true })

  // Enrich with sender names
  const userIds = Array.from(new Set((messages ?? []).map(m => m.user_id).filter(Boolean)))
  const { data: profiles } = userIds.length
    ? await admin.from('user_profiles').select('id, first_name, last_name').in('id', userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Unknown']))

  const enriched = (messages ?? []).map(m => ({
    ...m,
    sender_name: profileMap.get(m.user_id) ?? 'Unknown',
  }))

  return NextResponse.json({ messages: enriched })
}

export async function POST(request: NextRequest) {
  const supabase = getAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { customer_vehicle_id, message } = body
  if (!customer_vehicle_id || !message?.trim()) {
    return NextResponse.json({ error: 'customer_vehicle_id and message required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get sender's role
  const { data: profile } = await admin.from('user_profiles').select('role, first_name, last_name').eq('id', user.id).single()
  const senderRole = profile?.role === 'buyer_agent' ? 'buyer_agent' : profile?.role === 'admin' ? 'admin' : 'customer'

  // Also check is_admin flag or email domain
  const finalRole = (user.email?.endsWith('@dreamdrive.life') || senderRole === 'admin') ? 'admin' : senderRole

  const { error } = await admin.from('order_messages').insert({
    customer_vehicle_id,
    user_id: user.id,
    message: message.trim(),
    sender_role: finalRole,
    is_from_customer: finalRole === 'customer',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget email notification to the other party
  const { data: cv } = await admin
    .from('customer_vehicles')
    .select('customer_id, agent_id, listing_id')
    .eq('id', customer_vehicle_id)
    .single()

  if (cv) {
    const senderName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Someone'

    // Notify agent if customer sent, notify customer if agent sent
    if (finalRole === 'customer' && cv.agent_id) {
      const { data: agentProfile } = await admin.from('user_profiles').select('id').eq('id', cv.agent_id).single()
      if (agentProfile) {
        const { data: agentAuth } = await admin.auth.admin.getUserById(cv.agent_id)
        if (agentAuth?.user?.email) {
          sendEmail({
            to: agentAuth.user.email,
            subject: `New message from ${senderName} — Bare Camper`,
            html: `<p>${senderName} sent a message about a vehicle:</p><blockquote>${message.trim()}</blockquote><p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://barecamper.com.au'}/agent/listing/${cv.listing_id}">View in Agent Dashboard</a></p>`,
          }).catch(() => {})
        }
      }
    } else if (finalRole === 'buyer_agent' && cv.customer_id) {
      const { data: customer } = await admin.from('customers').select('email, first_name').eq('id', cv.customer_id).single()
      if (customer?.email) {
        sendEmail({
          to: customer.email,
          subject: `Update on your vehicle — Bare Camper`,
          html: `<p>Your agent ${senderName} sent you a message:</p><blockquote>${message.trim()}</blockquote><p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://barecamper.com.au'}/account">View in your account</a></p>`,
        }).catch(() => {})
      }
    }

    // Always notify admin
    sendEmail({
      to: 'jared@dreamdrive.life',
      subject: `[Chat] ${senderName} (${finalRole}) — Bare Camper`,
      html: `<p>${senderName} (${finalRole}) sent a message:</p><blockquote>${message.trim()}</blockquote>`,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
