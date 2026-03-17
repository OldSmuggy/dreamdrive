-- ============================================================
-- DREAM DRIVE — Supabase Schema
-- Run this in your Supabase SQL Editor (Settings > SQL)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PRODUCTS (fit-out, electrical, pop top)
-- ============================================================
create table if not exists products (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  category            text not null,   -- 'fitout' | 'electrical' | 'poptop' | 'bed'
  rrp_aud             int  not null,   -- cents
  special_price_aud   int  null,       -- cents, null = no special
  special_label       text null,
  special_start       timestamptz null,
  special_end         timestamptz null,
  description         text null,
  visible             boolean default true,
  sort_order          int default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ============================================================
-- LISTINGS — unified vehicle table (all sources)
-- ============================================================
create table if not exists listings (
  id                  uuid primary key default gen_random_uuid(),
  source              text not null,   -- 'auction' | 'dealer_carsensor' | 'dealer_goonet' | 'au_stock'
  external_id         text null,       -- site-specific identifier
  kaijo_code          text null,       -- auction site code e.g. TK, YK
  auction_count       text null,       -- auction session number
  bid_no              text null,       -- lot number
  auction_date        date null,
  model_name          text not null,
  grade               text null,
  chassis_code        text null,
  model_year          int  null,
  transmission        text null,       -- 'IA' | 'AT' | 'MT'
  displacement_cc     int  null,
  drive               text null,       -- '2WD' | '4WD'
  mileage_km          int  null,
  inspection_score    text null,       -- 'S','6','5.5','5','4.5','4','3.5','3','R','RA','X'
  body_colour         text null,
  start_price_jpy     int  null,
  buy_price_jpy       int  null,       -- dealer buy-now or sold price
  aud_estimate        int  null,       -- cents, calculated at scrape time
  status              text default 'available', -- 'available' | 'auction_ended' | 'sold' | 'reserved'
  bid_result          text null,
  -- AU stock extras
  au_price_aud        int  null,       -- cents
  au_status           text null,       -- 'import_pending' | 'import_approved' | 'en_route' | 'at_dock' | 'in_transit_au' | 'available_now'
  eta_date            date null,
  featured            boolean default false,
  description         text null,
  -- Equipment flags
  has_nav             boolean default false,
  has_leather         boolean default false,
  has_sunroof         boolean default false,
  has_alloys          boolean default false,
  -- Photos (array of CDN URLs)
  photos              text[] default '{}',
  inspection_sheet    text null,       -- CDN URL
  -- Metadata
  raw_data            jsonb null,
  scraped_at          timestamptz null,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists listings_source_idx       on listings(source);
create index if not exists listings_status_idx       on listings(status);
create index if not exists listings_auction_date_idx on listings(auction_date);
create index if not exists listings_grade_idx        on listings(grade);

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table if not exists user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text null,
  phone       text null,
  state       text null,
  push_token  text null,
  email_prefs jsonb default '{"auction_countdown": true, "new_listings": true, "specials": true}'::jsonb,
  created_at  timestamptz default now()
);

-- ============================================================
-- SAVED VANS watchlist
-- ============================================================
create table if not exists saved_vans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  listing_id  uuid references listings(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, listing_id)
);

