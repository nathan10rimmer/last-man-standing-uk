# Connect Last Man Standing UK to Supabase + Vercel

This setup uses your own accounts. Do not send passwords, service-role keys, or private tokens in chat.

## 1) Create a Supabase project

1. Sign in at https://supabase.com and create a new project (choose a strong database password and store it in your password manager).
2. In **SQL Editor**, open a new query and paste the contents of `supabase/migrations/001_initial_schema.sql`. Review it first, run it against this fresh project, and keep a copy of the migration in version control.
3. Open **Project Settings → API** (or the Connect dialog) and copy the Project URL and publishable/anon key. These public client values are intended for browser use when row-level security is correctly configured. Never put a `service_role` key in the frontend.
4. In **Authentication → URL Configuration**, set your local URL `http://localhost:5173` and add your eventual Vercel deployment URL to the allowed redirect URLs.
5. In **Authentication → Providers / Email**, configure email confirmation as you prefer for testing. Production should use a verified sending domain/provider and account recovery.

## 2) Configure the local project

1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Replace `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the project URL and public key.
4. Run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The profile button should open sign-in/sign-up. Use a test email account. The auth trigger creates a profile row after registration.

## 3) Deploy to Vercel

1. Put this folder in a private GitHub repository you control.
2. Sign in at https://vercel.com, choose **Add New → Project**, import the repository, and keep the Vite defaults (`npm run build`, output directory `dist`).
3. In Vercel **Project → Settings → Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Preview and Production.
4. Deploy. Copy the deployment URL back to Supabase **Authentication → URL Configuration → Redirect URLs** and save.
5. Test sign-up, email confirmation, sign-in and sign-out on the deployed domain.

## Current implementation status

- The existing visual game remains a local demo for leagues, picks and leaderboards.
- Supabase email/password authentication is wired into the profile button when environment variables are configured.
- The schema and server-side pick submission RPC are provided as a foundation.
- The UI is **not yet connected to shared league/pick queries**, so signing in does not yet make league data sync between users. That is the next development task.
- Fixtures, gameweek deadlines, result settlement, admin authorization review, email notifications and real-money payments are not live.
- Payments must remain disabled until the precise UK legal position and the payment provider's written approval are established.

## Production safety checklist

- Run the SQL migration in a fresh test project before production.
- Test every RLS policy with separate user accounts; review private league discovery and join/invite flows.
- The initial schema is a starter and requires security review before real users or sensitive data are added.
- Keep service-role keys, football-provider keys and payment secrets only in server-side secret storage (e.g. Supabase Edge Function secrets), never `VITE_` variables or frontend code.
- Use a licensed football data provider with the required commercial display/processing rights.
- Do not accept entry money or promise payouts until legal and provider approval.
