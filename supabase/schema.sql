-- Supabase schema for Regional Food Discovery & Travel Dining App (MVP)
-- Target: Phase 1 + seeded Phase 2 dish browsing
-- Notes:
-- - Uses auth.users as the source of user IDs.
-- - All user-owned tables enforce RLS so users can only access their own rows.
-- - This schema is “future-proofed” for later phases (restaurants, itinerary, UGC).

-- Extensions
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $migration$ begin
  create type public.spice_preference as enum ('low','medium','high');
exception when duplicate_object then null;
end $migration$;

do $migration$ begin
  create type public.price_tier as enum ('$','$$','$$$','$$$$');
exception when duplicate_object then null;
end $migration$;

do $migration$ begin
  create type public.meal_type as enum ('breakfast','lunch','dinner','late_night','street_food','snack');
exception when duplicate_object then null;
end $migration$;

do $migration$ begin
  create type public.meal_slot_status as enum ('open','locked','skipped','cancelled');
exception when duplicate_object then null;
end $migration$;

do $migration$ begin
  create type public.dietary_constraint_type as enum (
    'vegetarian',
    'vegan',
    'gluten_free',
    'dairy_free',
    'nut_allergy',
    'shellfish_allergy',
    'halal',
    'kosher',
    'alcohol_free'
  );
exception when duplicate_object then null;
end $migration$;

do $migration$ begin
  create type public.constraint_strictness as enum ('strict','flexible');
exception when duplicate_object then null;
end $migration$;

do $migration$ begin
  create type public.eater_type as enum (
    'veggie_lover',
    'adventurous_eater',
    'comfort_seeker',
    'local_purist',
    'trendy_explorer',
    'street_food_lover',
    'fine_dining_enthusiast',
    'foodie_completist'
  );
exception when duplicate_object then null;
end $migration$;

-- -----------------------------------------------------------------------------
-- Core reference tables
-- -----------------------------------------------------------------------------

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  region text,
  slug text unique,
  created_at timestamptz not null default now()
);

create index if not exists cities_slug_idx on public.cities (slug);

-- -----------------------------------------------------------------------------
-- User profile & preferences
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  first_time_visitor boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eater_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  eater_types public.eater_type[] not null default '{}',
  spice public.spice_preference not null default 'medium',
  price public.price_tier not null default '$$',
  opt_in_drink_pairings boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dietary_constraints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  constraint_type public.dietary_constraint_type not null,
  strictness public.constraint_strictness not null default 'strict',
  created_at timestamptz not null default now(),
  unique (user_id, constraint_type)
);

create index if not exists dietary_constraints_user_idx on public.dietary_constraints (user_id);

create table if not exists public.disclaimer_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  session_id text, -- from client if available; can be null
  disclaimer_version text not null,
  accepted_at timestamptz not null default now()
);

create index if not exists disclaimer_acceptances_user_idx on public.disclaimer_acceptances (user_id);

-- Keep updated_at current (simple trigger)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $migration$ begin
  create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $migration$;

do $migration$ begin
  create trigger eater_profiles_set_updated_at
    before update on public.eater_profiles
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $migration$;

-- -----------------------------------------------------------------------------
-- Trips
-- -----------------------------------------------------------------------------

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  city_id uuid not null references public.cities(id),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_dates_valid check (end_date >= start_date),
  constraint trip_max_14_days check ((end_date - start_date) <= 13) -- inclusive max 14 days
);

create index if not exists trips_user_idx on public.trips (user_id);
create index if not exists trips_city_idx on public.trips (city_id);

do $migration$ begin
  create trigger trips_set_updated_at
    before update on public.trips
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $migration$;

create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  trip_date date not null,
  created_at timestamptz not null default now(),
  unique (trip_id, trip_date)
);

create index if not exists trip_days_trip_idx on public.trip_days (trip_id);

create table if not exists public.trip_day_neighborhoods (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists trip_day_neighborhoods_day_idx on public.trip_day_neighborhoods (trip_day_id);

-- Meal slots (Phase 4 will add lock/reject/rerun; MVP just stores slot selection)
create table if not exists public.meal_slots (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days(id) on delete cascade,
  meal_type public.meal_type not null,
  status public.meal_slot_status not null default 'open',
  notes text,
  created_at timestamptz not null default now(),
  unique (trip_day_id, meal_type)
);

create index if not exists meal_slots_day_idx on public.meal_slots (trip_day_id);

-- -----------------------------------------------------------------------------
-- Dishes (seeded Phase 2)
-- -----------------------------------------------------------------------------

create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  what_it_is text not null,
  ingredients text[] not null default '{}',
  short_history text,
  regional_connection text,
  -- surfacing flags
  is_must_eat boolean not null default true,
  is_hidden_gem boolean not null default false,
  -- photo + attribution
  photo_url text,
  photo_source text,
  -- quality & provenance
  human_validated boolean not null default false,
  reviewed_by text,
  created_at timestamptz not null default now()
);

