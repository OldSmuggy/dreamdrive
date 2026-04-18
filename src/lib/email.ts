import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 'missing_key')

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

// ── Deal email templates ─────────────────────────────────────────────────────

interface VanDetails {
  year: string
  mileage: string
  chassis: string
  score: string
  auctionDate: string
  venue: string
  lot: string
  startPrice: string
  photos: string[]
}

interface AuctionDetails {
  auctionDate: string
  venue: string
  lot: string
  startPrice: string
}

const EMAIL_HEADER = `
  <div style="background: #2C2C2A; padding: 1.5rem 2rem; text-align: center;">
    <h1 style="color: #E8CFA0; margin: 0; font-size: 1.25rem;">Bare Camper</h1>
  </div>`

const EMAIL_FOOTER = `
  <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;">
  <p style="color: #888; font-size: 0.8rem;">
    Bare Camper &mdash; Dream Drive Pty Ltd<br>
    Questions? Call Jared: 0432 182 892<br>
    hello@barecamper.com.au
  </p>`

function photosHtml(photos: string[]): string {
  if (photos.length === 0) return '<p style="color: #888;">No photos available</p>'
  return photos
    .map(
      (url) =>
        `<img src="${url}" alt="Van photo" style="width: 280px; height: auto; border-radius: 8px; display: inline-block; margin: 4px;" />`
    )
    .join('\n')
}

function vanSpecsTable(details: VanDetails): string {
  return `
    <div style="background: #F5F3ED; padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
        <tr><td style="padding: 0.35rem 0; color: #888; width: 140px;">Mileage</td><td style="padding: 0.35rem 0; color: #222;">${details.mileage}</td></tr>
        <tr><td style="padding: 0.35rem 0; color: #888;">Chassis</td><td style="padding: 0.35rem 0; color: #222;">${details.chassis}</td></tr>
        <tr><td style="padding: 0.35rem 0; color: #888;">Auction Score</td><td style="padding: 0.35rem 0; color: #222;">${details.score}</td></tr>
        <tr><td style="padding: 0.35rem 0; color: #888;">Auction Date</td><td style="padding: 0.35rem 0; color: #222;">${details.auctionDate}</td></tr>
        <tr><td style="padding: 0.35rem 0; color: #888;">Venue</td><td style="padding: 0.35rem 0; color: #222;">${details.venue}</td></tr>
        <tr><td style="padding: 0.35rem 0; color: #888;">Lot</td><td style="padding: 0.35rem 0; color: #222;">${details.lot}</td></tr>
        <tr><td style="padding: 0.35rem 0; color: #888;">Start Price</td><td style="padding: 0.35rem 0; color: #222;">${details.startPrice}</td></tr>
      </table>
    </div>`
}

