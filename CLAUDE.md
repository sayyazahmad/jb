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

There is no test suite.

## Architecture

React 19 + Vite + Tailwind v4 client-only app (public site + admin app), no backend server (`express`, `@google/genai`, `dotenv` are in deps but unused). `@/` aliases the repo root.

**Two apps, one Vite multi-page build.** `index.html` → `src/main.tsx` → `src/App.tsx` is the public site (stats, ledger and villages tabs via local state). `admin/index.html` → `src/admin/main.tsx` → `src/admin/AdminApp.tsx` is the admin app at `/admin`. Both get data from the shared hooks in `src/hooks/useDonations.ts` (`useDonations`, `useSettings`) and pass it down as props; components don't fetch on their own. The admin app uses a tiny history router (`src/admin/router.ts`): `/admin` (`DonationGrid`: search/filter/sort/edit, Excel/PDF export via `src/admin/exports.ts`, Add New), `/admin/new`, `/admin/edit/:id`, `/admin/backup`. Deep links are rewritten to `admin/index.html` by `vercel.json` in production and the `adminFallback` plugin in `vite.config.ts` in dev.

**PWA:** both pages are installable as separate apps via static manifests (`public/manifest.webmanifest` scope `/`, `public/admin/manifest.webmanifest` scope `/admin/`) linked from each HTML file; icons in `public/icons/` are rendered from `public/icons/icon.svg`. `vite-plugin-pwa` (`manifest: false`) only generates the Workbox service worker: it precaches just the assets the two HTML pages reference (see `manifestTransforms` in `vite.config.ts`), caches lazy chunks such as the export libraries on first use, and takes over immediately on a new deploy (`skipWaiting` + `clientsClaim`; without them updates wait until every tab/installed window closes). Registration lives in `src/registerServiceWorker.ts` (called from both `main.tsx` files, `injectRegister: false`): it checks for updates on foreground/hourly and reloads once on `controllerchange`, except the admin defers the reload while on `/admin/new` or `/admin/edit/*` so form input is never lost. `InstallButton` in the shared `Header` shows only when the browser fires `beforeinstallprompt`. The service worker is not active in `bun run dev`; test with `build` + `preview`.

**Data flow / persistence (layered):**
1. No seed data: donations start empty. `src/data/initialData.ts` only holds `INITIAL_SETTINGS` and `INITIAL_MILESTONES`.
2. localStorage cache: donations (`awami_road_donations_v4`; the old `_v3` key that held seed data is deleted on load), settings (`_v3`) and the admin flag (`_v2`). The cache is only a fallback for when Supabase is unreachable.
3. Supabase (`src/services/supabase.ts`) is the source of truth: on mount `useDonations` fetches all rows and always replaces local state (even with an empty list) and subscribes to realtime INSERT/UPDATE/DELETE. Donation `id` is a sequential bigint identity assigned by the database (kept as a string in the app; shown to admins as **Receipt #**): new donations go through `insertDonationToSupabase` (no client-side id, added to state once the insert returns), edits are optimistic local updates followed by `upsert`. `toDbRow`/`fromDbRow` map camelCase `Donation` ↔ snake_case columns; the table schema and (fully public) RLS policies are in the `SUPABASE_SQL_SETUP` string in that file. Credentials come from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` with hardcoded fallbacks.

Settings (target goal, committee, announcements, admin credentials) are **only** in localStorage — they are not synced to Supabase.

**Admin access** is client-side only: `AdminApp` shows `AdminLoginModal` until login, checking against `settings.adminUsername`/`adminPassword` (defaults in `INITIAL_SETTINGS`), and stores a localStorage flag. Old `?admin` / `?mode=admin` / `#admin` links on the public site redirect to `/admin/`. Donations flagged `isAnonymous` are shown as "Anonymous" on the public site only (masked in `App.tsx`); the real name is still in the DB and API response.

**Unused code:** `GoogleSheetsSync`, `SupabaseSync`, `RoadGallery`, `AboutProjectModal`, `CommitteeModal` and `ReceiptModal` components are not imported anywhere (public cards are intentionally not clickable). The Firebase Google-auth (`services/googleAuth.ts`, config in `firebase-applet-config.json`) and Google Sheets (`services/googleSheets.ts`) services are only reachable through `GoogleSheetsSync`.

`PaymentSource` is a fixed union (`Cash | BankTransfer | Easypesa | Jazzcash | Material | Remaining` — note the "Easypesa" spelling; `Remaining` means pledged but not yet received, yet still counts toward totals); parsers fall back to `'Easypesa'` for unknown values. Per-source labels/colors live in `getSourceDetails` in `src/utils/formatters.ts`.
