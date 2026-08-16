# Mortang Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a private family storytelling web app the family can actually use: invite relatives, write dated stories with photos and links, add other voices to the same event, browse a timeline and a person view, react and comment, export a designed PDF.

**Architecture:** A Vite React SPA talks only to Supabase (Auth, Postgres, Storage). There is one family. People exist independently of logins. A story is one event; each member may add one perspective. Row Level Security keeps the archive invite-only. Netlify hosts the static build. PDF is generated in the browser.

**Tech Stack:** Vite 6, React 19, TypeScript, React Router 7, Tailwind CSS 4, shadcn/ui, Supabase JS, @react-pdf/renderer, Vitest. Host: Netlify. Backend: one Supabase project.

## Global Constraints

- One private family. No public signup product.
- Person ≠ login. Anyone can be tagged. A person can gain a login later.
- Story = one event (title, fuzzy date, people, optional photos/links/place) + original telling.
- Perspective = another member’s telling of the same event. Original stays intact. One perspective per person per story.
- Comments / likes / emojis are reactions, not tellings. They attach to the story and to each perspective.
- Dates are fuzzy: year required; month, day, circa, and season optional.
- Any logged-in member can create stories, add perspectives, comment/react, and add people.
- Only admins grant logins and promote admins. Founding user is the first admin.
- Authors edit/delete their own telling. Admins can remove anything.
- V1 views: timeline (home) + by-person. Map, album, decade book are phase 2.
- Login is email magic link. No passwords.
- Place in v1 is a text place name only (no map SDK). Store nullable lat/lng for later.
- Warm archival UI: paper background, serif titles, quiet chrome. Not a SaaS dashboard.
- Product name in the UI is the family name. Repo stays `mortang-story`.
- Ignore `.superpowers/` and `.env` in git.
- The full product spec and this implementation plan must live in the repo as markdown (not only in the session). Write them before any app code.

---

## Product decisions (locked)

| Decision | Choice |
|---|---|
| Who is v1 for | Just this family |
| People vs logins | Separate. Tag anyone; invite later |
| Adding to a story | Perspectives on the same event |
| Dates | Fuzzy (year / month / day / circa / season) |
| Who adds people | Any member |
| Who grants logins | Admins only |
| Stack | React + Supabase + Netlify |
| V1 second view | By person |
| Login | Magic link |
| PDF | One story, or whole timeline, or one person’s stories |

### Hosting alternatives (not chosen)

- **Vercel + same Supabase app** — drop-in if Netlify is painful. Same SPA.
- **Cloudflare Pages** — same SPA, fast CDN, slightly more wrangling for SPA redirects.
- **Next.js + Vercel** — only if we later want server PDFs or a public site. Heavier than this app needs.
- **Convex** — realtime for free, more lock-in, storage/PDF worse.

Supabase + Netlify is the right call: Auth + Postgres + Storage + RLS in one place, static host with no server to babysit.

### Visualizations not in v1

- Story map (pins)
- Photo album / scrapbook
- Decade book
- Family graph (people as nodes, stories as edges)

Schema already stores `place_name` and nullable coordinates so the map view does not require a migration later.

---

## Data model

Single family row. Every other table carries `family_id` so RLS stays uniform if this ever opens up.

```sql
-- supabase/migrations/0001_init.sql

create extension if not exists "pgcrypto";

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create type public.member_role as enum ('admin', 'member');
create type public.date_precision as enum ('year', 'month', 'day');
create type public.season as enum ('spring', 'summer', 'autumn', 'winter');
create type public.media_kind as enum ('photo', 'link');

create table public.people (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  display_name text not null,
  birth_year int,
  death_year int,
  bio text,
  avatar_path text,
  user_id uuid unique references auth.users(id) on delete set null,
  invite_email text unique,
  role public.member_role,          -- null until they have (or are granted) a login
  created_by uuid references public.people(id),
  created_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  occurred_year int not null,
  occurred_month int check (occurred_month between 1 and 12),
  occurred_day int check (occurred_day between 1 and 31),
  precision public.date_precision not null default 'year',
  circa boolean not null default false,
  season public.season,
  place_name text,
  place_lat double precision,
  place_lng double precision,
  created_by_person_id uuid not null references public.people(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_people (
  story_id uuid not null references public.stories(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  primary key (story_id, person_id)
);

create table public.perspectives (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  author_person_id uuid not null references public.people(id),
  body text not null,
  is_original boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, author_person_id)
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  kind public.media_kind not null,
  storage_path text,
  url text,
  title text,
  sort_order int not null default 0,
  uploaded_by uuid not null references public.people(id),
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  perspective_id uuid references public.perspectives(id) on delete cascade,
  author_person_id uuid not null references public.people(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  perspective_id uuid references public.perspectives(id) on delete cascade,
  author_person_id uuid not null references public.people(id),
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (story_id, perspective_id, author_person_id, emoji)
);
```

