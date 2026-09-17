-- Campus Wide: identity functions, auth hooks, audit, sessions. Runs AFTER the tables migration.

-- Domain allowlist lookup
-- ---------------------------------------------------------------------------------------------

create or replace function app.university_for_email(email text)
returns table (university_id uuid, campus_role public.campus_role, hosted_domain text)
language sql
stable
security definer
set search_path = public
as $$
  select d.university_id, d.role, coalesce(d.hosted_domain, d.domain)
  from public.university_domains d
  join public.universities u on u.id = d.university_id
  where lower(d.domain) = lower(split_part(email, '@', 2))
    and d.verified
    and u.status = 'active'
  limit 1
$$;

-- ---------------------------------------------------------------------------------------------
-- Auth hook: Before User Created — the database-level allowlist (rejects direct API sign-ups too)
-- ---------------------------------------------------------------------------------------------

create or replace function public.before_user_created_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(event -> 'user' ->> 'email');
  v_domain text := lower(split_part(event -> 'user' ->> 'email', '@', 2));
  v_provider text := event -> 'user' -> 'raw_app_meta_data' ->> 'provider';
  v_hd text := lower(coalesce(event -> 'user' -> 'raw_user_meta_data' -> 'custom_claims' ->> 'hd', ''));
  v_match record;
begin
  if v_email is null or v_domain = '' then
    return jsonb_build_object('error', jsonb_build_object('http_code', 400, 'message', 'A campus email address is required.'));
  end if;

  select * into v_match from app.university_for_email(v_email);
  if v_match.university_id is null then
    insert into public.domain_requests (domain, email_hash)
    values (v_domain, encode(sha256(convert_to(v_email, 'utf8')), 'hex'))
    on conflict do nothing;
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Only verified campus accounts can join this board. Your campus has been noted for review.'));
  end if;

  -- Google sign-ins must carry the hosted-domain claim from the signed ID token (client hints are ignored).
  if v_provider = 'google' and (v_hd = '' or v_hd <> lower(v_match.hosted_domain)) then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Sign in with your campus Google account.'));
  end if;

  return '{}'::jsonb;
end;
$$;

grant execute on function public.before_user_created_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.before_user_created_hook(jsonb) from authenticated, anon, public;
grant insert on public.domain_requests to supabase_auth_admin;

-- ---------------------------------------------------------------------------------------------
-- Names: generated in the database from the declared name; never accepted from the client
-- ---------------------------------------------------------------------------------------------

create or replace function app.display_name(given text, family text, username text, privacy boolean)
returns text
language sql
immutable
as $$
  select case
    when privacy then upper(left(coalesce(given, username), 1)) || upper(left(coalesce(family, ''), 1))
    when given is not null and family is not null then given || ' ' || upper(left(family, 1)) || '.'
    when given is not null then given
    else '@' || username
  end
$$;

-- "Jane Doe" + "jdoe01" -> true (first initial + letters of the family name prefix the UID).
create or replace function app.name_matches_username(given text, family text, username text)
returns boolean
language sql
immutable
as $$
  select given is not null and family is not null
    and lower(username) like lower(left(regexp_replace(given, '[^a-zA-Z]', '', 'g'), 1) || regexp_replace(family, '[^a-zA-Z]', '', 'g')) || '%'
$$;

-- ---------------------------------------------------------------------------------------------
-- Identity trigger: creates users / profiles / memberships once the email is confirmed
-- ---------------------------------------------------------------------------------------------

create or replace function app.handle_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match record;
  v_provider text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
  v_username text := lower(split_part(new.email, '@', 1));
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  -- Subsequent sign-ins: keep the last-seen timestamps current.
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    update public.users set last_sign_in_at = coalesce(new.last_sign_in_at, now()), updated_at = now() where id = new.id;
    update public.memberships set last_sign_in_at = coalesce(new.last_sign_in_at, now()), updated_at = now() where user_id = new.id;
    return new;
  end if;

  select * into v_match from app.university_for_email(new.email);
  if v_match.university_id is null then
    raise exception 'campus domain not allowed' using errcode = 'P0001';
  end if;

  insert into public.users (id, email, email_domain, campus_username, identity_provider, name_pending, last_sign_in_at)
  values (new.id, lower(new.email), lower(split_part(new.email, '@', 2)), v_username,
          case when v_provider = 'saml' then 'saml' else 'email' end::public.identity_provider, true, now())
  on conflict (id) do nothing;

  insert into public.memberships (user_id, university_id, campus_role, status, last_sign_in_at)
  values (new.id, v_match.university_id, v_match.campus_role, 'active', now())
  on conflict (user_id, university_id) do nothing;

  insert into public.profiles (user_id, university_id, display_name, initials, campus_username)
  values (new.id, v_match.university_id, '@' || v_username, upper(left(v_username, 1)), v_username)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after insert or update of email_confirmed_at, last_sign_in_at on auth.users
  for each row execute function app.handle_confirmed_user();

-- ---------------------------------------------------------------------------------------------
-- Onboarding RPC: declare the name exactly once (moderators may correct it, with an audit entry)
-- ---------------------------------------------------------------------------------------------

