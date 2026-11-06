-- Add per-trip flag to finalize selected dishes only.

alter table public.trips
  add column if not exists dishes_finalized boolean not null default false;
