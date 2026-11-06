# Supabase Runbook (when you’re ready to implement)

This is the exact sequence to stand up the database for the MVP.

## 1) Create a Supabase project
- Create a new project in Supabase.
- Copy:
  - Project URL
  - Anon key
  - Service role key (keep private)

## 2) Apply schema
In Supabase SQL editor, run:
- `supabase/schema.sql`

## 3) Seed baseline data
Run:
- `supabase/seed.sql`

## 4) Verify RLS quickly
Checks:
- As an authenticated user, you can CRUD your own `profiles`, `trips`, etc.
- You can `select` from `cities` and `dishes`.
- You cannot insert/update/delete `cities` or `dishes` using the anon key.

## 5) Storage (optional for MVP)
If you plan to upload photos later (Phase 5), create buckets:
- `public-media` (public read) for dish/restaurant images
- `private-uploads` (private) for user uploads

## 6) Disclaimer versioning
Set an app constant like:
- `DISCLAIMER_VERSION = "v1-2026-04-09"`
When user accepts, insert into `disclaimer_acceptances`.

