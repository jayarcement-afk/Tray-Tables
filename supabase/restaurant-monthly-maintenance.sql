-- Monthly restaurant maintenance operations
-- Run this after your monthly search pass to keep openings/closures/menu mappings fresh.

-- 1) Queue: restaurants due for monthly verification
select *
from public.restaurants_due_for_review
order by verification_age desc, city_name, name;

-- 2) Mark a restaurant as verified/open after confirming details
-- update public.restaurants
-- set
--   operating_status = 'open',
--   google_rating = 4.6,
--   google_review_count = 1240,
--   local_guide_rating = 4.5,
--   listed_on_eater = true,
--   listed_on_michelin = false,
--   listed_on_infatuation = true,
--   listed_on_thefork = true,
--   last_verified_at = now(),
--   last_verified_source = 'monthly_audit_2026_05',
--   verification_notes = 'Confirmed open hours + menu links updated.'
-- where slug = 'tokyo-izakaya-kanda';

-- 3) Mark temporarily closed
-- update public.restaurants
-- set
--   operating_status = 'temporarily_closed',
--   last_verified_at = now(),
--   last_verified_source = 'monthly_audit_2026_05',
--   verification_notes = 'Renovation notice on official page.'
-- where slug = 'paris-brasserie-montmartre';

-- 4) Mark permanently closed
-- update public.restaurants
-- set
--   operating_status = 'permanently_closed',
--   permanently_closed_at = now(),
--   last_verified_at = now(),
--   last_verified_source = 'monthly_audit_2026_05',
--   verification_notes = 'Marked permanently closed on maps + official channels.'
-- where slug = 'chicago-loop-classics';

-- 5) Add/remove canonical dish menu mappings after review
-- insert into public.restaurant_dishes (
--   restaurant_id,
--   dish_id,
--   is_on_menu,
--   dish_photo_url,
--   dish_photo_source,
--   source,
--   confidence
-- )
-- select r.id, d.id, true, 'monthly_audit_2026_05', 0.95
-- from public.restaurants r
-- join public.dishes d on d.city_id = r.city_id
-- where r.slug = 'austin-east-bbq'
--   and d.name = 'Texas brisket'
-- on conflict (restaurant_id, dish_id) do update
-- set
--   is_on_menu = true,
--   dish_photo_url = excluded.dish_photo_url,
--   dish_photo_source = excluded.dish_photo_source,
--   source = excluded.source,
--   confidence = excluded.confidence;

-- update public.restaurant_dishes
-- set is_on_menu = false, source = 'monthly_audit_2026_05', confidence = 0.90
-- where restaurant_id = (select id from public.restaurants where slug = 'austin-east-bbq')
--   and dish_id = (select id from public.dishes where name = 'Pulled pork');

-- 8) Curation metadata (optional): run supabase/patch-restaurant-dishes-curation.sql once if missing.
--    Bulk candidate discovery: from tray-tables/, `npm run curate:dishes` (see scripts/curate-dish-restaurants.mjs).
-- update public.restaurant_dishes
-- set discovery_channel = 'manual', google_rank = null, curation_notes = 'Verified in person'
-- where restaurant_id = (select id from public.restaurants where slug = 'paris-bistro-left-bank')
--   and dish_id = (select id from public.dishes where name = 'Steak frites');
