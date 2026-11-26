# ClipGen AI

Next.js 15, TypeScript, Tailwind, Supabase (auth, Postgres with RLS, storage), Recharts, Lucide.

## Setup
1. Copy `.env.example` to `.env.local` and fill in the Supabase anon key and service role key.
2. Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor. Everything is created in its own `clipgen`
   schema (safe in a project shared with other apps): tables, RLS policies, the private `clipgen-media` bucket, the
   credit ledger functions, a signup trigger that only acts on ClipGen signups, and the built in templates.
   Then confirm `clipgen` appears under Settings, API, Exposed schemas (the script tries to add it, add it by hand if not).
3. In Supabase Auth settings, add `http://localhost:3000/auth/callback` (and your production URL) as redirect URLs.
4. `npm install && npm run dev`.
5. To enable generation set `REPLICATE_API_TOKEN` (server only). Without it every model shows "Integration required".
6. To give new accounts starting credits: `update app_config set value = '100' where key = 'signup_credits';`
   To grant credits to a workspace, call `grant_credits` with the service role.

## Status
Working once configured: auth, protected routes, projects, assets and folders, prompts, storyboards and scenes,
notifications, search, history, credit ledger, text to video, image to video, image generation, social, variations, multi scene clips.
Integration required (interface built, nothing is simulated): video to video, AI editing, video extension, upscaling.
Pricing: only the prices ($47, $57, $97 per month) come from Selar. Plan names, credits, storage and limits are marked to be confirmed
in `src/lib/plans.ts`. Payment happens on Selar. Activating a subscription after payment is not automated (no webhook yet).
Model capabilities in `src/lib/models.ts` must be verified against the provider docs before launch.

## API access without exposing the schema
If the `clipgen` schema cannot be added to Exposed schemas, run `supabase/migrations/0002_public_api.sql` as well.
The app always reaches data through `clipgen_` prefixed views and functions in `public` (see `src/lib/supabase/wrap.ts`).
Those views are `security_invoker`, so row level security still applies per user.
