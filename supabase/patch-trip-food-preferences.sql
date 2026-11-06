-- Run once on existing databases (new installs get this from schema.sql).
alter table public.trips
  add column if not exists preferred_price_max smallint not null default 3,
  add column if not exists prefer_vegetarian boolean not null default false,
  add column if not exists prefer_local_favorite boolean not null default false,
  add column if not exists prefer_trendy boolean not null default false,
  add column if not exists prefer_street_food boolean not null default false,
  add column if not exists prefer_drink_pairing boolean not null default false;

alter table public.trips drop constraint if exists trips_preferred_price_max_check;
alter table public.trips
  add constraint trips_preferred_price_max_check
  check (preferred_price_max between 1 and 3);