**Like** is the emoji `❤️` rendered as a dedicated like button. Other emojis use a picker (`😂 😮 😢 🎉 🙏`).

**Timeline sort key** (computed in SQL view `stories_timeline`):

```sql
create view public.stories_timeline as
select
  s.*,
  (s.occurred_year * 10000
    + coalesce(s.occurred_month,
        case s.season
          when 'spring' then 3
          when 'summer' then 6
          when 'autumn' then 9
          when 'winter' then 12
          else 1
        end) * 100
    + coalesce(s.occurred_day, 1)
  ) as sort_key
from public.stories s;
```

### RLS (every table)

Helper: `current_person()` returns the `people` row where `user_id = auth.uid()`.

- Not logged in: no rows.
- Logged in but no linked person and a family already exists: no rows (app shows “not invited”).
- Linked member: `select` everything in their `family_id`; `insert/update/delete` per rules below.
- No family yet: founding user may `insert` one family and their person (admin). Enforced by “families has 0 rows” check on insert.

Write rules:

- `people`: members insert; author or admin update; admin delete. `invite_email` and `role` and `user_id` writable only by admins (column grants or trigger).
- `stories`: members insert; creator or admin update/delete.
- `perspectives`: members insert their own; author or admin update/delete.
- `story_people`, `media`, `comments`, `reactions`: members insert; author or admin delete. Reactions: author only for insert/delete of their row.

Storage bucket `family-media`: read/write if `current_person()` exists.

### Auth bootstrap (no service role in v1)

1. Supabase Auth: email magic link enabled. Site URL = Netlify URL. Redirect `https://<site>/**`.
2. After session: look up `people` by `user_id`, else by `invite_email = auth.email()`.
3. If match on invite email and `user_id` is null: set `user_id` (allowed by a security definer function `claim_invite()` so the new user can link themselves).
4. If no family exists: onboarding — name the family, name yourself, become admin.
5. Else: “This archive is invite-only.”

Admin invite: set `people.invite_email`. Tell the relative to sign in with that email. No edge function required for v1.

---

## App structure

```
mortang-story/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  tailwind.config.ts
  netlify.toml
  README.md
  .env.example
  supabase/migrations/0001_init.sql
  src/
    main.tsx
    App.tsx
    index.css
    types/database.ts
    lib/supabase.ts
    lib/dates.ts              # parse, format, sortKey
    lib/pdf/StoryBook.tsx     # @react-pdf/renderer document
    lib/pdf/download.ts
    hooks/useSession.ts
    hooks/useCurrentPerson.ts
    hooks/useStories.ts
    hooks/usePeople.ts
    components/ui/            # shadcn
    components/layout/AppShell.tsx
    components/timeline/Timeline.tsx
    components/timeline/StoryNode.tsx
    components/story/StoryDetail.tsx
    components/story/PerspectiveCard.tsx
    components/story/StoryComposer.tsx
    components/story/FuzzyDateInput.tsx
    components/story/PersonPicker.tsx
    components/story/MediaFields.tsx
    components/social/Reactions.tsx
    components/social/Comments.tsx
    pages/LoginPage.tsx
    pages/OnboardingPage.tsx
    pages/NotInvitedPage.tsx
    pages/TimelinePage.tsx
    pages/PeoplePage.tsx
    pages/PersonPage.tsx
    pages/StoryPage.tsx
    pages/NewStoryPage.tsx
    pages/EditPerspectivePage.tsx
    pages/AdminPage.tsx
    pages/AuthCallbackPage.tsx
```

Routes:

- `/login`
- `/auth/callback`
- `/onboarding`
- `/not-invited`
- `/` timeline
- `/people` `/people/:id`
- `/stories/new` `/stories/:id` `/stories/:id/tell`
- `/admin`

---

## UI direction

- Background: warm off-white (`#f6f1e8`). Ink text (`#2b241d`). Accent: deep oxblood (`#7a2e2e`), not generic blue.
- Titles: a readable serif (Source Serif 4 or Fraunces). Body: Source Sans 3.
- Timeline is a single vertical spine, generous type, date in small caps, title as the node.
- Story detail reads like a letter, not a ticket. Perspectives stack as signed tellings (“June’s telling”, “Robert’s telling”).
- Mobile first. Relatives will open this on phones.

---

## PDF

`@react-pdf/renderer`, generated client-side, download as `mortang-<slug>.pdf`.

Three export modes from one document component:

