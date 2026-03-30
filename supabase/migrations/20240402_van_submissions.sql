-- Van Submissions: customer-uploaded vans with photos & details
-- Approved submissions become listings tagged as "Community Find"

create table if not exists van_submissions (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),

  -- Submitter
  name                text not null,
  email               text not null,
  phone               text,

  -- Van details (entered by customer)
  model_name          text not null,
  model_year          integer,
  body_type           text,                 -- SLWB | LWB | MWB
  mileage_km          integer,
  transmission        text,                 -- AT | MT
  asking_price_aud    integer,              -- cents
  location            text,                 -- city/state where van is now
  notes               text,

  -- Photos (uploaded URLs, min 6 required)
  photos              text[] not null default '{}',

  -- Workflow
  status              text not null default 'pending_review',
  -- pending_review | approved | rejected

  -- Set when approved and a listing is created
  listing_id          uuid references listings(id) on delete set null,

  -- Finders fee (paid if the listing sells)
  finders_fee_aud     integer not null default 20000,
  fee_paid_at         timestamptz,

  -- Internal
  admin_notes         text,
  auto_published      boolean default false   -- true if submitted by a trusted submitter
);

create index van_submissions_status_idx on van_submissions(status);
create index van_submissions_email_idx  on van_submissions(email);

-- Trusted submitters: their van submissions publish automatically
create table if not exists trusted_submitters (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  notes       text,
  created_at  timestamptz default now()
);

-- Add community_find flag to listings so the badge shows on listing cards
alter table listings
  add column if not exists is_community_find boolean default false,
  add column if not exists submission_id uuid references van_submissions(id) on delete set null;
