# Mortang Story

A private family storytelling archive. One family. People exist without logins. A story is an event; relatives add their own telling of it. Browse a timeline or a person. Export a designed PDF.

Product spec: [docs/superpowers/specs/2026-08-16-family-storytelling-design.md](docs/superpowers/specs/2026-08-16-family-storytelling-design.md)

Implementation plan: [docs/superpowers/plans/2026-08-16-mortang-story.md](docs/superpowers/plans/2026-08-16-mortang-story.md)

## Stack

Vite + React + TypeScript + Tailwind. Supabase for auth (magic link), Postgres, and photo storage. Netlify for the static site.

## Local setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). That creates tables, RLS, invite helpers, and the `family-media` storage bucket.
3. **Authentication → Providers → Email**: enable magic link / OTP. Disable confirm-email if you want the first founding login to be instant; otherwise confirm the first inbox once.
4. **Authentication → URL configuration**
   - Site URL: `http://localhost:5173` while developing
   - Redirect URLs: `http://localhost:5173/**` and later `https://<your-netlify-site>/**`
5. Copy env and start the app:

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API**.

```bash
npm install
npm test
npm run dev
```

The first email that signs in while no family exists creates the family and becomes admin. Everyone else needs an invite email on a person (Admin page).

## Deploy to Netlify

1. Push this repo to GitHub.
2. New Netlify site from that repo. Build command `npm run build`, publish directory `dist`. `netlify.toml` already sets the SPA fallback.
3. Site settings → Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. After the first deploy, put the Netlify URL back into Supabase **Site URL** and **Redirect URLs**. Magic links will fail if they still point at localhost.

## Scripts

- `npm run dev` — local Vite server
- `npm test` — Vitest (fuzzy dates)
- `npm run build` — production bundle
