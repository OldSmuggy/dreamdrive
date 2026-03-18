import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
  from = 'Dream Drive <noreply@dreamdrive.life>',
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
    subject: 'Welcome to Dream Drive',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a3a2a; padding: 2rem; text-align: center;">
          <h1 style="color: #c9b98a; margin: 0; font-size: 1.5rem;">Dream Drive</h1>
        </div>
        <div style="padding: 2rem;">
          <h2 style="color: #1a3a2a;">Welcome${firstName ? `, ${firstName}` : ''}!</h2>
          <p style="color: #444; line-height: 1.6;">
            Your Dream Drive account is ready. You can now browse Japan auction vans, save your favourites, and build your perfect campervan.
          </p>
          <a href="https://dreamdrive-zeta.vercel.app/browse"
             style="display: inline-block; background: #1a3a2a; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; margin-top: 1rem;">
            Browse Vans
          </a>
          <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;">
          <p style="color: #888; font-size: 0.875rem;">
            Questions? Call Jared: 0432 182 892<br>
            jared@dreamdrive.life
          </p>
        </div>
      </div>
    `,
  }),

  depositHoldEmail: (customerName: string, vanTitle: string, amount: number) => ({
    subject: `Deposit hold confirmed \u2014 ${vanTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a3a2a; padding: 2rem; text-align: center;">
          <h1 style="color: #c9b98a; margin: 0; font-size: 1.5rem;">Dream Drive</h1>
        </div>
        <div style="padding: 2rem;">
          <h2 style="color: #1a3a2a;">Deposit hold received</h2>
          <p style="color: #444; line-height: 1.6;">
            Hi ${customerName}, we've received your $${amount} deposit hold request for:
          </p>
          <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
            <strong style="color: #1a3a2a;">${vanTitle}</strong>
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
            jared@dreamdrive.life
          </p>
        </div>
      </div>
    `,
  }),

  depositHoldAdminEmail: (customerName: string, customerEmail: string, customerPhone: string, vanTitle: string, holdId: string) => ({
    subject: `New Deposit Hold Request \u2014 ${vanTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #1a3a2a;">New Deposit Hold Request</h2>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
        <p><strong>Van:</strong> ${vanTitle}</p>
        <p><strong>Hold ID:</strong> ${holdId}</p>
        <p><strong>Amount:</strong> $500 AUD</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 1rem 0;">
        <a href="https://dreamdrive-zeta.vercel.app/admin/leads" style="color: #1a3a2a;">View in admin</a>
      </div>
    `,
  }),

  leadNotificationEmail: (type: string, name: string, email: string, phone: string, details: string) => ({
    subject: `New lead \u2014 ${type} \u2014 ${name || 'Anonymous'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #1a3a2a;">New ${type} enquiry</h2>
        <p><strong>Name:</strong> ${name || '\u2014'}</p>
        <p><strong>Email:</strong> ${email || '\u2014'}</p>
        <p><strong>Phone:</strong> ${phone || '\u2014'}</p>
        <p><strong>Details:</strong> ${details || '\u2014'}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 1rem 0;">
        <a href="https://dreamdrive-zeta.vercel.app/admin/leads" style="color: #1a3a2a;">View in admin</a>
      </div>
    `,
  }),

  financeEnquiryEmail: (name: string, email: string, phone: string, budget: string, financeType: string, notes: string) => ({
    subject: `New finance enquiry \u2014 ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #1a3a2a;">New Finance Enquiry</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 0.5rem 0; color: #888; width: 140px;">Name</td><td style="padding: 0.5rem 0; color: #222;">${name}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #888;">Email</td><td style="padding: 0.5rem 0; color: #222;">${email}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #888;">Phone</td><td style="padding: 0.5rem 0; color: #222;">${phone}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #888;">Budget</td><td style="padding: 0.5rem 0; color: #222;">${budget}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #888;">Finance type</td><td style="padding: 0.5rem 0; color: #222;">${financeType}</td></tr>
          <tr><td style="padding: 0.5rem 0; color: #888;">Notes</td><td style="padding: 0.5rem 0; color: #222;">${notes || '\u2014'}</td></tr>
        </table>
      </div>
    `,
  }),
}
