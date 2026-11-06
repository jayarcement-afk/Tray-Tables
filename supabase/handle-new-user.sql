-- Run once in Supabase SQL Editor (after schema.sql).
-- Creates a public.profiles row whenever a user signs up in auth.users.
-- Fixes: insert on trips violates foreign key trips_user_id_fkey

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

-- One-time backfill for accounts created before this trigger existed:
-- insert into public.profiles (user_id)
-- select id from auth.users
-- on conflict (user_id) do nothing;