create index if not exists dishes_city_idx on public.dishes (city_id);
create index if not exists dishes_city_must_idx on public.dishes (city_id, is_must_eat);
create index if not exists dishes_city_hidden_idx on public.dishes (city_id, is_hidden_gem);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.eater_profiles enable row level security;
alter table public.dietary_constraints enable row level security;
alter table public.disclaimer_acceptances enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.meal_slots enable row level security;
alter table public.trip_day_neighborhoods enable row level security;

-- Reference data tables: readable by all authenticated users (and optionally anon)
alter table public.cities enable row level security;
alter table public.dishes enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Eater profiles
drop policy if exists "eater_profiles_crud_own" on public.eater_profiles;
create policy "eater_profiles_crud_own" on public.eater_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Dietary constraints
drop policy if exists "dietary_constraints_crud_own" on public.dietary_constraints;
create policy "dietary_constraints_crud_own" on public.dietary_constraints
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Disclaimer acceptances
drop policy if exists "disclaimer_acceptances_insert_own" on public.disclaimer_acceptances;
create policy "disclaimer_acceptances_insert_own" on public.disclaimer_acceptances
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "disclaimer_acceptances_select_own" on public.disclaimer_acceptances;
create policy "disclaimer_acceptances_select_own" on public.disclaimer_acceptances
  for select
  using (auth.uid() = user_id);

-- Trips
drop policy if exists "trips_crud_own" on public.trips;
create policy "trips_crud_own" on public.trips
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trip days (enforce via parent trip ownership)
drop policy if exists "trip_days_crud_via_trip" on public.trip_days;
create policy "trip_days_crud_via_trip" on public.trip_days
  for all
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_days.trip_id
        and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_days.trip_id
        and t.user_id = auth.uid()
    )
  );

-- Meal slots (enforce via parent trip_day -> trip ownership)
drop policy if exists "meal_slots_crud_via_trip" on public.meal_slots;
create policy "meal_slots_crud_via_trip" on public.meal_slots
  for all
  using (
    exists (
      select 1
      from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = meal_slots.trip_day_id
        and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = meal_slots.trip_day_id
        and t.user_id = auth.uid()
    )
  );

-- Trip day neighborhoods (enforce via parent)
drop policy if exists "trip_day_neighborhoods_crud_via_trip" on public.trip_day_neighborhoods;
create policy "trip_day_neighborhoods_crud_via_trip" on public.trip_day_neighborhoods
  for all
  using (
    exists (
      select 1
      from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = trip_day_neighborhoods.trip_day_id
        and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = trip_day_neighborhoods.trip_day_id
        and t.user_id = auth.uid()
    )
  );

-- Cities: allow read to all authenticated users (optionally anon too)
drop policy if exists "cities_read_all" on public.cities;
create policy "cities_read_all" on public.cities
  for select
  using (true);

-- Dishes: allow read to all authenticated users (or to everyone if you prefer)
drop policy if exists "dishes_read_all" on public.dishes;
create policy "dishes_read_all" on public.dishes
  for select
  using (true);

-- Restrict writes on reference tables to service role (no insert/update/delete policy)

-- -----------------------------------------------------------------------------
-- Convenience view (optional): dish feed split labels
-- -----------------------------------------------------------------------------
create or replace view public.city_dish_feed as
select
  d.*,
  case
    when d.is_must_eat and not d.is_hidden_gem then 'must_eat'
    when d.is_hidden_gem and not d.is_must_eat then 'hidden_gem'
    when d.is_hidden_gem and d.is_must_eat then 'both'
    else 'other'
  end as surfacing_bucket
from public.dishes d;

-- -----------------------------------------------------------------------------
-- Auth: ensure every auth.users row has a public.profiles row (trips FK, etc.)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- PostgREST (Supabase API) needs explicit privileges on tables, not only RLS policies.
grant usage on schema public to anon, authenticated;
grant select on table public.cities to anon, authenticated;
grant select on table public.dishes to anon, authenticated;

