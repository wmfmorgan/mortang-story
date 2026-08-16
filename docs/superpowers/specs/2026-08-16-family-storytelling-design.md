# Mortang Story — Family Storytelling Design

**Date:** 2026-08-16  
**Status:** Approved  
**Repo:** [wmfmorgan/mortang-story](https://github.com/wmfmorgan/mortang-story.git)

A private web app where one family writes, layers, and keeps its stories. Relatives log in, tell what happened, add their own voice to an event someone else already wrote, and browse the archive as a timeline or through a person.

This document is the product spec. Implementation lives in [../plans/2026-08-16-mortang-story.md](../plans/2026-08-16-mortang-story.md).

---

## 1. Purpose

Families lose stories because they live in one person’s memory, a group chat, or a box of photos with no dates. This app is a shared, invite-only archive:

- Anyone in the family can write a story about something that happened.
- A story is an **event**, not a post. Other members add their **perspective** — their telling of the same event. The original stays intact.
- Every story has a date (often fuzzy) and the people who were there, including people who will never log in.
- The family browses time (timeline) and people (a relative’s page).
- They can react, comment, attach photos and links, and export a designed PDF.

Success for v1: you invite relatives, they sign in with email, they write and read stories on a phone, and you can download a book of what you have.

---

## 2. Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Who is v1 for | Just this family | Simpler launch. No public signup product. |
| People vs logins | Separate. Tag anyone; a person can gain a login later | Deceased relatives, children, and people not on the app yet still belong in stories. |
| Adding to a story | Perspectives on the same event | Distinct from comments. Multiple voices, not a shared Google Doc. |
| Dates | Fuzzy: year required; month, day, circa, season optional | Family memory is “summer of ’87”, not always June 14. |
| Who adds people | Any logged-in member | You can add Aunt June while writing if she is missing. |
| Who grants logins | Admins only | Adding a name ≠ inviting someone into the archive. |
| Stack | Vite + React + TypeScript + Tailwind + Supabase + Netlify | Auth, database, and photos in one place. Static host. No server to babysit. |
| V1 views | Timeline (home) + by person | Timeline is the spine. Person view is the natural second cut. |
| Login | Email magic link | Relatives should not manage passwords. |
| PDF | One story, whole timeline, or one person’s stories | A designed book, generated in the browser. |

---

## 3. Who uses it

There is **one family**. The first person to sign in when no family exists becomes the **founding admin**.

### 3.1 Person vs member

- A **person** is anyone who can appear in a story: living, deceased, child, not-yet-invited.
- A **member** is a person who has (or has been granted) a login. Members have a `role` of `admin` or `member`.
- A person with no `user_id` and no `invite_email` is person-only. They can be tagged. They cannot sign in.

### 3.2 Permissions

| Action | Member | Admin |
|---|---|---|
| Create a story | Yes | Yes |
| Add a perspective | Yes, their own | Yes, their own |
| Edit / delete own telling | Yes | Yes |
| Delete someone else’s telling or a story | No (unless they created the story) | Yes |
| Add a person (directory or mid-story) | Yes | Yes |
| Set invite email / promote admin | No | Yes |
| Comment, like, emoji | Yes | Yes |
| Delete own comment / own reaction | Yes | Yes |
| Delete any comment | No | Yes |
| Export PDF | Yes | Yes |

Story creator or admin may update or delete the story (date, title, people, media). The original perspective can be edited by its author but not deleted unless the whole story is deleted.

---

## 4. Domain model

### 4.1 Family

One row. Name is the product title in the UI (not “Mortang Story”). The repo name stays `mortang-story`.

### 4.2 Story (event)

A story is one thing that happened:

- Title
- Fuzzy date (see §5)
- Involved people (at least one)
- Optional place name (text). Nullable `place_lat` / `place_lng` stored for a later map view — not collected in v1 UI
- Optional photos and links
- Created by a person

Creating a story also creates the author’s **original perspective** (their first telling).

### 4.3 Perspective (telling)

Another member’s telling of the same event.

- One perspective per person per story
- Body is long-form text
- `is_original` marks the first telling
- The original stays visible and unedited by others

**Comments are not perspectives.** A comment is a short reaction in a thread. A perspective is a signed telling (“June’s telling”).

### 4.4 Social

- **Like** is the emoji `❤️`, shown as a dedicated like button, on the story and on each perspective.
- **Emojis** from a fixed set: `😂 😮 😢 🎉 🙏`. Toggle on/off. One row per person per emoji per target.
- **Comments** attach to the story, or to a specific perspective.

### 4.5 Media

Belongs to the story (shared across tellings), not to a single perspective.

- `photo` — file in Supabase Storage bucket `family-media`
- `link` — URL + optional title

---

## 5. Fuzzy dates

| Precision | Fields | Display example |
|---|---|---|
| Year | `year` | `1962` |
| Year + circa | `year`, `circa` | `c. 1962` |
| Month | `year`, `month` | `June 1994` |
| Day | `year`, `month`, `day` | `14 June 1994` |
| Season | `year`, `season` | `Summer 1987` |
| Season + circa | `year`, `season`, `circa` | `c. Summer 1987` |

**Sort key** (ascending = oldest first, the default history order):

```
year * 10000
+ coalesce(month, season→3/6/9/12, 1) * 100
+ coalesce(day, 1)
```

Year-only sorts before June of the same year. Summer ≈ June.

---

## 6. Auth and invites

No service-role key in the browser. No edge function in v1.

1. Supabase Auth: email magic link. Site URL = the Netlify URL. Redirect allow-list includes `https://<site>/**` and local `http://localhost:5173/**`.
2. After session: look up `people` by `user_id`. If none, call `claim_invite()` which matches `invite_email` to `auth.email()` and sets `user_id`.
3. If no family exists: **onboarding** — name the family, name yourself, become admin. This inserts the one `families` row and the founding `people` row.
4. If a family exists and the user is not linked: **not invited**.
5. Admin invite: set `people.invite_email`. Tell the relative to sign in with that exact email.

Uninvited emails can still receive a magic link (Supabase does not block that without extra config). The app then shows “This archive is invite-only.” That is acceptable for a private family of tens of people.

---

## 7. Screens

| Route | Who | What |
|---|---|---|
| `/login` | Anyone | Email field. Send magic link. |
| `/auth/callback` | Anyone | Exchange the link for a session. |
| `/onboarding` | First user only | Family name + your name. |
| `/not-invited` | Signed-in, no person | Invite-only message. Sign out. |
| `/` | Members | Vertical timeline. Oldest first. Toggle to newest. Empty: “Write the first story.” |
| `/people` | Members | Directory of people. Add a person. |
| `/people/:id` | Members | Name, years, bio, login/invite/person-only badge, their stories as a mini-timeline. |
| `/stories/new` | Members | Composer: title, fuzzy date, people (add missing inline), body, photos, links, place name. Author is pre-selected. ≥1 person required. |
| `/stories/:id` | Members | Letter-like detail. Date, title, people, place, links, photos. Original telling, then other perspectives. Reactions and comments. Export this story. |
| `/stories/:id/tell` | Members | Add your perspective, or edit the one you already wrote. |
| `/admin` | Admins | Set invite email on a person. Promote / demote admin. |

App shell (members only): family name, Timeline, People, Write, Admin (if admin), sign out. Mobile first.

---

## 8. Visualizations

### v1

**Timeline (home).** A single vertical spine. Each node is a story: formatted fuzzy date in small caps, title, people names, how many tellings, first photo thumb if any. Click → story detail.

**By person.** Open a relative. See every story they are tagged in, same node component, oldest first.

### Phase 2 (schema already ready)

- **Story map** — pins from `place_name` / lat / lng
- **Photo album** — pictures first, click through to the story
- **Decade book** — chapters by decade
- **Family graph** — people as nodes, stories as edges

---

## 9. UI direction

This is an archive, not a SaaS dashboard.

- Background: warm off-white `#f6f1e8`
- Ink: `#2b241d`
- Accent: deep oxblood `#7a2e2e` (not generic blue)
- Titles: Source Serif 4 or Fraunces
- Body: Source Sans 3
- Timeline: generous type, quiet chrome
- Story detail reads like a letter. Perspectives are signed tellings (“June’s telling”)
- Relatives will use phones. Every flow must work at a narrow viewport

---

## 10. PDF

Generated in the browser with `@react-pdf/renderer`. Download name: `mortang-<slug>.pdf`.

Three modes, one document component:

1. **One story** — title, formatted date, place, people, every perspective (author + body), photo grid, links
2. **Whole timeline** — cover with family name, then each story chronological
3. **One person** — cover with their name, then stories they appear in

Paper page, serif titles, generous margins, page numbers, footer “The \<Family\> stories”. Photos via signed Supabase URLs. Long bodies wrap. No truncated text.

Buttons: story detail (“Export this story”), timeline (“Export the book”), person page (“Export their stories”).

---

## 11. Data model

Single family row. Every other table carries `family_id` so RLS stays uniform if this ever opens up.

```sql
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
  role public.member_role,
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

Indexes: `stories(family_id, occurred_year)`, `people(family_id)`, `people(user_id)`, `people(invite_email)`, `perspectives(story_id)`, `comments(story_id)`, `reactions(story_id)`.

### 11.1 Row Level Security

Helper: `current_person()` returns the `people` row where `user_id = auth.uid()`.

- Not logged in: no rows.
- Logged in, no linked person, family already exists: no rows (app shows not-invited).
- Linked member: `select` everything in their `family_id`.
- No family yet: founding user may insert one family and their person (admin), enforced by “families has 0 rows” on insert.

Write rules:

- `people`: members insert; creator or admin update; admin delete. `invite_email`, `role`, and `user_id` are writable only by admins, except `claim_invite()` (security definer) which sets `user_id` for the matching invite email.
- `stories`: members insert; creator or admin update/delete.
- `perspectives`: members insert their own; author or admin update/delete.
- `story_people`, `media`, `comments`: members insert; author or admin delete.
- `reactions`: author only for insert/delete of their row.

Storage bucket `family-media`: read/write if `current_person()` exists.

---

## 12. Hosting

**Chosen:** Supabase (Auth, Postgres, Storage, RLS) + Netlify (static `dist`, SPA fallback `/* → /index.html 200`).

Env (Vite, public): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Never a service role key in the frontend.

**Alternatives considered, not chosen:**

- Vercel + same Supabase app — drop-in if Netlify is painful
- Cloudflare Pages — same SPA, more wrangling for redirects
- Next.js + Vercel — only if we later want server PDFs or a public site
- Convex — realtime for free, more lock-in, storage/PDF worse

---

## 13. V1 vs later

**V1 ships** when the verification list in the implementation plan passes: bootstrap, invites, people without logins, fuzzy dates, perspectives, photos/links, social, person view, three PDF modes, permission boundaries, mobile, and a working magic-link redirect on the deployed URL.

**Phase 2 (not in first ship):**

- Map view + geocoding
- Photo album, decade book, family graph
- Edge function for branded invite emails
- Avatars
- Edit story people/date after create
- Search
- Notifications when someone adds a perspective

**Out of scope for this product as specified:**

- Multiple families / public signup
- Passwords, Google/Apple OAuth
- Live collaborative editing of one document
- Audio / video
- Offline
- i18n

---

## 14. Open questions

None. Decisions in §2 were made with the product owner before this spec was written.
