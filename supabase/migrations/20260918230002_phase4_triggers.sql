-- Phase 4 triggers: feature flags and audience on posts, participants, poll votes, relay threads.

-- posts: module flags, audience, and type-derived expiry, on top of the Phase 3 guard.
create or replace function app.protect_post_phase4()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_definer boolean := coalesce(current_setting('app.definer', true), '') = 'on';
begin
  if tg_op = 'INSERT' then
    if v_actor is not null and not app.type_enabled(new.type) then
      raise exception 'this module is switched off on your campus' using errcode = '42501';
    end if;
    if new.audience = 'meal_holders' and new.type <> 'meal' then
      new.audience := 'campus';
    end if;
    if new.expires_at is null then
      if new.type = 'event' then
        new.expires_at := coalesce((new.payload ->> 'endsAt')::timestamptz, (new.payload ->> 'startsAt')::timestamptz + interval '4 hours');
      elsif new.type = 'ride' then
        new.expires_at := (new.payload ->> 'departsAt')::timestamptz;
      end if;
    end if;
    return new;
  end if;
  if not v_definer and v_actor is not null then
    new.audience := old.audience;
  end if;
  return new;
end;
$$;
create trigger posts_protect_phase4 before insert or update on public.posts
  for each row execute function app.protect_post_phase4();

-- Participants: kind follows the post type, capacity comes from the payload.
create or replace function app.before_participant_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts%rowtype;
  v_cap integer;
  v_count integer;
begin
  select * into v_post from public.posts p where p.id = new.post_id;
  if v_post.id is null or v_post.status <> 'active' or (v_post.expires_at is not null and v_post.expires_at < now()) then
    raise exception 'this notice is not open' using errcode = '22023';
  end if;
  new.kind := case v_post.type when 'event' then 'rsvp' when 'ride' then 'seat' when 'study' then 'member' else null end::public.participant_kind;
  if new.kind is null then
    raise exception 'this notice has no sign-up' using errcode = '22023';
  end if;
  if auth.uid() is not null then
    new.user_id := auth.uid();
    perform app.check_rate_limit('participate', 30, 3600);
  end if;
  if new.user_id = v_post.author_id then
    raise exception 'you are the host' using errcode = '22023';
  end if;
  if app.is_blocked_either_way(v_post.author_id) then
    raise exception 'this notice is not open' using errcode = '22023';
  end if;
  v_cap := case v_post.type when 'event' then (v_post.payload ->> 'rsvpLimit')::int when 'ride' then (v_post.payload ->> 'seats')::int when 'study' then (v_post.payload ->> 'capacity')::int end;
  if v_cap is not null then
    select count(*) into v_count from public.post_participants pp where pp.post_id = new.post_id;
    if v_count >= v_cap then
      raise exception 'full: no places left' using errcode = '22023';
    end if;
  end if;
  new.university_id := v_post.university_id;
  new.created_at := now();
  return new;
end;
$$;
create trigger post_participants_before_insert before insert on public.post_participants
  for each row execute function app.before_participant_insert();

create or replace function app.after_participant_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts%rowtype;
  v_name text;
  v_prev text := coalesce(current_setting('app.definer', true), '');
begin
  select * into v_post from public.posts p where p.id = coalesce(new.post_id, old.post_id);
  perform set_config('app.definer', 'on', true);
  update public.posts set last_activity_at = now() where id = v_post.id;
  perform set_config('app.definer', v_prev, true);
  if tg_op = 'INSERT' then
    select display_name into v_name from public.profiles where user_id = new.user_id;
    perform app.notify(v_post.author_id, 'system', new.user_id, 'post', v_post.id,
      coalesce(v_name, 'Someone') || case new.kind when 'rsvp' then ' is coming' when 'seat' then ' took a seat' else ' joined' end,
      left(v_post.title, 140), '/p/' || v_post.id);
  end if;
  return null;
end;
$$;
create trigger post_participants_after_change after insert or delete on public.post_participants
  for each row execute function app.after_participant_change();

-- Poll votes: options in range, one choice unless the poll allows several, only while open.
create or replace function app.before_poll_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts%rowtype;
  v_n integer;
  v_multiple boolean;
begin
  select * into v_post from public.posts p where p.id = new.post_id;
  if v_post.id is null or v_post.type <> 'poll' or v_post.status <> 'active' or (v_post.expires_at is not null and v_post.expires_at < now()) then
    raise exception 'this poll is closed' using errcode = '22023';
  end if;
  v_n := jsonb_array_length(coalesce(v_post.payload -> 'options', '[]'::jsonb));
  v_multiple := coalesce((v_post.payload ->> 'multiple')::boolean, false);
  if array_length(new.options, 1) is null or (not v_multiple and array_length(new.options, 1) <> 1) then
    raise exception 'pick one option' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(new.options) o where o < 0 or o >= v_n) then
    raise exception 'option out of range' using errcode = '22023';
  end if;
  if auth.uid() is not null then
    new.user_id := auth.uid();
    if tg_op = 'INSERT' then perform app.check_rate_limit('vote', 60, 3600); end if;
  end if;
  new.university_id := v_post.university_id;
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.post_id := old.post_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
create trigger poll_votes_before_write before insert or update on public.poll_votes
  for each row execute function app.before_poll_vote();
