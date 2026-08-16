-- Any family member can edit a person's details (name, years, bio).
-- Login fields stay locked by protect_person_auth_fields().

drop policy if exists people_update on public.people;

create policy people_update on public.people
  for update to authenticated
  using (family_id = public.current_family_id())
  with check (family_id = public.current_family_id());
