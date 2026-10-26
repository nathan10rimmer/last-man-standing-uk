# Last Man Standing UK — production starter

This folder is the next step beyond the visual prototype: a starter repository for a real multi-user service. It includes a PostgreSQL/Supabase schema, row-level security policies, server-side pick submission, an intentionally fail-closed settlement Edge Function, and a delivery plan.

## What's implemented here
- Database tables for profiles, leagues, memberships, gameweeks, teams, fixtures, picks and audit events.
- Row-level security policies for the main user data.
- `submit_pick()` server-side function that checks authentication, membership, active status, gameweek lock time and team reuse.
- Free-only restrictions while payments are disabled.
- Settlement job skeleton that refuses to settle results until a licensed data provider and rules are configured.
- Original visual demo in `prototype.html`.

## Important status
This is **not yet production-ready or deployed**. The original prototype is self-contained and uses browser-local demo data. The schema and function are a reviewed starting point, but need migration testing, RLS/security review and end-to-end tests in a real Supabase project. The current `index.html` is still a browser-local demo; it must be connected to Supabase Auth and live queries before users can share state. Do not represent demo data as live data.

## Start the original prototype
Open `prototype.html` directly in a browser.

## Run the starter shell locally
1. Install Node.js 20 or later.
2. Run `npm install`.
3. Run `npm run dev`.

The current root page is the visual prototype; its data remains browser-local until the Supabase integration is implemented.

## Supabase + Vercel setup

See `SETUP.md` for the step-by-step setup and deployment instructions. The profile button now supports Supabase email/password sign-in and sign-up once `.env.local` is configured. The league/pick UI is still local demo state and is not yet shared across users.

## Supabase setup (when ready)
1. Create a Supabase project under your own account.
2. Review and apply `supabase/migrations/001_initial_schema.sql` to a test project first.
3. Test all row-level security policies with separate user accounts; in particular, review private league visibility and membership flows.
4. Configure server-only secrets in Supabase, never in frontend source code.
5. Configure a trusted scheduled job for gameweek locks and result processing after provider integration.

## Payments
Payments are disabled. The schema deliberately prevents clients from creating paid leagues or enabling payment processing. Do not enable real-money entries or prize payouts until the exact UK legal position and provider approval are confirmed in writing.

See `docs/IMPLEMENTATION_PLAN.md` for scope, assumptions and remaining launch work.
