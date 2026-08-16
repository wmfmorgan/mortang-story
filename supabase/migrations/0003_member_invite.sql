-- Any family member can attach an invite email to a person who does not
-- yet have a login. The client then sends the magic link.

create or replace function public.invite_person(target_id uuid, email text)
returns public.people
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.people;
  cleaned text;
begin
  if public.current_person_id() is null then
    raise exception 'not a member';
  end if;

  cleaned := nullif(lower(btrim(email)), '');
  if cleaned is null or position('@' in cleaned) = 0 then
    raise exception 'a valid email is required';
  end if;

  update public.people
  set invite_email = cleaned
  where id = target_id
    and family_id = public.current_family_id()
    and user_id is null
  returning * into p;

  if not found then
    raise exception 'person not found or already has a login';
  end if;
  return p;
end;
$$;

grant execute on function public.invite_person(uuid, text) to authenticated;
