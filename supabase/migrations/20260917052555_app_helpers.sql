-- Campus Wide: helper schema and the functions RLS policies reference.
-- Runs BEFORE the Drizzle-generated tables migration, so bodies are plpgsql (resolved at call time).

create schema if not exists app;
grant usage on schema app to authenticated, anon, service_role;

-- The tenant comes from the JWT claim added by the custom access token hook.
create or replace function app.current_university_id()
returns uuid
language plpgsql
stable
as $$
begin
  return nullif(coalesce(auth.jwt() -> 'app_metadata' ->> 'university_id', ''), '')::uuid;
exception when others then
  return null;
end;
$$;

-- Roles are read from memberships (not the JWT) so demotions, suspensions, and bans apply at once.
create or replace function app.has_role(required text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.university_id = app.current_university_id()
      and m.status = 'active'
      and (
        m.campus_role::text = required
        or (required = 'moderator' and m.campus_role in ('moderator', 'university_admin'))
      )
  );
end;
$$;

create or replace function app.is_active_member()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.university_id = app.current_university_id()
      and m.status = 'active'
  );
end;
$$;

-- Replaced in Phase 3 when the blocks table exists.
create or replace function app.is_blocked_either_way(other_user uuid)
returns boolean
language sql
stable
as $$ select false $$;

revoke all on function app.has_role(text) from public;
revoke all on function app.is_active_member() from public;
grant execute on function app.current_university_id() to authenticated, anon, service_role;
grant execute on function app.has_role(text) to authenticated, service_role;
grant execute on function app.is_active_member() to authenticated, service_role;
grant execute on function app.is_blocked_either_way(uuid) to authenticated, service_role;
