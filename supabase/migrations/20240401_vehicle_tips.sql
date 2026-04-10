-- Vehicle Tips / Finders Fee
-- Customers submit a van they've spotted; $200 finders fee if it gets purchased.

create table if not exists vehicle_tips (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),

  -- Submitter
  name            text not null,
  email           text not null,
  phone           text,

  -- The vehicle they spotted
  vehicle_url     text,                -- link to auction listing, Goo-net, etc.
  notes           text,                -- anything extra they want to mention

  -- Workflow
  status          text not null default 'pending',
  -- pending | reviewing | matched | paid | declined

  -- Set by admin when a match is confirmed
  matched_listing_id  uuid references listings(id) on delete set null,

  -- $200 default, editable per tip
  finders_fee_aud integer not null default 20000,

  paid_at         timestamptz,
  admin_notes     text
);

-- Index for admin queries
create index vehicle_tips_status_idx on vehicle_tips(status);
create index vehicle_tips_email_idx  on vehicle_tips(email);
