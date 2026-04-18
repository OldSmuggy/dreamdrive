-- Buyer interest in community listings
create table if not exists listing_interests (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text,
  message     text,
  created_at  timestamptz default now()
);
create index if not exists listing_interests_listing_idx on listing_interests(listing_id);

-- Contact preference for sellers
alter table van_submissions add column if not exists contact_preference text default 'email';
alter table listings add column if not exists contact_preference text;
