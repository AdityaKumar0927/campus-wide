-- Phase 4 helpers referenced by policies and triggers. Runs BEFORE the module tables migration.

-- Enum types first: the helper signatures below and the generated policies both need them.
CREATE TYPE "public"."participant_kind" AS ENUM('rsvp', 'seat', 'member');
CREATE TYPE "public"."post_audience" AS ENUM('campus', 'meal_holders');
CREATE TYPE "public"."relay_state" AS ENUM('open', 'closed', 'completed');


-- Academic term label, e.g. 2026-fall (Aug-Dec), 2027-spring (Jan-May), 2027-summer.
create or replace function app.current_term()
returns text
language sql
stable
as $$
  select extract(year from now() at time zone 'America/Chicago')::int::text || '-' ||
    case
      when extract(month from now() at time zone 'America/Chicago') >= 8 then 'fall'
      when extract(month from now() at time zone 'America/Chicago') >= 6 then 'summer'
      else 'spring'
    end
$$;
grant execute on function app.current_term() to authenticated, anon, service_role;

-- Meal requests are visible to attested plan holders only (pilot §3, M-1); authors always see their own.
create or replace function app.can_see_audience(p_audience public.post_audience, p_author uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_audience = 'campus' or p_author = auth.uid() or app.has_role('moderator') then
    return true;
  end if;
  return exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.meal_plan_attested_term = app.current_term()
  );
end;
$$;
grant execute on function app.can_see_audience(public.post_audience, uuid) to authenticated, service_role;

-- Feature flags live on the campus row; every module can be switched off by its admin.
create or replace function app.type_enabled(p_type public.post_type)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_flag text := case p_type
    when 'question' then 'questions'
    when 'event' then 'events'
    when 'listing' then 'market'
    when 'meal' then 'meals'
    when 'lost' then 'lost_found'
    when 'found' then 'lost_found'
    when 'ride' then 'rides'
    when 'study' then 'study'
    when 'roommate' then 'roommates'
    when 'poll' then 'polls'
    else null end;
  v_flags jsonb;
begin
  if v_flag is null then
    return true;
  end if;
  select u.feature_flags into v_flags from public.universities u where u.id = app.current_university_id();
  return coalesce((v_flags ->> v_flag)::boolean, false);
end;
$$;
grant execute on function app.type_enabled(public.post_type) to authenticated, service_role;

create or replace function app.is_thread_participant(p_thread uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.relay_threads t
    where t.id = p_thread and (t.initiator_id = auth.uid() or t.owner_id = auth.uid())
  );
end;
$$;
grant execute on function app.is_thread_participant(uuid) to authenticated, service_role;

-- Payment and pressure words (pilot §4). Same list ships to the browser for the pre-send warning.
create or replace function app.payment_words(p_text text)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(w), '{}'::text[])
  from unnest(array['zelle', 'venmo', 'cash app', 'cashapp', 'paypal', 'apple pay', 'deposit', 'gift card', 'wire', 'bitcoin', 'crypto', 'western union', 'whatsapp', 'telegram', 'off the app', 'text me at', 'send me your number', 'your pin']) as w
  where lower(p_text) like '%' || w || '%'
$$;
grant execute on function app.payment_words(text) to authenticated, service_role;
