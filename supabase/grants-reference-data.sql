-- Run this in Supabase SQL Editor if cities/dishes return empty from the API
-- (RLS allows reads, but PostgREST still needs table privileges for anon/authenticated.)

grant usage on schema public to anon, authenticated;
grant select on table public.cities to anon, authenticated;
grant select on table public.dishes to anon, authenticated;
