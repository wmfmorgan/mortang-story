-- Mortang Story v1 schema, RLS, and auth helpers.
-- Apply in the Supabase SQL editor or via `supabase db push`.

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
  created_at timestamptz not null default now()
);

create unique index reactions_story_unique
  on public.reactions (story_id, author_person_id, emoji)
  where perspective_id is null;

create unique index reactions_perspective_unique
  on public.reactions (perspective_id, author_person_id, emoji)
  where perspective_id is not null;

create index stories_family_year_idx on public.stories (family_id, occurred_year);
create index people_family_idx on public.people (family_id);
create index people_user_idx on public.people (user_id);
create index people_invite_idx on public.people (invite_email);
create index perspectives_story_idx on public.perspectives (story_id);
create index comments_story_idx on public.comments (story_id);
create index reactions_story_idx on public.reactions (story_id);
create index story_people_person_idx on public.story_people (person_id);

-- Helpers (security definer so they work during bootstrap and invite claim)

create or replace function public.current_person_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.people where user_id = auth.uid()
$$;

create or replace function public.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.people where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.people
    where user_id = auth.uid() and role = 'admin'
  )
$$;

create or replace function public.family_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.families)
$$;

create or replace function public.claim_invite()
returns public.people
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.people;
begin
  if auth.uid() is null or auth.jwt() ->> 'email' is null then
    raise exception 'not authenticated';
  end if;

  select * into p from public.people where user_id = auth.uid();
  if found then
    return p;
  end if;

  update public.people
  set user_id = auth.uid(),
      role = coalesce(role, 'member')
  where invite_email is not null
    and lower(invite_email) = lower(auth.jwt() ->> 'email')
    and user_id is null
  returning * into p;

  return p;
end;
$$;

create or replace function public.bootstrap_family(family_name text, founder_name text)
returns public.people
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
  p public.people;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.families) then
    raise exception 'family already exists';
  end if;
  if family_name is null or btrim(family_name) = '' then
    raise exception 'family name required';
  end if;
  if founder_name is null or btrim(founder_name) = '' then
    raise exception 'your name required';
  end if;

  insert into public.families (name)
  values (btrim(family_name))
  returning id into fid;

  insert into public.people (family_id, display_name, user_id, role)
  values (fid, btrim(founder_name), auth.uid(), 'admin')
  returning * into p;

  return p;
end;
$$;

create or replace function public.admin_set_invite(target_id uuid, email text)
returns public.people
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.people;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  update public.people
  set invite_email = nullif(lower(btrim(email)), '')
  where id = target_id
    and family_id = public.current_family_id()
  returning * into p;

  if not found then
    raise exception 'person not found';
  end if;
  return p;
end;
$$;

create or replace function public.admin_set_role(target_id uuid, new_role public.member_role)
returns public.people
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.people;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if target_id = public.current_person_id() and new_role is distinct from 'admin' then
    raise exception 'cannot demote yourself';
  end if;

  update public.people
  set role = new_role
  where id = target_id
    and family_id = public.current_family_id()
    and user_id is not null
  returning * into p;

  if not found then
    raise exception 'person must already have a login';
  end if;
  return p;
end;
$$;

grant execute on function public.current_person_id() to authenticated;
grant execute on function public.current_family_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.family_exists() to authenticated;
grant execute on function public.claim_invite() to authenticated;
grant execute on function public.bootstrap_family(text, text) to authenticated;
grant execute on function public.admin_set_invite(uuid, text) to authenticated;
grant execute on function public.admin_set_role(uuid, public.member_role) to authenticated;

-- RLS

alter table public.families enable row level security;
alter table public.people enable row level security;
alter table public.stories enable row level security;
alter table public.story_people enable row level security;
alter table public.perspectives enable row level security;
alter table public.media enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;

create policy families_select on public.families
  for select to authenticated
  using (id = public.current_family_id());

create policy people_select on public.people
  for select to authenticated
  using (family_id = public.current_family_id());

create policy people_insert on public.people
  for insert to authenticated
  with check (
    family_id = public.current_family_id()
    and user_id is null
    and invite_email is null
    and role is null
  );

