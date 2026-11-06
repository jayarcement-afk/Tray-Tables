-- Manual fallback patch for remaining dishes after batch + website passes.
-- Sources: Unsplash photo pages (free under Unsplash License).
begin;

update public.dishes d
set
  photo_url = 'https://images.unsplash.com/photo-1675060852223-0d0b52a48fbb?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  photo_source = 'Unsplash (rkXVXCBVG2Q)'
from public.cities c
where d.city_id = c.id and c.slug = 'seattle' and d.name = 'Dungeness crab';

update public.dishes d
set
  photo_url = 'https://images.unsplash.com/photo-1627662235824-d9f447830c76?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  photo_source = 'Unsplash (DAjsChRbneo)'
from public.cities c
where d.city_id = c.id and c.slug = 'seattle' and d.name = 'Seattle-style teriyaki';

update public.dishes d
set
  photo_url = 'https://images.unsplash.com/photo-1741177330414-af2c3e7661fa?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  photo_source = 'Unsplash (A7zZtD7OIOU)'
from public.cities c
where d.city_id = c.id and c.slug = 'seattle' and d.name = 'Pho (International District)';

update public.dishes d
set
  photo_url = 'https://images.unsplash.com/photo-1679694140422-aecfd3d5dd0b?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  photo_source = 'Unsplash (TUQm-z4PwVs)'
from public.cities c
where d.city_id = c.id and c.slug = 'seattle' and d.name = 'Pacific oysters';

update public.dishes d
set
  photo_url = 'https://images.unsplash.com/photo-1571167366136-b57e07761625?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  photo_source = 'Unsplash (rmdo8r9iGfw)'
from public.cities c
where d.city_id = c.id and c.slug = 'seattle' and d.name = 'Clam chowder in a bread bowl';

update public.dishes d
set
  photo_url = 'https://images.unsplash.com/photo-1646275869281-e99e041965b2?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  photo_source = 'Unsplash (dYSyYlGbfY0)'
from public.cities c
where d.city_id = c.id and c.slug = 'seattle' and d.name = 'Fish and chips';

update public.dishes d
set
  photo_url = 'https://images.unsplash.com/photo-1612392062335-300bb9bd3054?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  photo_source = 'Unsplash (VNcWRWZn4Dw)'
from public.cities c
where d.city_id = c.id and c.slug = 'seattle' and d.name = 'Seattle hot dog';

update public.dishes d
set
  photo_url = 'https://images.unsplash.com/photo-1758024708232-1eaf50fc04cd?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  photo_source = 'Unsplash (zKw25NinI3w)'
from public.cities c
where d.city_id = c.id and c.slug = 'seattle' and d.name = 'Third-wave espresso';

commit;
