-- Any family member can add place, people, or photos to an existing event.

drop policy if exists stories_update on public.stories;

create policy stories_update on public.stories
  for update to authenticated
  using (family_id = public.current_family_id())
  with check (family_id = public.current_family_id());

drop policy if exists story_people_delete on public.story_people;

create policy story_people_delete on public.story_people
  for delete to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_id and s.family_id = public.current_family_id()
    )
  );