-- ============================================================
-- BUILDS — saved configurator state
-- ============================================================
create table if not exists builds (
  id                uuid primary key default gen_random_uuid(),
  share_slug        text unique not null,  -- short random slug for shareable URL
  user_id           uuid references auth.users(id) on delete set null,
  listing_id        uuid references listings(id) on delete set null,
  fitout_product_id uuid references products(id) on delete set null,
  elec_product_id   uuid references products(id) on delete set null,
  poptop_product_id uuid references products(id) on delete set null,
  poptop_japan      boolean default false,
  total_aud_min     int null,   -- cents
  total_aud_max     int null,   -- cents
  notes             text null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists builds_user_idx  on builds(user_id);
create index if not exists builds_slug_idx  on builds(share_slug);

-- ============================================================
-- DEPOSITS
-- ============================================================
create table if not exists deposits (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete set null,
  listing_id          uuid references listings(id) on delete set null,
  build_id            uuid references builds(id) on delete set null,
  stripe_payment_intent text null,
  amount_aud          int default 50000,  -- cents = $500
  status              text default 'pending',  -- 'pending' | 'held' | 'refunded' | 'converted'
  customer_email      text null,
  customer_name       text null,
  customer_phone      text null,
  notes               text null,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ============================================================
-- LEADS (consultation, expression of interest)
-- ============================================================
create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  type            text not null,  -- 'consultation' | 'interest' | 'quiz_result'
  name            text null,
  email           text null,
  phone           text null,
  listing_id      uuid references listings(id) on delete set null,
  build_id        uuid references builds(id) on delete set null,
  estimated_value int null,  -- cents, total build value at time of lead
  source          text null, -- 'configurator' | 'van_detail' | 'quiz' | 'homepage'
  notes           text null,
  status          text default 'new',  -- 'new' | 'contacted' | 'qualified' | 'closed'
  created_at      timestamptz default now()
);

-- ============================================================
-- ADMIN SETTINGS (exchange rate, import estimates)
-- ============================================================
create table if not exists settings (
  key    text primary key,
  value  text not null,
  label  text null,
  updated_at timestamptz default now()
);

insert into settings (key, value, label) values
  ('jpy_aud_override',     '',        'JPY/AUD rate override (leave blank to use live rate)'),
  ('shipping_estimate',    '350000',  'Shipping estimate AUD (cents)'),
  ('import_duty_pct',      '500',     'Import duty % × 100 (e.g. 500 = 5%)'),
  ('compliance_estimate',  '200000',  'Compliance estimate AUD (cents)'),
  ('show_gst',             'true',    'Show GST in price estimates'),
  ('price_disclaimer',     'Final pricing confirmed at consultation. Import/shipping estimate based on current rates.', 'Price estimate disclaimer')
on conflict (key) do nothing;

-- ============================================================
-- SCRAPE LOG
-- ============================================================
create table if not exists scrape_logs (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  started_at    timestamptz default now(),
  completed_at  timestamptz null,
  listings_found int null,
  listings_new   int null,
  status        text default 'running',  -- 'running' | 'success' | 'failed'
  error         text null
);

-- ============================================================
-- CUSTOMERS (admin CRM)
-- ============================================================
create table if not exists customers (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  first_name          text not null,
  last_name           text not null,
  email               text null,
  phone               text null,
  state               text null,       -- QLD, NSW, VIC, etc.
  notes               text null,
  hubspot_contact_id  text null,       -- future HubSpot integration
  status              text default 'active'  -- 'active' | 'completed' | 'archived'
);

-- ============================================================
-- CUSTOMER VEHICLES (a customer can have multiple)
-- ============================================================
create table if not exists customer_vehicles (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  customer_id         uuid not null references customers(id) on delete cascade,
  listing_id          uuid null references listings(id) on delete set null,
  target_preferences  jsonb default '{}',
  vehicle_status      text default 'searching',
  -- Values: 'searching','targeted','bidding','purchased','in_storage','building',
  --         'shipping','compliance','pop_top_install','ready_for_delivery','delivered'
  vehicle_description text null,
  purchase_price_jpy  int  null,
  purchase_price_aud  int  null,       -- cents
  build_date          date null,
  for_sale            boolean default false,
  sale_price_aud      int  null,       -- cents
  sale_notes          text null,
  notes               text null,
  sort_order          int default 0
);

create index if not exists idx_customer_vehicles_customer on customer_vehicles(customer_id);

-- ============================================================
-- CUSTOMER BUILDS (one build per vehicle)
-- ============================================================
create table if not exists customer_builds (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  customer_id         uuid not null references customers(id) on delete cascade,
  customer_vehicle_id uuid null references customer_vehicles(id) on delete set null,
  build_type          text not null,
  -- Values: 'tama','mana_japan','mana_australia','bare_camper','pop_top_only','custom','none'
  build_location      text null,       -- 'japan' | 'australia'
  conversion_fee_aud  int  null,       -- cents
  pop_top             boolean default false,
  pop_top_fee_aud     int  null,       -- cents
  addon_slugs         text[] default '{}',
  addons_total_aud    int  default 0,  -- cents
  custom_description  text null,
  custom_quote_aud    int  null,       -- cents
  total_quoted_aud    int  null,       -- cents
  build_status        text default 'quoted',  -- 'quoted' | 'confirmed' | 'in_progress' | 'completed'
  notes               text null
);

create index if not exists idx_customer_builds_customer on customer_builds(customer_id);
create index if not exists idx_customer_builds_vehicle  on customer_builds(customer_vehicle_id);

-- ============================================================
-- ORDER STAGES (tracks the journey of each customer vehicle)
-- ============================================================
create table if not exists order_stages (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  customer_vehicle_id uuid not null references customer_vehicles(id) on delete cascade,
  stage               text not null,
  -- Values: 'vehicle_selection','bidding','purchase','storage','design_approval',
  --         'van_building','shipping','compliance','pop_top_install','ready_for_delivery','delivered'
  status              text default 'current',  -- 'completed' | 'current' | 'upcoming'
  notes               text null,
  entered_at          timestamptz null,
  completed_at        timestamptz null,
  planned_date        date null
);

create index if not exists idx_order_stages_vehicle on order_stages(customer_vehicle_id);

-- ============================================================
-- CUSTOMER DOCUMENTS (PDFs, quotes, invoices, photos)
-- ============================================================
create table if not exists customer_documents (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  customer_id         uuid not null references customers(id) on delete cascade,
  customer_vehicle_id uuid null references customer_vehicles(id) on delete set null,
  name                text not null,
  file_url            text not null,
  file_type           text null,       -- 'pdf' | 'image' | 'other'
  file_size_bytes     int  null,
  document_type       text default 'other',
  -- Values: 'quote','invoice','inspection_sheet','shipping_doc','compliance_cert','photo','contract','other'
  notes               text null,
  customer_visible    boolean default false  -- only visible on /my-van page when true
);

create index if not exists idx_customer_documents_customer on customer_documents(customer_id);
create index if not exists idx_customer_documents_vehicle  on customer_documents(customer_vehicle_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table user_profiles  enable row level security;
alter table saved_vans     enable row level security;
alter table builds         enable row level security;
alter table deposits       enable row level security;

-- Users can only see/edit their own data
create policy "users own profile"   on user_profiles  for all using (auth.uid() = id);
create policy "users own saved"     on saved_vans      for all using (auth.uid() = user_id);
create policy "users own builds"    on builds          for select using (auth.uid() = user_id or share_slug is not null);
create policy "users insert builds" on builds          for insert with check (auth.uid() = user_id);
create policy "users own deposits"  on deposits        for select using (auth.uid() = user_id);

-- Public read on listings, products, settings
create policy "public listings"  on listings  for select using (true);
create policy "public products"  on products  for select using (visible = true);
create policy "public settings"  on settings  for select using (true);

alter table listings  enable row level security;
alter table products  enable row level security;
alter table settings  enable row level security;
alter table leads     enable row level security;
create policy "anyone insert leads" on leads for insert with check (true);

-- ============================================================
-- SEED — Dream Drive products
-- ============================================================
insert into products (slug, name, category, rrp_aud, description, sort_order) values
  ('tama',              'TAMA Fit-Out',          'fitout',     0, '6-seater people mover conversion with semi double bed, galley kitchen, sink, 40L fridge', 1),
  ('mana',              'MANA Fit-Out',           'fitout',     0, '2-seater adventure campervan: modular bed, full kitchen, toilet, 55L water, 200AH lithium', 2),
  ('grid-bed-kit',      'Grid Bed Kit',           'fitout',     0, 'Modular bed system by Grid (Skybridge). Compatible with cabinet-level electrical only.', 3),
  ('poptop-only',       'Pop Top Conversion Only','fitout',     0, 'Fiberglass roof conversion with no interior fit-out package', 4),
  ('elec-cabinet',      'Electrical Cabinet',     'electrical', 0, 'Wall-mount or under-bed electrical cabinet, wired and ready', 1),
  ('elec-starter',      'Starter Electrical',     'electrical', 0, '100Ah lithium, 200W solar, MPPT, 12V + USB outlets', 2),
  ('elec-mid',          'Mid Electrical',         'electrical', 0, '200Ah lithium, 400W solar, MPPT, 2000W inverter, shore power, battery monitor', 3),
  ('elec-offgrid-pro',  'Off-Grid Pro',           'electrical', 0, '300Ah+ lithium, 600W+ solar, smart BMS, dual MPPT, large inverter, full monitoring', 4),
  ('poptop',            'Pop Top Roof Conversion','poptop',  1190000, 'Fiberglass pop top. $11,900 ex GST. 10 business days. $4,000 deposit to book.', 1)
on conflict (slug) do nothing;

-- ============================================================
-- SEED — The Green Machine (AU stock van example)
-- ============================================================
insert into listings (
  source, model_name, grade, model_year, transmission, displacement_cc,
  drive, au_status, eta_date, featured, au_price_aud, description, photos
) values (
  'au_stock',
  'TOYOTA HIACE VAN LONG SUPER GL',
  'LONG SUPER GL',
  2022,
  'IA',
  2800,
  '2WD',
  'import_approved',
  (current_date + interval '6 weeks')::date,
  true,
  0,
  'The Green Machine. Import approved and being sent to the dock. ETA approx 6 weeks.',
  '{}'
) on conflict do nothing;