create policy people_update on public.people
  for update to authenticated
  using (
    family_id = public.current_family_id()
    and (id = public.current_person_id() or public.is_admin())
  )
  with check (family_id = public.current_family_id());

create or replace function public.protect_person_auth_fields()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.invite_email is distinct from old.invite_email
    or new.role is distinct from old.role then
    -- PostgREST clients are role `authenticated`. RPCs are security definer (postgres).
    if current_user = 'authenticated' then
      raise exception 'use admin functions to change login fields';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_person_auth_fields
  before update on public.people
  for each row
  execute procedure public.protect_person_auth_fields();

create policy people_delete on public.people
  for delete to authenticated
  using (family_id = public.current_family_id() and public.is_admin());

create policy stories_select on public.stories
  for select to authenticated
  using (family_id = public.current_family_id());

create policy stories_insert on public.stories
  for insert to authenticated
  with check (
    family_id = public.current_family_id()
    and created_by_person_id = public.current_person_id()
  );

create policy stories_update on public.stories
  for update to authenticated
  using (
    family_id = public.current_family_id()
    and (created_by_person_id = public.current_person_id() or public.is_admin())
  );

create policy stories_delete on public.stories
  for delete to authenticated
  using (
    family_id = public.current_family_id()
    and (created_by_person_id = public.current_person_id() or public.is_admin())
  );

create policy story_people_select on public.story_people
  for select to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_id and s.family_id = public.current_family_id()
    )
  );

create policy story_people_insert on public.story_people
  for insert to authenticated
  with check (
    exists (
      select 1 from public.stories s
      where s.id = story_id and s.family_id = public.current_family_id()
    )
  );

create policy story_people_delete on public.story_people
  for delete to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_id
        and s.family_id = public.current_family_id()
        and (s.created_by_person_id = public.current_person_id() or public.is_admin())
    )
  );

create policy perspectives_select on public.perspectives
  for select to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_id and s.family_id = public.current_family_id()
    )
  );

create policy perspectives_insert on public.perspectives
  for insert to authenticated
  with check (author_person_id = public.current_person_id());

create policy perspectives_update on public.perspectives
  for update to authenticated
  using (author_person_id = public.current_person_id() or public.is_admin());

create policy perspectives_delete on public.perspectives
  for delete to authenticated
  using (author_person_id = public.current_person_id() or public.is_admin());

create policy media_select on public.media
  for select to authenticated
  using (family_id = public.current_family_id());

create policy media_insert on public.media
  for insert to authenticated
  with check (
    family_id = public.current_family_id()
    and uploaded_by = public.current_person_id()
  );

create policy media_delete on public.media
  for delete to authenticated
  using (
    family_id = public.current_family_id()
    and (uploaded_by = public.current_person_id() or public.is_admin())
  );

create policy comments_select on public.comments
  for select to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_id and s.family_id = public.current_family_id()
    )
  );

create policy comments_insert on public.comments
  for insert to authenticated
  with check (author_person_id = public.current_person_id());

create policy comments_delete on public.comments
  for delete to authenticated
  using (author_person_id = public.current_person_id() or public.is_admin());

create policy reactions_select on public.reactions
  for select to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_id and s.family_id = public.current_family_id()
    )
  );

create policy reactions_insert on public.reactions
  for insert to authenticated
  with check (author_person_id = public.current_person_id());

create policy reactions_delete on public.reactions
  for delete to authenticated
  using (author_person_id = public.current_person_id());

-- Storage

insert into storage.buckets (id, name, public)
values ('family-media', 'family-media', false)
on conflict (id) do nothing;

create policy family_media_select on storage.objects
  for select to authenticated
  using (bucket_id = 'family-media' and public.current_person_id() is not null);

create policy family_media_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'family-media' and public.current_person_id() is not null);

create policy family_media_update on storage.objects
  for update to authenticated
  using (bucket_id = 'family-media' and public.current_person_id() is not null);

create policy family_media_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'family-media' and public.current_person_id() is not null);