1. **One story** — title, formatted fuzzy date, place, people, every perspective (author + body), photo grid, links.
2. **Whole timeline** — cover page with family name, then each story as in (1), chronological.
3. **One person** — cover with their name, then stories they appear in.

Layout: paper page, serif titles, generous margins, page numbers, footer “The &lt;Family&gt; stories”. Photos via signed Supabase URLs. Long bodies wrap; no truncated text.

---

## Phased tasks

### Task 0: Write the project markdown

**Files:**
- Create: `docs/superpowers/specs/2026-08-16-family-storytelling-design.md`
- Create: `docs/superpowers/plans/2026-08-16-mortang-story.md`

The spec is the lasting product document. It must include every locked decision, the data model (full SQL), RLS rules, auth bootstrap, screens, UI direction, PDF behavior, v1 vs phase 2, hosting alternatives, and verification. No “TBD”.

The plan file is this implementation plan, copied into the repo so a later session can execute it without the session path.

- [ ] Write the design spec from the Product decisions, Data model, Auth, Screens, UI, PDF, and Out of scope sections above.
- [ ] Write the implementation plan (this document) to `docs/superpowers/plans/2026-08-16-mortang-story.md`.
- [ ] Commit: `docs: family storytelling spec and implementation plan`

### Task 1: Scaffold the SPA and Netlify deploy surface

