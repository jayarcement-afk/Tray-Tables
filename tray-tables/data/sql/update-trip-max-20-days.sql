-- Update trip duration constraint from 14 days to 20 days (inclusive).
-- Run in Supabase SQL editor.

alter table public.trips
  drop constraint if exists trip_max_14_days;

alter table public.trips
  drop constraint if exists trip_max_20_days;

alter table public.trips
  add constraint trip_max_20_days check ((end_date - start_date) <= 19);
