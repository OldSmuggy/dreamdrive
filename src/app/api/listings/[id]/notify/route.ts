export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

// GET — find customers who might be interested in this listing
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()

    // Get the listing details
    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .select('id, model_name, model_year, size, drive, displacement_cc, grade, body_colour, photos, aud_estimate')
      .eq('id', params.id)
      .single()

    if (listingErr || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Find customers who saved similar vans (same drive or size)
    const { data: savedVans } = await supabase
      .from('saved_vans')
      .select('user_id, listing:listings(drive, size, displacement_cc)')

    // Find scout leads with matching preferences
    const { data: scoutLeads } = await supabase
      .from('leads')
      .select('id, name, email, phone, notes, type')
      .in('type', ['van_scout', 'consultation', 'deposit_hold'])
      .not('email', 'is', null)

    // Get unique user IDs from saved vans that match this listing's specs
    const matchingUserIds = new Set<string>()
    for (const sv of savedVans ?? []) {
      const saved = sv.listing as unknown as { drive: string | null; size: string | null; displacement_cc: number | null } | null
      if (!saved) continue
      // Match if same drive type OR same size
      if ((listing.drive && saved.drive === listing.drive) ||
          (listing.size && saved.size === listing.size)) {
        matchingUserIds.add(sv.user_id)
      }
    }

    // Get emails for matching users
    const matchingUsers: { id: string; email: string; name: string | null; source: string }[] = []

    if (matchingUserIds.size > 0) {
      for (const uid of Array.from(matchingUserIds)) {
        try {
          const { data: { user } } = await supabase.auth.admin.getUserById(uid)
          if (!user?.email) continue
          // Don't include admins/agents
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, name')
            .eq('id', uid)
            .maybeSingle()
          if (profile?.role === 'admin' || profile?.role === 'buyer_agent') continue
          matchingUsers.push({
            id: uid,
            email: user.email,
            name: profile?.name ?? null,
            source: 'saved_van',
          })
        } catch {
          // Skip users we can't look up
        }
      }
    }

    // Add scout leads
    for (const lead of scoutLeads ?? []) {
      if (!lead.email) continue
      // Check if notes mention matching criteria
      const notes = (lead.notes ?? '').toLowerCase()
      const isMatch = !listing.drive || !listing.size ||
        notes.includes((listing.drive ?? '').toLowerCase()) ||
        notes.includes((listing.size ?? '').toLowerCase()) ||
        lead.type === 'consultation'

      if (isMatch) {
        // Avoid duplicates
        if (!matchingUsers.find(u => u.email === lead.email)) {
          matchingUsers.push({
            id: lead.id,
            email: lead.email,
            name: lead.name ?? null,
            source: 'scout_lead',
          })
        }
      }
    }

    return NextResponse.json({
      listing: {
        id: listing.id,
        model_name: listing.model_name,
        model_year: listing.model_year,
        size: listing.size,
        drive: listing.drive,
        photo: listing.photos?.[0] ?? null,
      },
      matches: matchingUsers,
      total: matchingUsers.length,
    })
  } catch (err) {
    console.error('[notify GET]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST — send notification emails to selected customers
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { emails } = await req.json() as { emails: string[] }
    if (!emails?.length) return NextResponse.json({ error: 'No emails provided' }, { status: 400 })

    const supabase = createAdminClient()

    const { data: listing } = await supabase
      .from('listings')
      .select('id, model_name, model_year, size, drive, grade, photos, aud_estimate')
      .eq('id', params.id)
      .single()

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const vanTitle = `${listing.model_year ?? ''} ${listing.model_name}`.trim()
    const vanUrl = `https://barecamper.com.au/van/${listing.id}`
    const photo = listing.photos?.[0]
    const specs = [listing.size, listing.drive, listing.grade].filter(Boolean).join(' · ')

    let sent = 0
    for (const email of emails) {
      try {
        await sendEmail({
          to: email,
          subject: `New van alert — ${vanTitle}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #2C2C2A; padding: 2rem; text-align: center;">
                <h1 style="color: #E8CFA0; margin: 0; font-size: 1.5rem;">Bare Camper</h1>
              </div>
              <div style="padding: 2rem;">
                <h2 style="color: #2C2C2A; margin-bottom: 0.5rem;">A van matching your interests just came up</h2>
                ${photo ? `<img src="${photo}" alt="${vanTitle}" style="width: 100%; border-radius: 12px; margin: 1rem 0;" />` : ''}
                <h3 style="color: #2C2C2A; margin-bottom: 0.25rem;">${vanTitle}</h3>
                ${specs ? `<p style="color: #666; font-size: 0.9rem;">${specs}</p>` : ''}
                <a href="${vanUrl}"
                   style="display: inline-block; background: #3D6B73; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; margin-top: 1rem; font-weight: 600;">
                  View This Van →
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;">
                <p style="color: #888; font-size: 0.75rem;">
                  You're receiving this because you showed interest in similar vans on Bare Camper.<br>
                  <a href="https://barecamper.com.au/account" style="color: #3D6B73;">Manage preferences</a>
                </p>
              </div>
            </div>
          `,
        })
        sent++
      } catch (err) {
        console.error(`[notify] Failed to email ${email}:`, err)
      }
    }

    return NextResponse.json({ sent, total: emails.length })
  } catch (err) {
    console.error('[notify POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
