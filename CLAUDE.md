# Bare Camper — barecamper.com

## What this project is

Bare Camper is a joint venture between **Dream Drive** (Japan vehicle imports) and **DIY RV Solutions** (campervan parts & conversions). It's the customer-facing brand at **barecamper.com**.

The codebase lives in the `dreamdrive/` directory for historical reasons — it started as Dream Drive and evolved into Bare Camper.

## Customer journey

Customers start by getting a van, then choose their path:
1. **Just the van** — imported from Japan or sourced locally
2. **DIY build** — van + DIY RV Solutions parts/kits
3. **Turnkey fit-out** — van + full Dream Drive conversion (TAMA, MANA, etc.)

## Tech stack

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript
- **Database:** Supabase (PostgreSQL + Auth)
- **Payments:** Stripe
- **Email:** Resend
- **AI:** Anthropic SDK (listing translation)
- **Scraping:** Playwright + Chromium (auction imports)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS

## Key directories

```
src/app/           — Pages & API routes (file-based routing)
src/components/    — React components
src/lib/           — Utilities (supabase, pricing, utils)
src/types/         — TypeScript interfaces
supabase/          — Database schema (schema.sql)
public/            — Static assets & images
```

## Admin panel (/admin)

- `/admin/listings` — Browse, edit, bulk-manage vehicle listings
- `/admin/import` — Import from NINJA auction or dealer sites
- `/admin/scrape` — Trigger full auction scrape
- `/admin/customers` — CRM with customer journeys
- `/admin/products` — Manage fit-out/electrical/pop-top products
- `/admin/leads` — Track leads
- `/admin/settings` — Exchange rates, fees, shipping estimates

## Vehicle sources

| Source | How imported | Auth needed |
|--------|-------------|-------------|
| `auction` | NINJA cartrade scraper | Session cookie |
| `dealer_goonet` | Goo-net.com scraper | No |
| `dealer_carsensor` | Car Sensor scraper | No |
| `au_stock` | Manual entry | No |

## Coding rules

- Keep it simple. No over-engineering.
- Australian English in all user-facing copy (colour, authorised, etc.)
- Casual, friendly tone — this is a campervan brand, not a corporate site.
- Use existing patterns — check how similar features are already built before adding new ones.
- Tailwind for styling. Use existing utility classes (`btn-primary`, `btn-sm`, `text-ocean`, `bg-cream`, etc.)
- All prices stored in cents (AUD) or integer yen (JPY) in the database.
- Photos stored as URL arrays in the `photos` text[] column.

## Brand colours

- `ocean` — primary teal/blue (used for CTAs, links, accents)
- `cream` — warm background
- `charcoal` — headings and body text

## Current priorities

- Register barecamper.com.au (primary domain) — redirect .com → .com.au
- Availability checker for admin listings (in progress on branch `claude/musing-morse`)
- Clean up remaining "Dream Drive" references in UI copy
- Set up GA4 + Search Console env vars in Vercel
- Core Web Vitals audit
