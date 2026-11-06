-- Run in Supabase → SQL Editor. Confirms `address` exists on `trip_custom_dishes` and shows a few values.

-- 1) Column present?
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'trip_custom_dishes'
  and column_name = 'address';

-- 2) Sample rows (null address is fine — column exists if this returns without error)
select id, trip_id, restaurant, address, created_at
from public.trip_custom_dishes
order by created_at desc
limit 5;
