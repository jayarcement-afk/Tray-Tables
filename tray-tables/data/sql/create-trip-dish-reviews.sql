-- Persist post-trip dish/restaurant reviews.
-- Run in Supabase SQL editor.

create table if not exists public.trip_dish_reviews (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  dish_id text not null,
  rating smallint not null default 0,
  experience_review text not null default '',
  tags text[] not null default '{}',
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, dish_id),
  constraint trip_dish_reviews_rating_range check (rating >= 0 and rating <= 5)
);

create index if not exists trip_dish_reviews_trip_idx on public.trip_dish_reviews (trip_id);

drop trigger if exists trip_dish_reviews_set_updated_at on public.trip_dish_reviews;
create trigger trip_dish_reviews_set_updated_at
  before update on public.trip_dish_reviews
  for each row execute function public.set_updated_at();

alter table public.trip_dish_reviews enable row level security;

drop policy if exists "trip_dish_reviews_owner_read" on public.trip_dish_reviews;
create policy "trip_dish_reviews_owner_read" on public.trip_dish_reviews
for select using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_dish_reviews.trip_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "trip_dish_reviews_owner_write" on public.trip_dish_reviews;
create policy "trip_dish_reviews_owner_write" on public.trip_dish_reviews
for all using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_dish_reviews.trip_id
      and t.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_dish_reviews.trip_id
      and t.user_id = auth.uid()
  )
);

grant select, insert, update, delete on public.trip_dish_reviews to authenticated;
