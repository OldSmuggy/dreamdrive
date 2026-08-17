-- =============================================================================
-- Make + AU location — support non-Toyota listings and vans outside Brisbane
-- =============================================================================

-- Allow non-Toyota vehicles to be listed with a real make/model,
-- and allow AU-based stock to show its actual city instead of always "In Brisbane".

alter table listings add column if not exists make text;
alter table listings add column if not exists au_location text;

-- Backfill: existing catalogue is Toyota Hiace/Coaster.
update listings set make = 'Toyota' where make is null;

alter table van_submissions add column if not exists make text;

create index if not exists listings_make_idx on listings(make);
