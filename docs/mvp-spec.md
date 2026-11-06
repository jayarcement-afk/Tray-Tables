# Regional Food Discovery & Travel Dining App — MVP Spec (Phase 1 + “Seeded Phase 2”)

This document translates the PRD + Build Phases into a buildable MVP: a real user can sign up, create a trip, set preferences + dietary constraints, accept a safety disclaimer (logged), and browse must‑try dishes for their destination from seeded canonical data.

## Product scope

### In-scope (MVP)
- **Auth**: Email/password sign up, sign in, sign out, password reset.
- **Profile & preferences**:
  - Eater types (multi-select).
  - Dietary/health constraints (hard filters) with strict/flexible flags.
  - Price range per meal (simple: $, $$, $$$, $$$$) and spice preference (low/med/high).
  - First-time vs repeat visitor toggle (affects dish surfacing).
  - Persistent disclaimer whenever any dietary constraint is active.
- **Trip setup (max 14 days)**:
  - Destination city (from seeded list initially).
  - Start/end dates (max length 14 days).
  - Meal slots per day (breakfast/lunch/dinner/late night/street food).
  - Optional neighborhoods per day (free text initially; seed neighborhoods later).
- **Must‑Try Dishes (seeded)**:
  - Dishes per city with: description, ingredients, history, region connection, photo URL + attribution.
  - Dish tags for **must-eat** (first-timers) and **hidden gem** (repeat).
  - Human validation flag + reviewed_by (for production readiness).
- **Basic dashboard**:
  - List trips, open a trip, and entry point to must‑try dishes.

### Explicitly out-of-scope (MVP)
- AI restaurant recommendation engine (Phase 3).
- Restaurant cards at full fidelity (Phase 3).
- Itinerary lock/reject/rerun + routing + reservations + offline (Phase 4).
- Post-dining logging, public sharing, achievements, feed (Phase 5).
- Automated ingestion pipeline from trusted sources (Phase 2+). MVP uses seeded data.

## UX / screens

### 1) Entry / marketing (`/`)
- CTA: “Create account” / “Sign in”
- Lightweight value prop.

### 2) Auth (`/auth`)
- Email/password auth.
- Reset password flow.

### 3) Onboarding (`/onboarding`)
Collects and stores:
- Eater types (multi-select).
- Dietary constraints (multi-select; each has strict/flexible).
- Price range + spice preference.
- First-time vs repeat toggle.

Disclaimer behavior:
- If user selects any dietary constraint, show a **disclaimer modal**.
- User must accept to continue; acceptance is **logged per session**.
- After acceptance, show **persistent banner** when dietary constraints remain active.

### 4) Trips list (`/trips`)
- Create new trip.
- Open existing trip(s).

### 5) Trip setup wizard (`/trips/new`)
Steps:
- Destination city (seeded list; searchable).
- Dates (validate max 14 days).
- Meal slots: choose which meals exist for each day (default: breakfast/lunch/dinner).
- Optional neighborhoods per day (free-text chips).

Creates:
- Trip record
- Trip days
- Meal slots for each day
- Neighborhood selections (optional)

### 6) Trip dashboard (`/trips/[tripId]`)
Shows:
- Trip summary (city, dates)
- Shortcuts: “Must‑Try Dishes”, “Edit preferences”

### 7) Must‑Try Dishes (`/trips/[tripId]/dishes`)
Dish list for trip city.
- If profile indicates **first-time**: highlight must-eat list; also show hidden gems section if present.
- If **repeat**: highlight hidden gems list; also show canonical must-eats optionally (collapsed).
Dish card fields:
- Name
- Photo (URL) + attribution line
- “What it is”
- Ingredients (chips)
- Short history
- Regional connection
- Validation badge: “Verified” if human_validated true; else “Draft”

## Key logic & rules

### Trip length validation
- A trip duration is inclusive: end_date - start_date + 1.
- Must be \(1 \le days \le 14\).

### Dietary constraints = hard filters (future-proof)
MVP doesn’t filter restaurant recommendations (not built yet), but it must:
- Store constraints as structured rows.
- Drive disclaimer behavior (banner + acceptance logging).

### Disclaimer acceptance logging
- Log acceptance for each session (or each “onboarding submit” if session ID not available yet).
- Store disclaimer version string (e.g. `v1-2026-04-09`) to support future updates.

## Data model (high-level)
See `supabase/schema.sql` for exact tables + constraints + RLS.

Entities:
- `profiles` (1:1 with auth.users)
- `eater_profiles` (1:1 with profiles; could be merged into profiles later)
- `dietary_constraints` (N:1 to profiles)
- `cities` (seeded)
- `trips` (N:1 to profiles)
- `trip_days` (N:1 to trips)
- `meal_slots` (N:1 to trip_days)
- `trip_day_neighborhoods` (optional, N:1 to trip_days)
- `dishes` (N:1 to cities; seeded)
- `disclaimer_acceptances` (N:1 to profiles)

## Seed plan (5 pilot cities)
Seed data is designed to be “good enough” for UX and schema validation.

### Suggested pilot cities
- Tokyo
- Paris
- Mexico City
- Bangkok
- New York City

### Minimum dish seed per city
For each city, seed at least:
- 10 “must-eat” dishes
- 10 “hidden gem” dishes
Each dish must include:
- Ingredients array (even if approximate)
- Short history (2–5 sentences)
- Region connection (1–3 sentences)
- Photo URL + source attribution string
- `human_validated=false` initially (unless you’ve reviewed it)

See `seed/seed-plan.md` for the exact seed checklist and file format.

## Analytics event plan (MVP)
Store events later in an analytics platform; MVP can log to DB if desired.

Events:
- `auth_signed_up`, `auth_signed_in`
- `onboarding_completed`
- `disclaimer_accepted` (include version)
- `trip_created` (days, meals_per_day stats)
- `dishes_viewed` (trip_id, city_id)
- `dish_opened` (dish_id)

## Acceptance criteria (MVP “done”)
- User can sign up/in/out.
- User can complete onboarding with eater types, constraints, and preferences.
- If dietary constraints are set, disclaimer must be accepted and is logged; banner persists.
- User can create a trip (<=14 days) with meal slots.
- Must‑Try Dishes page shows correct city’s dishes and respects first-time vs repeat split.
- All user data is protected by RLS (users can only read/write their own profile/trips).

