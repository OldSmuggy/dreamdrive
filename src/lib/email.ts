import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
  from = 'Bare Camper <hello@barecamper.com.au>',
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured — skipping email')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    if (error) {
      console.error('[email] Resend error:', error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (err) {
    console.error('[email] Send failed:', err)
    return { success: false, error: err }
  }
}

// ── Email templates ──────────────────────────────────────────────────────────

export const emailTemplates = {

  welcomeEmail: (firstName: string) => ({
    subject: 'Welcome to Bare Camper',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2C2C2A; padding: 2rem; text-align: center;">
          <h1 style="color: #E8CFA0; margin: 0; font-size: 1.5rem;">Bare Camper</h1>
        </div>
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A;">Welcome${firstName ? `, ${firstName}` : ''}!</h2>
          <p style="color: #444; line-height: 1.6;">
            Your Bare Camper account is ready. You can now browse Japan auction vans, save your favourites, and build your perfect campervan.
          </p>
          <a href="https://barecamper.com.au/browse"
             style="display: inline-block; background: #3D6B73; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; margin-top: 1rem;">
            Browse Vans
          </a>
          <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;">
          <p style="color: #888; font-size: 0.875rem;">
            Questions? Call Jared: 0432 182 892<br>
            hello@barecamper.com.au
          </p>
        </div>
      </div>
    `,
  }),

  depositHoldEmail: (customerName: string, vanTitle: string, amount: number) => ({
    subject: `Deposit hold confirmed — ${vanTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2C2C2A; padding: 2rem; text-align: center;">
          <h1 style="color: #E8CFA0; margin: 0; font-size: 1.5rem;">Bare Camper</h1>
        </div>
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A;">Deposit hold received</h2>
          <p style="color: #444; line-height: 1.6;">
            Hi ${customerName}, we've received your $${amount} deposit hold request for:
          </p>
          <div style="background: #F5F3ED; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
            <strong style="color: #2C2C2A;">${vanTitle}</strong>
          </div>
          <p style="color: #444; line-height: 1.6;">
            We'll be in touch within 1 business day to confirm and process your deposit payment.
          </p>
          <p style="color: #444; line-height: 1.6;">
            Your deposit is fully refundable if the auction is not won or you change your mind before bidding.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;">
          <p style="color: #888; font-size: 0.875rem;">
            Questions? Call Jared: 0432 182 892<br>
            hello@barecamper.com.au
          </p>
        </div>
      </div>
    `,
  }),

  depositHoldAdminEmail: (customerName: string, customerEmail: string, customerPhone: string, vanTitle: string, holdId: string) => ({
    subject: `New Deposit Hold Request — ${vanTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #2C2C2A;">New Deposit Hold Request</h2>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
        <p><strong>Van:</strong> ${vanTitle}</p>
        <p><strong>Hold ID:</strong> ${holdId}</p>
        <p><strong>Amount:</strong> $3,000 AUD</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 1rem 0;">
        <a href="https://barecamper.com.au/admin/leads" style="color: #3D6B73;">View in admin</a>
      </div>
    `,
  }),

  leadNotificationEmail: (type: string, name: string, email: string, phone: string, details: string) => ({
    subject: `New lead — ${type} — ${name || 'Anonymous'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #2C2C2A;">New ${type} enquiry</h2>
        <p><strong>Name:</strong> ${name || '—'}</p>
        <p><strong>Email:</strong> ${email || '—'}</p>
        <p><strong>Phone:</strong> ${phone || '—'}</p>
        <p><strong>Details:</strong> ${details || '—'}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 1rem 0;">
        <a href="https://barecamper.com.au/admin/leads" style="color: #3D6B73;">View in admin</a>
      </div>
    `,
  }),

  financeEnquiryEmail: (name: string, email: string, phone: string, budget: string, financeType: string, notes: string) => ({
    subject: `New finance enquiry — ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #2C2C2A;">New Finance Enquiry</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 0.5rem 0; color: #888; width: 140px;">Name</td><td style="padding: 0.5rem 0; color: #222;">${name}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #888;">Email</td><td style="padding: 0.5rem 0; color: #222;">${email}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #888;">Phone</td><td style="padding: 0.5rem 0; color: #222;">${phone}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #888;">Budget</td><td style="padding: 0.5rem 0; color: #222;">${budget}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #888;">Finance type</td><td style="padding: 0.5rem 0; color: #222;">${financeType}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #888;">Notes</td><td style="padding: 0.5rem 0; color: #222;">${notes || '—'}</td></tr>
        </table>
      </div>
    `,
  }),
}
