-- User-added dishes/restaurants per trip (server-backed).
-- Run in Supabase SQL editor after create-trip-dish-reviews.sql (needs public.set_updated_at).
-- Creates private storage bucket trip-custom-dishes for dish photos.

create table if not exists public.trip_custom_dishes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  dish_name text not null,
  restaurant text not null,
  link_url text,
  address text,
  why text not null default '',
  drink_pairing text not null default '',
  meal_slot text not null check (
    meal_slot in ('breakfast', 'lunch', 'dinner', 'late_night')
  ),
  meal_slots text[] not null default array['lunch']::text[],
  tag_local_favorite boolean not null default false,
  tag_trendy boolean not null default false,
  tag_street_food boolean not null default false,
  tag_vegetarian_options boolean not null default false,
  image_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_custom_dishes_why_length check (char_length(why) <= 250),
  constraint trip_custom_dishes_drink_length check (char_length(drink_pairing) <= 50),
  constraint trip_custom_dishes_address_length check (address is null or char_length(address) <= 500)
);

create index if not exists trip_custom_dishes_trip_idx
  on public.trip_custom_dishes (trip_id);

drop trigger if exists trip_custom_dishes_set_updated_at on public.trip_custom_dishes;
create trigger trip_custom_dishes_set_updated_at
  before update on public.trip_custom_dishes
  for each row execute function public.set_updated_at();

alter table public.trip_custom_dishes enable row level security;

drop policy if exists "trip_custom_dishes_owner_read" on public.trip_custom_dishes;
create policy "trip_custom_dishes_owner_read" on public.trip_custom_dishes
for select using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_custom_dishes.trip_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "trip_custom_dishes_owner_write" on public.trip_custom_dishes;
create policy "trip_custom_dishes_owner_write" on public.trip_custom_dishes
for all using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_custom_dishes.trip_id
      and t.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_custom_dishes.trip_id
      and t.user_id = auth.uid()
  )
);

grant select, insert, update, delete on public.trip_custom_dishes to authenticated;

------------------
-- Storage bucket (private — signed URLs served via API).
------------------
insert into storage.buckets (id, name, public)
values ('trip-custom-dishes', 'trip-custom-dishes', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "trip_custom_dishes_storage_select" on storage.objects;
create policy "trip_custom_dishes_storage_select" on storage.objects
for select to authenticated using (
  bucket_id = 'trip-custom-dishes'
  and exists (
    select 1
    from public.trips t
    where t.id::text = (storage.foldername(name))[1]
      and t.user_id = auth.uid()
  )
);

drop policy if exists "trip_custom_dishes_storage_insert" on storage.objects;
create policy "trip_custom_dishes_storage_insert" on storage.objects
for insert to authenticated with check (
  bucket_id = 'trip-custom-dishes'
  and exists (
    select 1
    from public.trips t
    where t.id::text = (storage.foldername(name))[1]
      and t.user_id = auth.uid()
  )
);

drop policy if exists "trip_custom_dishes_storage_update" on storage.objects;
create policy "trip_custom_dishes_storage_update" on storage.objects
for update to authenticated using (
  bucket_id = 'trip-custom-dishes'
  and exists (
    select 1
    from public.trips t
    where t.id::text = (storage.foldername(name))[1]
      and t.user_id = auth.uid()
  )
) with check (
  bucket_id = 'trip-custom-dishes'
  and exists (
    select 1
    from public.trips t
    where t.id::text = (storage.foldername(name))[1]
      and t.user_id = auth.uid()
  )
);

drop policy if exists "trip_custom_dishes_storage_delete" on storage.objects;
create policy "trip_custom_dishes_storage_delete" on storage.objects
for delete to authenticated using (
  bucket_id = 'trip-custom-dishes'
  and exists (
    select 1
    from public.trips t
    where t.id::text = (storage.foldername(name))[1]
      and t.user_id = auth.uid()
  )
);
