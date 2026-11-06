-- Cached Nominatim results for trip map pins (restaurant + city + country query string).
-- Run once in Supabase SQL editor after your other trip tables.

create table if not exists public.restaurant_map_coordinates (
  query_key text primary key,
  lat double precision not null,
  lon double precision not null,
  source text not null default 'nominatim',
  updated_at timestamptz not null default now()
);

create index if not exists restaurant_map_coordinates_updated_idx
  on public.restaurant_map_coordinates (updated_at desc);

alter table public.restaurant_map_coordinates enable row level security;

drop policy if exists "restaurant_map_coordinates_read" on public.restaurant_map_coordinates;
create policy "restaurant_map_coordinates_read"
  on public.restaurant_map_coordinates
  for select
  to anon, authenticated
  using (true);

-- Writes use the service role (bypasses RLS) from the geocode API and batch script.

grant select on public.restaurant_map_coordinates to anon, authenticated;
grant all on public.restaurant_map_coordinates to service_role;
