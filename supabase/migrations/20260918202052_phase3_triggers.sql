-- Phase 3 triggers: counters, identity protection, rate limits, notifications. Runs AFTER the tables.

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Notifications are written only here, so nobody can forge one.
create or replace function app.notify(p_user uuid, p_kind public.notification_kind, p_actor uuid, p_target_type text, p_target_id uuid, p_title text, p_body text, p_href text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_university uuid;
begin
  if p_user is null or p_user = p_actor then
    return;
  end if;
  if p_actor is not null and exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_user and b.blocked_id = p_actor) or (b.blocker_id = p_actor and b.blocked_id = p_user)
  ) then
    return;
  end if;
  select m.university_id into v_university from public.memberships m where m.user_id = p_user order by m.created_at limit 1;
  if v_university is null then
    return;
  end if;
  insert into public.notifications (university_id, user_id, kind, actor_id, target_type, target_id, title, body, href)
  values (v_university, p_user, p_kind, p_actor, p_target_type, p_target_id, left(p_title, 200), left(p_body, 500), p_href);
end;
$$;
revoke all on function app.notify(uuid, public.notification_kind, uuid, text, uuid, text, text, text) from public;
grant execute on function app.notify(uuid, public.notification_kind, uuid, text, uuid, text, text, text) to service_role;

-- Posts: clients set title, body, payload, images, space, expiry, and (owner) status; everything else
-- is derived here. RPCs that must bypass the guard set app.definer = on for the transaction.
create or replace function app.protect_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_definer boolean := coalesce(current_setting('app.definer', true), '') = 'on';
  v_actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if v_actor is not null then
      new.author_id := v_actor;
      new.university_id := coalesce(app.current_university_id(), new.university_id);
      perform app.check_rate_limit('post', case when app.account_age_days() < 7 then 3 else 10 end, 3600);
    end if;
    new.status := 'active';
    new.comment_count := 0;
    new.thanks_count := 0;
    new.accepted_comment_id := null;
    new.resolved_at := null;
    if v_actor is not null then
      new.created_at := now();
    end if;
    new.updated_at := now();
    new.last_activity_at := coalesce(new.created_at, now());
    new.title := trim(new.title);
    if new.expires_at is not null and new.expires_at < now() then
      raise exception 'expiry must be in the future' using errcode = '22023';
    end if;
    if new.space_id is not null and not exists (select 1 from public.spaces s where s.id = new.space_id and s.university_id = new.university_id) then
      raise exception 'space is not on this campus' using errcode = '22023';
    end if;
    return new;
  end if;

  new.updated_at := now();
  if v_definer or v_actor is null then
    return new;
  end if;
  new.author_id := old.author_id;
  new.university_id := old.university_id;
  new.type := old.type;
  new.created_at := old.created_at;
  new.comment_count := old.comment_count;
  new.thanks_count := old.thanks_count;
  new.accepted_comment_id := old.accepted_comment_id;
  new.resolved_at := old.resolved_at;
  new.last_activity_at := old.last_activity_at;
  if new.status is distinct from old.status then
    if v_actor = old.author_id and new.status in ('active', 'resolved', 'deleted') and old.status in ('active', 'resolved', 'expired') then
      if new.status = 'resolved' then new.resolved_at := now(); end if;
    elsif app.has_role('moderator') and new.status in ('active', 'removed') then
      null;
    else
      raise exception 'status change not allowed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger posts_protect before insert or update on public.posts
  for each row execute function app.protect_post();

create or replace function app.protect_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_definer boolean := coalesce(current_setting('app.definer', true), '') = 'on';
  v_actor uuid := auth.uid();
  v_post public.posts%rowtype;
begin
  if tg_op = 'INSERT' then
    select * into v_post from public.posts p where p.id = new.post_id;
    if v_post.id is null or v_post.status not in ('active', 'resolved') then
      raise exception 'post is not open for replies' using errcode = '22023';
    end if;
    if v_actor is not null then
      new.author_id := v_actor;
      perform app.check_rate_limit('comment', case when app.account_age_days() < 7 then 10 else 30 end, 3600);
    end if;
    new.university_id := v_post.university_id;
    new.status := 'active';
    new.thanks_count := 0;
    new.is_accepted := false;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  new.updated_at := now();
  if v_definer or v_actor is null then
    return new;
  end if;
  new.author_id := old.author_id;
  new.post_id := old.post_id;
  new.university_id := old.university_id;
  new.parent_id := old.parent_id;
  new.created_at := old.created_at;
  new.thanks_count := old.thanks_count;
  new.is_accepted := old.is_accepted;
  if new.status is distinct from old.status then
    if v_actor = old.author_id and new.status = 'deleted' then
      null;
    elsif app.has_role('moderator') and new.status in ('active', 'removed') then
      null;
    else
      raise exception 'status change not allowed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger comments_protect before insert or update on public.comments
  for each row execute function app.protect_comment();
