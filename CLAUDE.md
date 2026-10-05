# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Awami Road" — a community crowdfunding ledger / transparency tracker for a village road (Jeeva Morh to Butti). Public visitors see campaign stats, the donation ledger, and a village leaderboard; admins add/edit/delete offline donations. UI text is bilingual English/Urdu (`.font-urdu` class in `src/index.css`); amounts are PKR. The app was generated in Google AI Studio (see `metadata.json`, `.env.example`), which explains the `DISABLE_HMR` handling in `vite.config.ts` — leave that alone.

## Commands

Package manager is Bun (`bun.lock`); npm also works.

- `bun install`
- `bun run dev` — Vite dev server on port 3000, bound to 0.0.0.0
- `bun run build` / `bun run preview`
- `bun run lint` — type-check only (`tsc --noEmit`); there is no ESLint
- `bunx tsx scripts/seed-supabase.ts` — upsert `INITIAL_DONATIONS` into the Supabase `donations` table

There is no test suite.

## Architecture

Single-page React 19 + Vite + Tailwind v4 client app, no backend server (`express`, `@google/genai`, `dotenv` are in deps but unused). `@/` aliases the repo root.

**State lives entirely in `src/App.tsx`.** It owns `donations`, `settings`, `isAdmin`, and passes data + callbacks down as props; components don't fetch on their own. There is no router — the public view switches between `ledger` and `villages` tabs via local state.

**Data flow / persistence (layered):**
1. Seed: `src/data/initialData.ts` provides `INITIAL_DONATIONS` (~200 records), `INITIAL_SETTINGS`, `INITIAL_MILESTONES`.
2. localStorage cache: donations/settings/admin flag under keys suffixed `_v3`/`_v2`. On load, cached donations are only used if there are at least as many as the seed — bump the key version when changing the seed shape.
3. Supabase (`src/services/supabase.ts`) is the source of truth: on mount App fetches all rows (replacing local state if non-empty) and subscribes to realtime INSERT/UPDATE/DELETE. Saves are optimistic local updates followed by `upsert`. `toDbRow`/`fromDbRow` map camelCase `Donation` ↔ snake_case columns; the table schema and (fully public) RLS policies are in the `SUPABASE_SQL_SETUP` string in that file. Credentials come from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` with hardcoded fallbacks.

Settings (target goal, committee, announcements, admin credentials) are **only** in localStorage — they are not synced to Supabase.

**Admin access** is client-side only: visiting with `?admin`, `?mode=admin`, or `#admin` opens `AdminLoginModal`, which checks against `settings.adminUsername`/`adminPassword` (defaults in `INITIAL_SETTINGS`). Success sets a localStorage flag and renders `AdminPanel` (donation form + backup/import/export/reset tab).

**Unused code:** `GoogleSheetsSync`, `SupabaseSync`, `RoadGallery`, `AboutProjectModal`, and `CommitteeModal` components are not imported anywhere. The Firebase Google-auth (`services/googleAuth.ts`, config in `firebase-applet-config.json`) and Google Sheets (`services/googleSheets.ts`) services are only reachable through `GoogleSheetsSync`.

`PaymentSource` is a fixed union (`Cash | BankTransfer | Easypesa | Jazzcash` — note the "Easypesa" spelling); parsers fall back to `'Easypesa'` for unknown values. Per-source labels/colors live in `getSourceDetails` in `src/utils/formatters.ts`.
