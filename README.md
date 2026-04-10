# Bare Camper — barecamper.com

> Find it. Build it. Drive it.

Japan auction sourcing · Dealer listings · Bare Camper fit-out range · Pop top · Electrical systems

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_ORG/dreamdrive.git
cd dreamdrive
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your `Project URL` and `anon` key
3. Run the schema in **SQL Editor**:
   ```sql
   -- Paste contents of supabase/schema.sql and run
   ```
4. This creates all tables, RLS policies, and seeds your products + The Green Machine

### 3. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your keys
```

Required keys:
| Key | Where to find |
|-----|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `STRIPE_SECRET_KEY` | Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard |
| `OPEN_EXCHANGE_RATES_APP_ID` | openexchangerates.org |

### 4. Run Locally

```bash
npm run dev
# → http://localhost:3000
```

### 5. Deploy to Vercel

```bash
npx vercel --prod
# Set environment variables in Vercel dashboard
```

---

## Project Structure

```
src/
  app/
    page.tsx              # Homepage
    browse/               # Van listings browse
    van/[id]/             # Van detail + build CTA
    build/                # Configurator
    quiz/                 # Van Match quiz
    admin/                # Admin dashboard (auth-protected)
      products/           # Price & specials management
      listings/           # All vehicle listings
      leads/              # Consultation leads
      settings/           # Exchange rate, estimates
    api/
      listings/           # GET listings
      builds/             # POST save build
      leads/              # POST/GET leads
      exchange-rate/      # GET JPY/AUD rate
      scrape/             # POST trigger scrape
  components/
    ui/
      AuctionBanner.tsx   # Site-wide Thursday countdown
    listings/
      BrowseClient.tsx    # Filter + listing grid
    configurator/
      ConfiguratorClient.tsx  # 5-step build configurator
  lib/
    supabase.ts           # Browser + server + admin clients
    utils.ts              # Money, countdown, score helpers
  types/
    index.ts              # All TypeScript types
supabase/
  schema.sql              # Complete DB schema + seed
scripts/
  scrape-ninja.ts         # NINJA Car Trade scraper (Playwright)
```

---

## Admin Dashboard

Visit `/admin` (requires Supabase auth login).

### Updating prices

1. Supabase Dashboard → Table Editor → `products`
2. Edit `rrp_aud` (in **cents** — e.g. `1190000` = $11,900)
3. For a special: set `special_price_aud`, `special_label`, `special_start`, `special_end`
4. Save — configurator updates immediately, no deploy needed

### Running the scraper

The NINJA Car Trade scraper requires Playwright and your member credentials:

```bash
NINJA_LOGIN_ID=your_id NINJA_PASSWORD=your_pass npx ts-node scripts/scrape-ninja.ts
```

For automated weekly scraping, deploy the scraper as a separate Railway service and trigger via cron.

---

## Phase Roadmap

| Phase | Scope | Target |
|-------|-------|--------|
| **Phase 1** (current) | NINJA scrape + browse + AU stock CMS + H200 configurator + pricing admin | **8 weeks** |
| Phase 2 | Thursday FOMO mechanics + Car Sensor + Goo-Net + deposit holds + email sequences | 14 weeks |
| Phase 3 | Van match quiz polish + build share + full user dashboard + CRM (HubSpot) | 20 weeks |
| Phase 4 | Additional models, SMS, referral, SEO content | 28 weeks |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel |
| Images | Cloudflare R2 (or AWS S3) |
| Scraping | Playwright (separate service) |
| Payments | Stripe |
| Exchange Rate | Open Exchange Rates |

---

## Contact

Jared Campion · [jared@dreamdrive.life](mailto:jared@dreamdrive.life) · 0432 182 892
