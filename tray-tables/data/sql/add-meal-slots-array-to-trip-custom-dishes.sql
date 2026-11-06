-- Multiple meal/hour tags per custom dish (run once in Supabase SQL editor).
-- Safe if re-run: uses IF NOT EXISTS patterns where applicable.

alter table public.trip_custom_dishes
  add column if not exists meal_slots text[];

update public.trip_custom_dishes
set meal_slots = array[meal_slot]::text[]
where meal_slots is null;

alter table public.trip_custom_dishes
  alter column meal_slots set default array['lunch']::text[];

alter table public.trip_custom_dishes
  alter column meal_slots set not null;
