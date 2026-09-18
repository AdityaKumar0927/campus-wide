-- Phase 5: aggregate campus statistics (never individuals), maintenance job, feedback.

-- Public numbers for /campus/[slug]; small groups are hidden (pilot §7: never under ten).
create or replace function public.public_campus_stats(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  u public.universities%rowtype;
  v_members integer;
  v_posts_month integer;
  v_questions integer;
  v_answered integer;
  v_helped integer;
begin
  select * into u from public.universities x where x.slug = p_slug and x.status = 'active';
  if u.id is null then return null; end if;
  select count(*) into v_members from public.memberships m where m.university_id = u.id and m.status = 'active';
  select count(*) into v_posts_month from public.posts p where p.university_id = u.id and p.created_at > now() - interval '30 days' and p.status in ('active', 'resolved', 'expired');
  select count(*), count(*) filter (where p.status = 'resolved') into v_questions, v_answered from public.posts p where p.university_id = u.id and p.type = 'question' and p.status in ('active', 'resolved');
  select coalesce(sum(pr.helped_count), 0) into v_helped from public.profiles pr where pr.university_id = u.id;
  return jsonb_build_object(
    'name', u.name, 'short_name', u.short_name, 'slug', u.slug,
    'members', case when v_members < 10 then null else (v_members / 10) * 10 end,
    'notices_last_30_days', case when v_posts_month < 10 then null else v_posts_month end,
    'questions', case when v_questions < 10 then null else v_questions end,
    'answered_share', case when v_questions < 10 then null else round(100.0 * v_answered / v_questions) end,
    'people_helped', case when v_helped < 10 then null else v_helped end,
    'modules', (select jsonb_agg(key) from jsonb_each(u.feature_flags) where value = 'true'::jsonb),
    'generated_at', now());
end;
$$;
grant execute on function public.public_campus_stats(text) to anon, authenticated;

-- Admin numbers: counts only.
create or replace function public.admin_campus_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_university uuid := app.current_university_id();
begin
  if not app.has_role('university_admin') then raise exception 'admins only' using errcode = '42501'; end if;
  return jsonb_build_object(
    'members', (select jsonb_object_agg(status, n) from (select status::text, count(*) as n from public.memberships where university_id = v_university group by status) s),
    'roles', (select jsonb_object_agg(campus_role, n) from (select campus_role::text, count(*) as n from public.memberships where university_id = v_university and status = 'active' group by campus_role) s),
    'notices_30d', (select jsonb_object_agg(type, n) from (select type::text, count(*) as n from public.posts where university_id = v_university and created_at > now() - interval '30 days' group by type) s),
    'reports', (select jsonb_object_agg(status, n) from (select status::text, count(*) as n from public.reports where university_id = v_university group by status) s),
    'threads', (select count(*) from public.relay_threads where university_id = v_university),
    'flagged_threads', (select count(*) from public.relay_threads where university_id = v_university and flagged),
    'blocks_7d', (select count(*) from public.blocks where university_id = v_university and created_at > now() - interval '7 days'),
    'digest_runs', (select coalesce(jsonb_agg(jsonb_build_object('at', created_at, 'recipients', recipients, 'sent', sent, 'skipped', skipped) order by created_at desc), '[]'::jsonb) from (select * from public.digest_runs where university_id = v_university order by created_at desc limit 5) d),
    'generated_at', now());
end;
$$;
grant execute on function public.admin_campus_stats() to authenticated;

-- Lift suspensions that have passed; called with the expiry sweep.
create or replace function app.restore_suspensions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.memberships set status = 'active', suspended_until = null, status_reason = null
  where status = 'suspended' and suspended_until is not null and suspended_until < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.run_maintenance()
returns jsonb
language sql
security definer
set search_path = public
as $$ select jsonb_build_object('expired', app.expire_posts(), 'restored', app.restore_suspensions()) $$;
revoke all on function public.run_maintenance() from public;
grant execute on function public.run_maintenance() to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'campus-wide-restore-suspensions';
    perform cron.schedule('campus-wide-restore-suspensions', '5 6 * * *', 'select app.restore_suspensions()');
  end if;
end;
$$;

-- Blocks: three blocks from different people in a week open a moderator review (pilot §4).
create or replace function app.after_block_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_mod uuid;
begin
  select count(distinct blocker_id) into v_count from public.blocks b where b.blocked_id = new.blocked_id and b.created_at > now() - interval '7 days';
  if v_count = 3 then
    for v_mod in select app.moderator_ids(new.university_id) loop
      perform app.notify(v_mod, 'moderation', null, 'profile', new.blocked_id, 'Pattern: three blocks in a week', 'Three different people blocked the same member this week. Have a look.', '/mod');
    end loop;
    perform app.log_audit('block.pattern', 'profile', new.blocked_id, jsonb_build_object('blocks_7d', v_count));
  end if;
  return null;
end;
$$;
create trigger blocks_after_insert after insert on public.blocks
  for each row execute function app.after_block_insert();
