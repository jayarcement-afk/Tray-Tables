-- Run in Supabase SQL after cities exist. Adds per-trip food preference fields.
-- Generated for Tray Tables new trip flow (vegetarian + price point).

alter table public.trips
  add column if not exists wants_vegetarian_options boolean not null default false,
  add column if not exists price_point smallint not null default 2;

alter table public.trips
  drop constraint if exists trips_price_point_range;
alter table public.trips
  add constraint trips_price_point_range
  check (price_point between 1 and 3);
