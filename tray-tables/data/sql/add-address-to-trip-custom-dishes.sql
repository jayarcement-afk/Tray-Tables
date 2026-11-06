-- Optional street address for user-added dishes (map geocoding). Run once in Supabase SQL editor.

alter table public.trip_custom_dishes
  add column if not exists address text;
