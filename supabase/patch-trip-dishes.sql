-- Persist "Add to Trip" dish selections per trip/user.

create table if not exists public.trip_dishes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (trip_id, dish_id)
);

create index if not exists trip_dishes_trip_idx on public.trip_dishes (trip_id);
create index if not exists trip_dishes_dish_idx on public.trip_dishes (dish_id);

alter table public.trip_dishes enable row level security;

drop policy if exists "trip_dishes_crud_via_trip" on public.trip_dishes;
create policy "trip_dishes_crud_via_trip" on public.trip_dishes
  for all
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_dishes.trip_id
        and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_dishes.trip_id
        and t.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on table public.trip_dishes to authenticated;
