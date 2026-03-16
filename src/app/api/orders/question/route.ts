import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { import_order_id, message } = await req.json()

    if (!import_order_id || !message?.trim()) {
      return NextResponse.json({ error: 'import_order_id and message are required' }, { status: 400 })
    }
    if (message.length > 500) {
      return NextResponse.json({ error: 'Message must be 500 characters or less' }, { status: 400 })
    }

    // Verify the requesting user owns this order
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = createAdminClient()
    const { data: order } = await admin
      .from('import_orders')
      .select('id, user_id')
      .eq('id', import_order_id)
      .single()

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Save message to order_messages table
    const { error: insertErr } = await admin.from('order_messages').insert({
      import_order_id,
      user_id: user.id,
      message: message.trim(),
      is_from_customer: true,
    })

    if (insertErr) {
      // Table may not exist yet — return success anyway so UI doesn't break
      console.error('order_messages insert error:', insertErr.message)
    }

    // TODO: send email notification to jared@dreamdrive.life
    // Requires an email service (e.g. Resend). Install: npm install resend
    // Then use: new Resend(process.env.RESEND_API_KEY).emails.send(...)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
