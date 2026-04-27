-- One-time cleanup: duplicate Barcelona city rows.
-- Canonical dishes live on slug `barcelona`; legacy seed used `barcelona-spain`.
-- Re-point any trips still on the empty duplicate, then remove the duplicate row.

begin;

update public.trips t
set city_id = c_good.id
from public.cities c_bad
join public.cities c_good
  on c_good.slug = 'barcelona'
 and c_good.name = 'Barcelona'
 and c_good.country = 'Spain'
where t.city_id = c_bad.id
  and c_bad.slug = 'barcelona-spain'
  and c_bad.name = 'Barcelona'
  and c_bad.country = 'Spain';

delete from public.cities c
where c.slug = 'barcelona-spain'
  and c.name = 'Barcelona'
  and c.country = 'Spain';

commit;
