-- =============================================================================
-- Dealer Portal + Ring-fenced Funds Ledger
-- =============================================================================

-- Extend profiles for dealer roles ----------------------------------------------
alter table profiles add column if not exists role text default 'customer';
alter table profiles add column if not exists dealer_company_name text;
alter table profiles add column if not exists dealer_abn text;
alter table profiles add column if not exists dealer_territory text;
alter table profiles add column if not exists dealer_signed_at timestamptz;
alter table profiles add column if not exists dealer_invited_at timestamptz;
alter table profiles add column if not exists dealer_invited_by uuid references auth.users(id);
alter table profiles add column if not exists dealer_active boolean default true;

-- Ring-fenced funds ledger ------------------------------------------------------
-- Every payment (in / released / refunded) for a customer or dealer is a row.
create table if not exists funds_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  amount_cents    bigint not null,
  entry_type      text not null,
    -- 'sourcing_fee' | 'auction_deposit' | 'deposit' | 'progress' | 'final'
    -- | 'release' | 'refund' | 'other'
  status          text not null default 'held',
    -- 'held' | 'released' | 'refunded'
  reference_type  text,                        -- 'listing' | 'dealer_order' | 'sourcing'
  reference_id    uuid,
  description     text not null,
  payment_method  text,                        -- 'bank_transfer' | 'stripe' | 'manual'
  payment_ref     text,                        -- bank ref / stripe charge id
  notes           text,
  created_at      timestamptz default now(),
  created_by      uuid references auth.users(id),
  released_at     timestamptz,
  refunded_at     timestamptz
);
create index if not exists funds_ledger_user_idx on funds_ledger(user_id, created_at desc);
create index if not exists funds_ledger_ref_idx  on funds_ledger(reference_type, reference_id);
create index if not exists funds_ledger_status_idx on funds_ledger(status);

-- Dealer orders -----------------------------------------------------------------
-- Each order = one vehicle a dealer has commissioned.
create table if not exists dealer_orders (
  id                    uuid primary key default gen_random_uuid(),
  dealer_user_id        uuid not null references auth.users(id),
  order_number          text not null unique,
  tier                  text not null,         -- 'shell' | 'nest' | 'mana'
  vehicle_grade         text not null,         -- 'entry' | 'mid' | 'premium'
  wholesale_price_cents bigint not null,
  retail_price_cents    bigint,
  dealer_margin_cents   bigint,
  status                text not null default 'pending_deposit',
    -- 'pending_deposit' | 'sourcing' | 'sourced' | 'shipping' | 'building'
    -- | 'ready' | 'delivered' | 'cancelled'
  notes                 text,
  admin_notes           text,
  source_listing_id     uuid references listings(id),
  estimated_delivery    date,
  created_at            timestamptz default now(),
  signed_at             timestamptz,
  delivered_at          timestamptz
);
create index if not exists dealer_orders_dealer_idx on dealer_orders(dealer_user_id, created_at desc);
create index if not exists dealer_orders_status_idx on dealer_orders(status);

-- Sequence for friendly order numbers (BC-2026-0001)
create sequence if not exists dealer_orders_seq start 1;

-- Stage timeline per dealer order -----------------------------------------------
create table if not exists dealer_order_stages (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references dealer_orders(id) on delete cascade,
  stage_key       text not null,
    -- 'sign_deposit' | 'vehicle_sourced' | 'ship_build' | 'delivery_launch' | 'sell_reorder'
  stage_index     int not null,
  status          text not null default 'upcoming',
    -- 'upcoming' | 'current' | 'completed'
  entered_at      timestamptz,
  completed_at    timestamptz,
  planned_date    date,
  notes           text,
  photos          text[]
);
create index if not exists dealer_order_stages_order_idx on dealer_order_stages(order_id, stage_index);

-- "Notify me" interest log for coming-soon dealer features ----------------------
create table if not exists dealer_resource_interest (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  resource    text not null,         -- 'marketing' | 'training'
  created_at  timestamptz default now()
);
