-- Run once on existing databases (new installs get these from schema.sql).
alter table public.restaurant_dishes
  add column if not exists discovery_channel text,
  add column if not exists google_rank smallint,
  add column if not exists curation_notes text;

alter table public.restaurant_dishes drop constraint if exists restaurant_dishes_google_rank_check;
alter table public.restaurant_dishes
  add constraint restaurant_dishes_google_rank_check
  check (google_rank is null or (google_rank >= 1 and google_rank <= 3));

comment on column public.restaurant_dishes.discovery_channel is
  'Where this link was curated from: google_search, eater, michelin, thefork, seed, manual, …';
comment on column public.restaurant_dishes.google_rank is
  '1–3 when this row came from a Google Programmable Search result position; null otherwise.';
