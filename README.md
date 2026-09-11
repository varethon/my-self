# VARETHON ASCEND

VARETHON ASCEND is a standalone Angular 22 personal operating system: Goal → Plan → Execute → Review. The app runs immediately in demo mode, and switches to Supabase Auth/Postgres when a public publishable key is supplied at runtime.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`. Demo mode accepts any email and a password with at least four characters. No private key is bundled in the frontend.

Production configuration is loaded from `public/runtime-config.js`:

```js
window.__VARETHON_CONFIG__ = {
  supabaseUrl: 'https://qphzagsrntgjktnqiyaz.supabase.co',
  supabasePublishableKey: 'your-public-publishable-key'
};
```

## Supabase

The migration set is additive and ordered in `supabase/migrations/`. It creates the domain tables, enables RLS on every private table, validates ownership of relationships, protects active calendar intervals with a PostgreSQL exclusion constraint, and exposes only the two authenticated atomic RPCs:

- `accept_ai_schedule_batch`
- `complete_focus_session`

With the Supabase CLI authenticated, inspect the linked project before applying migrations, then push without resetting data:

```bash
npx supabase login
npx supabase link --project-ref qphzagsrntgjktnqiyaz
npx supabase migration list
npx supabase db push
npx supabase functions deploy ai-schedule
npx supabase functions deploy accept-ai-schedule
npx supabase functions deploy ai-breakdown-goal
npx supabase functions deploy ai-review
npx supabase functions deploy ai-reschedule
npx supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=gemini-3.8-flash
```

The Edge Functions use JWT authentication, Zod payload validation, deterministic candidate generation, Gemini selection with a deterministic fallback, and the safe Preview → Approve → RPC revalidation flow.

## Verify

```bash
npm run build
npm test -- --watch=false
npm audit --audit-level=high
```

The GitHub Pages workflow in `.github/workflows/pages.yml` derives the repository base href, generates `404.html` for deep links, injects only the public Supabase runtime configuration, and uploads the actual build output. Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as GitHub Actions variables; keep `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `GEMINI_API_KEY`, and `GH_TOKEN` as secrets or runtime environment values only.
# my-self