**Files:** `package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `netlify.toml`, `.gitignore`, `.env.example`, `README.md`

- [ ] Vite React-TS app. Install React Router, Tailwind, `@supabase/supabase-js`.
- [ ] `netlify.toml`: publish `dist`, SPA redirect `/* /index.html 200`.
- [ ] `.gitignore`: `node_modules`, `dist`, `.env`, `.superpowers`.
- [ ] `.env.example`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- [ ] README: create Supabase project, apply migrations, set auth redirect, `npm run dev`, Netlify env vars.
- [ ] Commit: `chore: scaffold vite react app`

### Task 2: Date helpers (TDD)

**Files:** `src/lib/dates.ts`, `src/lib/dates.test.ts`

```ts
export type FuzzyDate = {
  year: number
  month?: number
  day?: number
  circa?: boolean
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
  precision: 'year' | 'month' | 'day'
}

export function sortKey(d: FuzzyDate): number
export function formatFuzzyDate(d: FuzzyDate): string
// "Summer 1987", "c. 1962", "14 June 1994", "June 1994"
```

- [ ] Tests for format strings and sort order (year-only before June of same year; summer ≈ June).
- [ ] Implement until Vitest passes.
- [ ] Commit: `feat: fuzzy date format and sort`

### Task 3: Supabase schema and RLS

**Files:** `supabase/migrations/0001_init.sql`

- [ ] Apply the schema above plus indexes: `stories(family_id, occurred_year)`, `people(family_id)`, `people(user_id)`, `people(invite_email)`, `perspectives(story_id)`, `comments(story_id)`, `reactions(story_id)`.
- [ ] `current_person()` and `claim_invite()` security definer functions.
- [ ] Enable RLS on all tables. Write policies matching the rules above.
- [ ] Storage bucket `family-media` + policies.
- [ ] Document in README how to `supabase db push` or paste SQL in the dashboard.
- [ ] Commit: `feat: supabase schema and rls`

### Task 4: Auth, bootstrap, invite claim

**Files:** `src/lib/supabase.ts`, `src/hooks/useSession.ts`, `src/hooks/useCurrentPerson.ts`, `src/pages/LoginPage.tsx`, `src/pages/AuthCallbackPage.tsx`, `src/pages/OnboardingPage.tsx`, `src/pages/NotInvitedPage.tsx`, `src/App.tsx`

- [ ] Magic-link login form. Callback exchanges the hash/code for a session.
- [ ] Gate: session → person (by user_id or `claim_invite`) → else if no family, onboarding → else not-invited.
- [ ] Onboarding creates `families` row + founding `people` row (`role = admin`, `user_id` set).
- [ ] App shell only renders for a linked person.
- [ ] Commit: `feat: magic link auth and family bootstrap`

### Task 5: People and admin invites

**Files:** `src/hooks/usePeople.ts`, `src/pages/PeoplePage.tsx`, `src/pages/PersonPage.tsx`, `src/pages/AdminPage.tsx`, `src/components/story/PersonPicker.tsx`

- [ ] List people. Add a person (name, optional birth/death year, bio).
- [ ] Person page stub (stories filled in Task 7).
- [ ] Admin page: set `invite_email` on a person, show “ask them to sign in with this email”, promote/demote admin.
- [ ] PersonPicker: multi-select existing + inline “add missing person”.
- [ ] Commit: `feat: people directory and admin invites`

### Task 6: Create story + original perspective + media

**Files:** composer, fuzzy date input, media fields, `src/pages/NewStoryPage.tsx`

- [ ] Form: title, FuzzyDateInput, PersonPicker (must include at least one person; default-include the author), body, photo upload (Supabase Storage), link list (url + title), place name.
- [ ] Submit in one flow: insert story, story_people, original perspective, media rows.
- [ ] Validate: title, year, body, ≥1 person.
- [ ] Commit: `feat: create story with people and media`

### Task 7: Timeline and story detail

**Files:** `src/pages/TimelinePage.tsx`, timeline components, `src/pages/StoryPage.tsx`, perspective card

- [ ] Fetch `stories_timeline` newest or oldest toggle (default oldest-first — it is a history).
- [ ] Vertical spine. Each node: formatted date, title, people names, perspective count, first photo thumb if any. Click → `/stories/:id`.
- [ ] Detail: header (date, title, people, place, links), original telling, then other perspectives, photos, reactions, comments.
- [ ] Empty timeline state: “Write the first story”.
- [ ] Commit: `feat: timeline and story detail`

### Task 8: Add / edit perspectives

**Files:** `src/pages/EditPerspectivePage.tsx`

- [ ] `/stories/:id/tell` — if the current person has no perspective, compose one; if they do, edit it.
- [ ] Author can delete their non-original perspective. Original can be edited but not deleted unless the whole story is deleted (creator or admin).
- [ ] Commit: `feat: add and edit perspectives`

### Task 9: Person view

**Files:** `src/pages/PersonPage.tsx`

- [ ] Header: name, years, bio, avatar.
- [ ] Their stories as a mini-timeline (same node component).
- [ ] Badge if they have a login / pending invite / person-only.
- [ ] Commit: `feat: person story view`

### Task 10: Comments, likes, emojis

**Files:** `src/components/social/Reactions.tsx`, `src/components/social/Comments.tsx`

- [ ] Like toggle (`❤️`) on story and on each perspective.
- [ ] Emoji picker (fixed set). One row per person per emoji. Toggle off by clicking again.
- [ ] Comment thread on story; optional thread under a perspective. Author or admin can delete.
- [ ] Commit: `feat: comments likes and emoji reactions`

### Task 11: PDF export

**Files:** `src/lib/pdf/StoryBook.tsx`, `src/lib/pdf/download.ts`

- [ ] Document covers the three modes.
- [ ] Buttons on story detail (“Export this story”), timeline (“Export the book”), person page (“Export their stories”).
- [ ] Signed URLs for photos before render. Filename from family + scope.
- [ ] Commit: `feat: designed pdf export`

### Task 12: Polish, empty states, deploy checklist

- [ ] Warm theme tokens, serif titles, mobile nav (Timeline / People / Write / Admin if admin).
- [ ] Loading and error states on every page.
- [ ] Favicon + family name in the document title.
- [ ] README deploy: Netlify (GitHub repo, env vars, production URL back into Supabase Auth).
- [ ] Manual verification pass (see below).
- [ ] Commit: `feat: theme polish and deploy docs`

### Phase 2 (not in first ship)

- Map view + geocoding; photo album; decade book.
- Edge function to send branded invite emails.
- Avatars, story edit of people/date after create, search.

---

## Verification (must pass before calling v1 done)

1. Fresh Supabase project + migrations. First magic-link user can create the family.
2. Second email, no invite → “invite-only”. After admin sets `invite_email`, they land as that person.
3. Member adds a person mid-story and tags them. New person has no login.
4. Create a story with year-only, one with “Summer 1987”, one with an exact day. Timeline order is correct. Labels match.
5. Second member adds a perspective. Original is unchanged. Both show on detail.
6. Upload two photos and one link. They appear on the story and in that story’s PDF.
7. Like + emoji + comment on story and on a perspective. Author can unlike / delete comment.
8. Person page lists only stories that person is tagged in.
9. PDF: one story, full book, one person — opens in a reader, photos render, no clipped body text.
10. Non-admin cannot set invite emails. Admin can. Author cannot edit someone else’s telling.
11. Mobile viewport: write a story, open timeline, open detail, add a comment.
12. Deployed Netlify URL: magic-link redirect works (not localhost).

If browser tools are available after deploy, exercise those flows in the browser. If not, use the local Vite server + a real Supabase project.

---

## Out of scope for v1

- Multiple families / public signup
- Passwords, Google/Apple OAuth
- Live collaborative editing of one document
- Real map SDK / geocoding UI
- Photo album, decade book, family graph
- Notifications / email when someone adds a perspective
- Audio/video
- Offline
- i18n
