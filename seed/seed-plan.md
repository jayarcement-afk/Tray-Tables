# Seed Plan (MVP)

Goal: seed enough canonical data to validate UX and schemas for **5 pilot cities** with **must‑try dishes** (Phase 2 UX) while Phase 3+ is not implemented.

## Cities
Recommended initial list:
- Tokyo (`tokyo`)
- Paris (`paris`)
- Mexico City (`mexico-city`)
- Bangkok (`bangkok`)
- New York City (`new-york-city`)

## Dishes per city (minimum)
For each city seed at least:
- **10** dishes tagged as must‑eat (`is_must_eat=true, is_hidden_gem=false`)
- **10** dishes tagged as hidden gem (`is_must_eat=false, is_hidden_gem=true`)

## Dish record requirements
Each dish must include:
- `name`
- `what_it_is` (1–3 sentences)
- `ingredients` (array; can be approximate for seed)
- `short_history` (2–5 sentences)
- `regional_connection` (1–3 sentences)
- `photo_url` (can be placeholder initially)
- `photo_source` (attribution string, e.g. “Wikipedia / CC BY-SA 4.0” or “Source: <site>”)
- `human_validated` default `false`
- `reviewed_by` null until reviewed

## Photo placeholders (MVP-safe)
Until you have rights-safe images:
- Use a single neutral placeholder image hosted in your own storage/CDN, and set:
  - `photo_url` = that placeholder
  - `photo_source` = “Placeholder (replace before launch)”

## How to load seed data later
You have two options:
- **SQL seed file** (`supabase/seed.sql`) that inserts cities + dishes directly
- **CSV import** in Supabase Table Editor for `cities` and `dishes`

This repo includes `supabase/seed.sql` with a minimal starter dataset you can extend.

