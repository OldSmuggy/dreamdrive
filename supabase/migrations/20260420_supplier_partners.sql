-- =============================================================================
-- Supplier / Referral Partners — Australian dealers giving us a discount
-- =============================================================================

create table if not exists supplier_partners (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  abn             text,
  address         text,
  website         text,
  commission_aud  int default 0,                -- discount/commission per vehicle in AUD dollars
  commission_type text default 'discount',      -- 'discount' | 'commission' | 'rebate'
  terms_notes     text,
  status          text default 'active',        -- 'active' | 'paused' | 'ended'
  agreement_sent_at timestamptz,
  agreement_signed_at timestamptz,
  notes           text,
  created_at      timestamptz default now(),
  created_by      uuid references auth.users(id)
);
create index if not exists supplier_partners_status_idx on supplier_partners(status);

-- Link listings to a supplier partner
alter table listings add column if not exists supplier_partner_id uuid references supplier_partners(id);
create index if not exists listings_supplier_partner_idx on listings(supplier_partner_id);
