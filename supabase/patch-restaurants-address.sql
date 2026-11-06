-- Adds structured address field for restaurant exports/imports.
alter table public.restaurants
  add column if not exists address text;

comment on column public.restaurants.address is
  'Street-level address from curated CSV import or manual verification.';