create or replace function public.declare_name(given text, family text, age_attested boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users%rowtype;
  v_given text := trim(given);
  v_family text := trim(family);
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if length(v_given) < 1 or length(v_given) > 40 or length(v_family) < 1 or length(v_family) > 60 then
    raise exception 'name out of range' using errcode = '22023';
  end if;
  if v_given !~ '^[[:alpha:]][[:alpha:] .''-]*$' or v_family !~ '^[[:alpha:]][[:alpha:] .''-]*$' then
    raise exception 'name has unsupported characters' using errcode = '22023';
  end if;
  if not age_attested then raise exception 'age attestation required' using errcode = '22023'; end if;

  select * into v_user from public.users where id = auth.uid() for update;
  if v_user.name_locked_at is not null then
    raise exception 'name is locked; ask a moderator' using errcode = '42501';
  end if;

  update public.users
     set declared_given_name = v_given,
         declared_family_name = v_family,
         name_locked_at = now(),
         name_matches_username = app.name_matches_username(v_given, v_family, campus_username),
         name_pending = false,
         age_attested_at = coalesce(age_attested_at, now()),
         updated_at = now()
   where id = auth.uid();

  perform set_config('app.identity_update', 'on', true);
  update public.profiles p
     set display_name = app.display_name(v_given, v_family, p.campus_username, p.privacy_mode),
         initials = upper(left(v_given, 1)) || upper(left(v_family, 1)),
         onboarded_at = coalesce(p.onboarded_at, now()),
         updated_at = now()
   where p.user_id = auth.uid();

  perform app.log_audit('name.declared', 'user', auth.uid(), jsonb_build_object('matches_username', app.name_matches_username(v_given, v_family, v_user.campus_username)));
end;
$$;

grant execute on function public.declare_name(text, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Audit log: written only through app.log_audit(); rows can never be updated or deleted
-- ---------------------------------------------------------------------------------------------

create or replace function app.log_audit(action text, target_type text, target_id uuid, details jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (university_id, actor_id, actor_role, action, target_type, target_id, details)
  values (app.current_university_id(), auth.uid(), coalesce(auth.jwt() ->> 'role', 'service'), action, target_type, target_id, coalesce(details, '{}'::jsonb));
end;
$$;
grant execute on function app.log_audit(text, text, uuid, jsonb) to authenticated, service_role;

create or replace function app.reject_change()
returns trigger
language plpgsql
as $$
begin
  raise exception '% rows are append-only', tg_table_name using errcode = '42501';
end;
$$;

create trigger audit_log_immutable before update or delete on public.audit_log
  for each row execute function app.reject_change();
create trigger consent_records_immutable before update or delete on public.consent_records
  for each row execute function app.reject_change();

-- ---------------------------------------------------------------------------------------------
-- Profiles: identity-derived columns cannot be changed by their owner
-- ---------------------------------------------------------------------------------------------

create or replace function app.protect_profile_identity()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.identity_update', true), '') <> 'on'
     and auth.uid() = old.user_id and not app.has_role('moderator') then
    new.display_name := old.display_name;
    new.initials := old.initials;
    new.campus_username := old.campus_username;
    new.user_id := old.user_id;
    new.university_id := old.university_id;
    new.helped_count := old.helped_count;
    new.thanks_count := old.thanks_count;
    new.onboarded_at := old.onboarded_at;
    -- Privacy mode is the one identity-affecting switch the owner controls.
    if new.privacy_mode is distinct from old.privacy_mode then
      new.display_name := app.display_name(
        (select declared_given_name from public.users where id = old.user_id),
        (select declared_family_name from public.users where id = old.user_id),
        old.campus_username, new.privacy_mode);
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_protect_identity before update on public.profiles
  for each row execute function app.protect_profile_identity();

-- ---------------------------------------------------------------------------------------------
-- Auth hook: Custom Access Token — adds university_id (never a role) to the JWT
-- ---------------------------------------------------------------------------------------------

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb := event -> 'claims';
  v_university uuid;
begin
  select university_id into v_university
  from public.memberships
  where user_id = (event ->> 'user_id')::uuid and status in ('active', 'read_only')
  order by created_at
  limit 1;
  if v_university is not null then
    claims := jsonb_set(claims, '{app_metadata}', coalesce(claims -> 'app_metadata', '{}'::jsonb) || jsonb_build_object('university_id', v_university));
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.memberships to supabase_auth_admin;

-- ---------------------------------------------------------------------------------------------
-- Sessions: a user lists and revokes only their own sessions (no admin API exists for this)
-- ---------------------------------------------------------------------------------------------

create or replace function public.list_my_sessions()
returns table (id uuid, created_at timestamptz, refreshed_at timestamptz, not_after timestamptz, user_agent text, ip text, is_current boolean)
language sql
security definer
set search_path = auth
as $$
  select s.id, s.created_at, s.refreshed_at, s.not_after, s.user_agent, host(s.ip)::text,
         s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  from auth.sessions s
  where s.user_id = auth.uid()
  order by s.refreshed_at desc nulls last, s.created_at desc
$$;
grant execute on function public.list_my_sessions() to authenticated;

create or replace function public.revoke_my_session(session_id uuid)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  delete from auth.sessions s where s.id = session_id and s.user_id = auth.uid();
  perform app.log_audit('session.revoked', 'session', session_id);
end;
$$;
grant execute on function public.revoke_my_session(uuid) to authenticated;


-- ---------------------------------------------------------------------------------------------
-- Sign-in form pre-check (anon-callable; returns only a boolean; the hook remains the real gate)
-- ---------------------------------------------------------------------------------------------

create or replace function public.is_allowed_email(email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from app.university_for_email(lower(email)))
$$;
grant execute on function public.is_allowed_email(text) to anon, authenticated;