/** Email to customer when a deal is created — casual Aussie tone */
export function dealCreatedCustomerEmail(
  customerName: string,
  vanTitle: string,
  vanDetails: VanDetails,
  listingUrl: string
) {
  return {
    subject: `Great news — we've found your van! \u{1F690}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 1rem;">G'day ${customerName}!</h2>
          <p style="color: #444; line-height: 1.6;">
            Exciting news &mdash; we've found a cracking van for you at auction in Japan!
          </p>

          <div style="background: #F5F3ED; padding: 1.25rem; border-radius: 12px; margin: 1.5rem 0;">
            <h3 style="color: #2C2C2A; margin: 0 0 0.5rem; font-size: 1.1rem;">${vanTitle}</h3>
            <p style="color: #666; margin: 0; font-size: 0.9rem;">
              ${vanDetails.year} &bull; ${vanDetails.mileage} &bull; Score: ${vanDetails.score}
            </p>
          </div>

          <div style="margin-bottom: 1.5rem;">
            ${photosHtml(vanDetails.photos)}
          </div>

          <p style="color: #444; line-height: 1.6;">
            Our team in Japan is ready to bid on this one for you. We just need a deposit to secure it and get the ball rolling.
          </p>
          <p style="color: #444; line-height: 1.6;">
            We'll keep you updated every step of the way &mdash; from the auction floor to your driveway.
          </p>

          <a href="${listingUrl}" style="display: inline-block; background: #3D6B73; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-size: 0.95rem; margin-top: 0.5rem;">
            View Your Van
          </a>

          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }
}

/** Email to buyer when a deal is created — professional with full specs */
export function dealCreatedBuyerEmail(
  customerFirstNameInitial: string,
  vanTitle: string,
  vanDetails: VanDetails,
  auctionDetails: AuctionDetails,
  listingUrl: string
) {
  return {
    subject: `New Deal \u2014 ${vanTitle} \u2014 ${customerFirstNameInitial}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="background: #2C2C2A; padding: 0 2rem 0.5rem; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 0.8rem;">New Deal Started</p>
        </div>

        <div style="padding: 2rem;">
          <p style="color: #444; line-height: 1.6;">
            We have a customer ready to proceed with this vehicle. Please confirm availability and begin bidding preparations.
          </p>

          <h3 style="color: #2C2C2A; margin: 1.5rem 0 0.75rem;">${vanTitle}</h3>
          ${vanSpecsTable(vanDetails)}

          <div style="background: #EEF7ED; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="font-size: 0.9rem; color: #2C2C2A; margin: 0;">
              <strong>Customer:</strong> ${customerFirstNameInitial}
            </p>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <p style="color: #888; font-size: 0.8rem; margin-bottom: 0.5rem;">Photos:</p>
            ${photosHtml(vanDetails.photos)}
          </div>

          <a href="${listingUrl}" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem;">
            View Listing
          </a>

          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }
}

/** Email to customer on deal status change — friendly update */
export function dealStatusCustomerEmail(
  customerName: string,
  vanTitle: string,
  newStatus: string,
  statusMessage: string
) {
  // Friendly status labels for customers
  const statusLabels: Record<string, string> = {
    draft: 'Getting Started',
    deposit_pending: 'Deposit Needed',
    deposit_received: 'Deposit Confirmed',
    bidding: 'Bidding in Progress',
    won: 'Auction Won!',
    lost: 'Auction Update',
    shipping: 'On Its Way',
    delivered: 'Arrived in Australia',
    completed: 'All Done!',
    cancelled: 'Deal Cancelled',
  }

  const label = statusLabels[newStatus] || newStatus

  return {
    subject: `${label} \u2014 ${vanTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 1rem;">Hey ${customerName}!</h2>

          <div style="background: #F5F3ED; padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem;">
            <p style="color: #888; margin: 0 0 0.25rem; font-size: 0.8rem;">YOUR VAN</p>
            <p style="color: #2C2C2A; margin: 0; font-weight: 600;">${vanTitle}</p>
          </div>

          <div style="background: #EEF7ED; padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem;">
            <p style="color: #888; margin: 0 0 0.25rem; font-size: 0.8rem;">STATUS UPDATE</p>
            <p style="color: #2C2C2A; margin: 0; font-weight: 600; font-size: 1.1rem;">${label}</p>
          </div>

          <p style="color: #444; line-height: 1.6; font-size: 1rem;">
            ${statusMessage}
          </p>

          <a href="https://barecamper.com.au/my-van" style="display: inline-block; background: #3D6B73; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-size: 0.95rem; margin-top: 1rem;">
            Track Your Van
          </a>

          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }
}

/** Email to buyer on deal status change — professional instruction */
export function dealStatusBuyerEmail(
  customerFirstNameInitial: string,
  vanTitle: string,
  newStatus: string,
  instruction: string
) {
  return {
    subject: `Deal Update \u2014 ${vanTitle} \u2014 ${customerFirstNameInitial} \u2014 ${newStatus.replace(/_/g, ' ')}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <p style="color: #444; line-height: 1.6;">
            Deal status update for <strong>${vanTitle}</strong>.
          </p>

          <div style="background: #F5F3ED; padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
              <tr><td style="padding: 0.35rem 0; color: #888; width: 120px;">Vehicle</td><td style="padding: 0.35rem 0; color: #222;">${vanTitle}</td></tr>
              <tr><td style="padding: 0.35rem 0; color: #888;">Customer</td><td style="padding: 0.35rem 0; color: #222;">${customerFirstNameInitial}</td></tr>
              <tr><td style="padding: 0.35rem 0; color: #888;">New Status</td><td style="padding: 0.35rem 0; color: #222; font-weight: 600;">${newStatus.replace(/_/g, ' ').toUpperCase()}</td></tr>
            </table>
          </div>

          <div style="background: #FFF8E7; padding: 1rem; border-radius: 8px; border-left: 4px solid #E8CFA0; margin-bottom: 1.5rem;">
            <p style="font-size: 0.9rem; color: #2C2C2A; margin: 0;">
              <strong>Action Required:</strong><br>
              ${instruction}
            </p>
          </div>

          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }
}

