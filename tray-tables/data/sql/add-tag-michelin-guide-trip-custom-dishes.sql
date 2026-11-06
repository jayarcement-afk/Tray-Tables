-- Flag user-added dishes whose listing/source is the Michelin Guide (counts toward passport Michelin achievements).
-- Run in Supabase SQL editor after create-trip-custom-dishes.sql.

alter table public.trip_custom_dishes
  add column if not exists tag_michelin_guide boolean not null default false;

comment on column public.trip_custom_dishes.tag_michelin_guide is
  'True when the dish/restaurant is sourced from or listed on guide.michelin.com (or explicitly tagged).';
