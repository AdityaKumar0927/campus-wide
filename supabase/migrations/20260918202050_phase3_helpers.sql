-- Phase 3 helpers referenced by the generated policies. Runs BEFORE the content tables migration,
-- so every body is plpgsql (tables resolve at call time).

-- Tenant: the JWT claim first, then the caller's own membership. The fallback keeps production
-- working even before the custom access token hook is enabled on the Auth project.
create or replace function app.current_university_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v uuid;
begin
  begin
    v := nullif(coalesce(auth.jwt() -> 'app_metadata' ->> 'university_id', ''), '')::uuid;
  exception when others then
    v := null;
  end;
  if v is null and auth.uid() is not null then
    select m.university_id into v
    from public.memberships m
    where m.user_id = auth.uid() and m.status in ('active', 'read_only')
    order by m.created_at
    limit 1;
  end if;
  return v;
end;
$$;

-- Posting requires an active membership and a declared name.
create or replace function app.can_post()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.memberships m
    join public.users u on u.id = m.user_id
    where m.user_id = auth.uid()
      and m.university_id = app.current_university_id()
      and m.status = 'active'
      and not u.name_pending
      and u.deleted_at is null
  );
end;
$$;

create or replace function app.is_space_organizer(space uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.space_memberships sm
    where sm.space_id = space and sm.user_id = auth.uid() and sm.role = 'organizer'
  );
end;
$$;

-- Block is total: either direction hides both people from each other in every policy.
create or replace function app.is_blocked_either_way(other_user uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if other_user is null or auth.uid() is null or other_user = auth.uid() then
    return false;
  end if;
  return exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = other_user)
       or (b.blocker_id = other_user and b.blocked_id = auth.uid())
  );
end;
$$;

create or replace function app.account_age_days()
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  d integer;
begin
  select floor(extract(epoch from (now() - u.created_at)) / 86400)::int into d
  from public.users u where u.id = auth.uid();
  return coalesce(d, 0);
end;
$$;

-- Rate limiting in Postgres (D-22): count recent events for the caller and refuse when the window
-- is full. Called from triggers, so limits also hold for direct API calls with the publishable key.
create or replace function app.check_rate_limit(p_action text, p_max integer, p_window_seconds integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    return;
  end if;
  select count(*) into v_count
  from public.rate_limit_events e
  where e.user_id = auth.uid()
    and e.action = p_action
    and e.created_at > now() - make_interval(secs => p_window_seconds);
  if v_count >= p_max then
    raise exception 'rate_limited: too many % actions; try again later', p_action using errcode = 'P0429';
  end if;
  insert into public.rate_limit_events (user_id, action) values (auth.uid(), p_action);
  if random() < 0.02 then
    delete from public.rate_limit_events where created_at < now() - interval '1 day';
  end if;
end;
$$;

revoke all on function app.can_post() from public;
revoke all on function app.is_space_organizer(uuid) from public;
revoke all on function app.account_age_days() from public;
revoke all on function app.check_rate_limit(text, integer, integer) from public;
grant execute on function app.current_university_id() to authenticated, anon, service_role;
grant execute on function app.can_post() to authenticated, service_role;
grant execute on function app.is_space_organizer(uuid) to authenticated, service_role;
grant execute on function app.is_blocked_either_way(uuid) to authenticated, service_role;
grant execute on function app.account_age_days() to authenticated, service_role;
grant execute on function app.check_rate_limit(text, integer, integer) to authenticated, service_role;