// ── Existing email templates ─────────────────────────────────────────────────

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
        <p><strong>Amount:</strong> $2,750 AUD (inc GST)</p>
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

  vanSubmissionReceivedEmail: (name: string, modelName: string, modelYear: number | null) => ({
    subject: `Van submission received — we'll be in touch!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 1rem;">Thanks for submitting, ${name}!</h2>
          <p style="color: #444; line-height: 1.6;">
            We've received your van listing — we'll review it shortly and let you know when it goes live.
          </p>
          <div style="background: #F5F3ED; padding: 1.25rem; border-radius: 12px; margin: 1.5rem 0;">
            <p style="color: #888; margin: 0 0 0.25rem; font-size: 0.8rem;">VAN SUBMITTED</p>
            <p style="color: #2C2C2A; font-weight: 600; margin: 0;">${modelYear ? `${modelYear} ` : ''}${modelName}</p>
          </div>
          <p style="color: #444; line-height: 1.6;">
            If a Bare Camper customer buys your van, you'll earn a <strong>$200 finders fee</strong> — we'll ping you when that happens.
          </p>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }),

  vanSubmissionAutoPublishedEmail: (name: string, modelName: string, modelYear: number | null, listingUrl: string) => ({
    subject: `Your van is live on Bare Camper! 🚐`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 1rem;">Your van is live, ${name}!</h2>
          <p style="color: #444; line-height: 1.6;">
            Great news — your submission has gone live on Bare Camper. Buyers can now see it.
          </p>
          <div style="background: #EEF7ED; padding: 1.25rem; border-radius: 12px; margin: 1.5rem 0; border-left: 4px solid #3D6B73;">
            <p style="color: #888; margin: 0 0 0.25rem; font-size: 0.8rem;">NOW LIVE</p>
            <p style="color: #2C2C2A; font-weight: 600; margin: 0 0 0.75rem;">${modelYear ? `${modelYear} ` : ''}${modelName}</p>
            <a href="${listingUrl}" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem;">
              View Listing
            </a>
          </div>
          <p style="color: #444; line-height: 1.6;">
            Remember — if it sells through Bare Camper, you earn <strong>$200</strong>. We'll be in touch!
          </p>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }),

  vanSubmissionApprovedEmail: (name: string, modelName: string, modelYear: number | null, listingUrl: string) => ({
    subject: `Your van listing is approved and live! 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 1rem;">Approved! Your van is now live, ${name}.</h2>
          <p style="color: #444; line-height: 1.6;">
            We've reviewed your submission and it's now live on Bare Camper for buyers to see.
          </p>
          <div style="background: #EEF7ED; padding: 1.25rem; border-radius: 12px; margin: 1.5rem 0; border-left: 4px solid #3D6B73;">
            <p style="color: #888; margin: 0 0 0.25rem; font-size: 0.8rem;">YOUR LISTING</p>
            <p style="color: #2C2C2A; font-weight: 600; margin: 0 0 0.75rem;">${modelYear ? `${modelYear} ` : ''}${modelName}</p>
            <a href="${listingUrl}" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem;">
              View Your Listing
            </a>
          </div>
          <p style="color: #444; line-height: 1.6;">
            If a Bare Camper customer buys it, you'll earn a <strong>$200 finders fee</strong> — we'll email you straight away.
          </p>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }),

  vanSubmissionRejectedEmail: (name: string, modelName: string) => ({
    subject: `Update on your van submission`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 1rem;">Hey ${name},</h2>
          <p style="color: #444; line-height: 1.6;">
            Thanks for submitting your ${modelName} — unfortunately it's not quite the right fit for what we're listing at the moment.
          </p>
          <p style="color: #444; line-height: 1.6;">
            This might be down to spec, condition, or just timing. Don't be put off though — if you spot another van, feel free to submit again. The more tips, the better.
          </p>
          <a href="https://barecamper.com.au/submit-a-van" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem; margin-top: 0.5rem;">
            Submit Another Van
          </a>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }),

  vanSubmissionAdminEmail: (name: string, email: string, phone: string, modelName: string, modelYear: number | null, location: string, askingPrice: number | null, photos: string[], autoPublished: boolean) => ({
    subject: `New van submission${autoPublished ? ' (auto-published)' : ''} — ${modelYear ? `${modelYear} ` : ''}${modelName} from ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          ${autoPublished ? `<div style="background: #EEF7ED; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #3D6B73;"><p style="color: #2C2C2A; margin: 0; font-size: 0.9rem;"><strong>Auto-published</strong> — trusted submitter, listing is already live.</p></div>` : ''}
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.9rem;">
            <tr><td style="padding: 0.4rem 0; color: #888; width: 120px;">Submitter</td><td style="padding: 0.4rem 0; color: #222;">${name}</td></tr>
            <tr><td style="padding: 0.4rem 0; color: #888;">Email</td><td style="padding: 0.4rem 0;"><a href="mailto:${email}" style="color: #3D6B73;">${email}</a></td></tr>
            <tr><td style="padding: 0.4rem 0; color: #888;">Phone</td><td style="padding: 0.4rem 0; color: #222;">${phone || '—'}</td></tr>
            <tr><td style="padding: 0.4rem 0; color: #888;">Van</td><td style="padding: 0.4rem 0; color: #222; font-weight: 600;">${modelYear ? `${modelYear} ` : ''}${modelName}</td></tr>
            <tr><td style="padding: 0.4rem 0; color: #888;">Location</td><td style="padding: 0.4rem 0; color: #222;">${location || '—'}</td></tr>
            <tr><td style="padding: 0.4rem 0; color: #888;">Asking price</td><td style="padding: 0.4rem 0; color: #222;">${askingPrice ? `$${(askingPrice / 100).toLocaleString()} AUD` : '—'}</td></tr>
            <tr><td style="padding: 0.4rem 0; color: #888;">Photos</td><td style="padding: 0.4rem 0; color: #222;">${photos.length} uploaded</td></tr>
          </table>
          <div style="margin-bottom: 1.5rem;">
            ${photos.slice(0, 6).map(url => `<img src="${url}" alt="Van photo" style="width: 180px; height: auto; border-radius: 8px; display: inline-block; margin: 4px;" />`).join('')}
          </div>
          <a href="https://barecamper.com.au/admin/van-submissions" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem;">
            Review in Admin
          </a>
        </div>
      </div>
    `,
  }),

  vanSubmissionFeeEarnedEmail: (name: string, vanTitle: string, feeAud: number) => ({
    subject: `Your van sold — $${(feeAud / 100).toFixed(0)} finders fee coming your way! 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 1rem;">Great news, ${name} — your van sold! 🎉</h2>
          <p style="color: #444; line-height: 1.6;">
            A Bare Camper customer has purchased the van you submitted. Your $${(feeAud / 100).toFixed(0)} finders fee is on its way.
          </p>
          <div style="background: #EEF7ED; padding: 1.25rem; border-radius: 12px; margin: 1.5rem 0; border-left: 4px solid #3D6B73;">
            <p style="color: #888; margin: 0 0 0.25rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">VAN SOLD</p>
            <p style="color: #2C2C2A; margin: 0 0 0.5rem; font-weight: 600;">${vanTitle}</p>
            <p style="color: #3D6B73; margin: 0; font-size: 1.2rem; font-weight: 700;">$${(feeAud / 100).toFixed(0)} AUD finders fee</p>
          </div>
          <p style="color: #444; line-height: 1.6;">
            We'll be in touch shortly to arrange the bank transfer. Cheers for the great find!
          </p>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }),

  vehicleTipConfirmationEmail: (name: string, vehicleUrl: string) => ({
    subject: `We've got your tip — fingers crossed for that $200! 🤞`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 1rem;">Thanks for the tip, ${name}!</h2>
          <p style="color: #444; line-height: 1.6;">
            We've received your van tip and we'll take a look at it. Here's how the finders fee works:
          </p>
          <div style="background: #F5F3ED; padding: 1.25rem; border-radius: 12px; margin: 1.5rem 0;">
            <ol style="color: #444; line-height: 1.8; margin: 0; padding-left: 1.25rem;">
              <li>We review the van you've found</li>
              <li>If we list it and a customer buys it through Bare Camper</li>
              <li><strong style="color: #2C2C2A;">We pay you $200 AUD</strong></li>
            </ol>
          </div>
          ${vehicleUrl ? `<p style="color: #888; font-size: 0.875rem;">Van you submitted: <a href="${vehicleUrl}" style="color: #3D6B73;">${vehicleUrl}</a></p>` : ''}
          <p style="color: #444; line-height: 1.6;">
            We'll be in touch if it becomes a match. Keep the tips coming — there's no limit on how many you can submit!
          </p>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }),

  vehicleTipAdminEmail: (name: string, email: string, phone: string, vehicleUrl: string, notes: string) => ({
    subject: `New van tip from ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #2C2C2A;">New Vehicle Tip — Finders Fee</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
          <tr><td style="padding: 0.4rem 0; color: #888; width: 120px;">Name</td><td style="padding: 0.4rem 0; color: #222;">${name}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #888;">Email</td><td style="padding: 0.4rem 0; color: #222;">${email}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #888;">Phone</td><td style="padding: 0.4rem 0; color: #222;">${phone || '—'}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #888;">Vehicle URL</td><td style="padding: 0.4rem 0;">${vehicleUrl ? `<a href="${vehicleUrl}" style="color: #3D6B73;">${vehicleUrl}</a>` : '—'}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #888;">Notes</td><td style="padding: 0.4rem 0; color: #222;">${notes || '—'}</td></tr>
        </table>
        <a href="https://barecamper.com.au/admin/vehicle-tips" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem;">
          Review in Admin
        </a>
      </div>
    `,
  }),

  vehicleTipFeeEarnedEmail: (name: string, vanTitle: string, feeAud: number) => ({
    subject: `You've earned your $${(feeAud / 100).toFixed(0)} finders fee! 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 1rem;">Your tip paid off, ${name}! 🎉</h2>
          <p style="color: #444; line-height: 1.6;">
            Great news — the van you tipped us off about has been purchased by a customer on Bare Camper.
          </p>
          <div style="background: #EEF7ED; padding: 1.25rem; border-radius: 12px; margin: 1.5rem 0; border-left: 4px solid #3D6B73;">
            <p style="color: #888; margin: 0 0 0.25rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">VAN SOLD</p>
            <p style="color: #2C2C2A; margin: 0 0 0.5rem; font-weight: 600;">${vanTitle}</p>
            <p style="color: #3D6B73; margin: 0; font-size: 1.2rem; font-weight: 700;">
              Finders fee: $${(feeAud / 100).toFixed(0)} AUD
            </p>
          </div>
          <p style="color: #444; line-height: 1.6;">
            We'll get your payment sorted — we'll be in touch shortly to arrange the transfer. Cheers for the tip!
          </p>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }),

  financeApplicationEmail: (data: {
    firstName: string; middleName: string; lastName: string; email: string; phone: string; dob: string;
    purpose: string; vehicleType: string; buyingFrom: string; vehicleYear: string; condition: string;
    businessUse: string; vehiclePrice: string; deposit: string; loanAmount: string; loanTerm: string;
    balloonPct: string; balloonAmount: string; employmentType: string; employmentYears: string;
    employmentMonths: string; residencyStatus: string; livingSituation: string; address: string;
  }) => ({
    subject: `New Finance Application — ${data.firstName} ${data.lastName} — $${Number(data.loanAmount).toLocaleString()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 0.5rem;">New Finance Application</h2>
          <p style="color: #888; font-size: 0.85rem; margin: 0 0 1.5rem;">Submitted via barecamper.com.au/finance</p>

          <h3 style="color: #3D6B73; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.35rem;">Applicant</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr><td style="padding: 0.35rem 0; color: #888; width: 150px;">Name</td><td style="padding: 0.35rem 0; color: #222;">${data.firstName}${data.middleName ? ` ${data.middleName}` : ''} ${data.lastName}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Email</td><td style="padding: 0.35rem 0;"><a href="mailto:${data.email}" style="color: #3D6B73;">${data.email}</a></td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Phone</td><td style="padding: 0.35rem 0; color: #222;">${data.phone}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Date of Birth</td><td style="padding: 0.35rem 0; color: #222;">${data.dob || '—'}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Address</td><td style="padding: 0.35rem 0; color: #222;">${data.address || '—'}</td></tr>
          </table>

          <h3 style="color: #3D6B73; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.35rem;">Vehicle</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr><td style="padding: 0.35rem 0; color: #888; width: 150px;">Purpose</td><td style="padding: 0.35rem 0; color: #222;">${data.purpose}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Vehicle Type</td><td style="padding: 0.35rem 0; color: #222;">${data.vehicleType}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Buying From</td><td style="padding: 0.35rem 0; color: #222;">${data.buyingFrom}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Year</td><td style="padding: 0.35rem 0; color: #222;">${data.vehicleYear}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Condition</td><td style="padding: 0.35rem 0; color: #222;">${data.condition}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Business Use</td><td style="padding: 0.35rem 0; color: #222;">${data.businessUse}</td></tr>
          </table>

          <h3 style="color: #3D6B73; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.35rem;">Loan</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr><td style="padding: 0.35rem 0; color: #888; width: 150px;">Vehicle Price</td><td style="padding: 0.35rem 0; color: #222; font-weight: 600;">$${Number(data.vehiclePrice).toLocaleString()}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Deposit</td><td style="padding: 0.35rem 0; color: #222;">$${Number(data.deposit).toLocaleString()}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Loan Amount</td><td style="padding: 0.35rem 0; color: #222; font-weight: 600; font-size: 1rem;">$${Number(data.loanAmount).toLocaleString()}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Term</td><td style="padding: 0.35rem 0; color: #222;">${data.loanTerm} years</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Balloon</td><td style="padding: 0.35rem 0; color: #222;">${data.balloonPct}% ($${Number(data.balloonAmount).toLocaleString()})</td></tr>
          </table>

          <h3 style="color: #3D6B73; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.35rem;">Employment & Residency</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr><td style="padding: 0.35rem 0; color: #888; width: 150px;">Employment</td><td style="padding: 0.35rem 0; color: #222;">${data.employmentType}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Duration</td><td style="padding: 0.35rem 0; color: #222;">${data.employmentYears} years${data.employmentMonths ? `, ${data.employmentMonths} months` : ''}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Residency</td><td style="padding: 0.35rem 0; color: #222;">${data.residencyStatus}</td></tr>
            <tr><td style="padding: 0.35rem 0; color: #888;">Living Situation</td><td style="padding: 0.35rem 0; color: #222;">${data.livingSituation}</td></tr>
          </table>

          <div style="margin-top: 1.5rem;">
            <a href="https://barecamper.com.au/admin/leads" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem;">
              View in Admin
            </a>
          </div>

          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }),

  listingInterestSellerEmail: (sellerName: string, vanTitle: string, buyerName: string, buyerEmail: string, buyerPhone: string, message: string, listingUrl: string) => ({
    subject: `Someone's interested in your ${vanTitle}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 1rem;">G'day ${sellerName}!</h2>
          <p style="color: #444; line-height: 1.6;">
            Great news — someone is interested in your van listing on Bare Camper.
          </p>
          <div style="background: #F5F3ED; padding: 1.25rem; border-radius: 12px; margin: 1.5rem 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
              <tr><td style="padding: 0.4rem 0; color: #888; width: 80px;">Name</td><td style="padding: 0.4rem 0; color: #2C2C2A; font-weight: 600;">${buyerName}</td></tr>
              <tr><td style="padding: 0.4rem 0; color: #888;">Email</td><td style="padding: 0.4rem 0; color: #2C2C2A;"><a href="mailto:${buyerEmail}" style="color: #3D6B73;">${buyerEmail}</a></td></tr>
              ${buyerPhone ? `<tr><td style="padding: 0.4rem 0; color: #888;">Phone</td><td style="padding: 0.4rem 0; color: #2C2C2A;"><a href="tel:${buyerPhone}" style="color: #3D6B73;">${buyerPhone}</a></td></tr>` : ''}
              ${message ? `<tr><td style="padding: 0.4rem 0; color: #888; vertical-align: top;">Message</td><td style="padding: 0.4rem 0; color: #2C2C2A;">${message}</td></tr>` : ''}
            </table>
          </div>
          <p style="color: #444; line-height: 1.6;">
            You can reply to them directly using the details above. Good luck with the sale!
          </p>
          <a href="${listingUrl}" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem; margin-top: 0.5rem;">
            View Your Listing
          </a>
          ${EMAIL_FOOTER}
        </div>
      </div>
    `,
  }),

  listingInterestAdminEmail: (vanTitle: string, sellerEmail: string, buyerName: string, buyerEmail: string, buyerPhone: string, message: string, listingUrl: string) => ({
    subject: `Listing interest — ${vanTitle} — ${buyerName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        ${EMAIL_HEADER}
        <div style="padding: 2rem;">
          <h2 style="color: #2C2C2A; margin: 0 0 0.5rem;">New Listing Interest</h2>
          <p style="color: #888; font-size: 0.85rem; margin: 0 0 1.5rem;">Community listing: ${vanTitle}</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <tr><td style="padding: 0.4rem 0; color: #888; width: 80px;">Buyer</td><td style="padding: 0.4rem 0; color: #2C2C2A;">${buyerName} (${buyerEmail}${buyerPhone ? `, ${buyerPhone}` : ''})</td></tr>
            <tr><td style="padding: 0.4rem 0; color: #888;">Seller</td><td style="padding: 0.4rem 0; color: #2C2C2A;">${sellerEmail}</td></tr>
            ${message ? `<tr><td style="padding: 0.4rem 0; color: #888;">Message</td><td style="padding: 0.4rem 0; color: #2C2C2A;">${message}</td></tr>` : ''}
          </table>
          <a href="${listingUrl}" style="display: inline-block; background: #3D6B73; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem; margin-top: 1rem;">
            View Listing
          </a>
          ${EMAIL_FOOTER}
        </div>
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
