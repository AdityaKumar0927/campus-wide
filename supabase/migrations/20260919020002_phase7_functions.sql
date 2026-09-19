-- Phase 7: account deletion with a 30-day grace, re-consent, and the push webhook.

-- Deletion: soft at once, purged after 30 days. Signing in and cancelling restores everything.
create or replace function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_when timestamptz := now() + interval '30 days';
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '28000'; end if;
  insert into public.deletion_requests (user_id, scheduled_for) values (auth.uid(), v_when)
  on conflict (user_id) do update set requested_at = now(), scheduled_for = v_when, cancelled_at = null, purged_at = null;
  update public.users set deleted_at = now(), updated_at = now() where id = auth.uid();
  update public.memberships set status = 'suspended', status_reason = 'deletion requested', suspended_until = v_when where user_id = auth.uid();
  perform app.log_audit('account.deletion_requested', 'user', auth.uid(), jsonb_build_object('scheduled_for', v_when));
  return v_when;
end;
$$;
grant execute on function public.request_account_deletion() to authenticated;

create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '28000'; end if;
  update public.deletion_requests set cancelled_at = now() where user_id = auth.uid() and purged_at is null;
  update public.users set deleted_at = null, updated_at = now() where id = auth.uid();
  update public.memberships set status = 'active', status_reason = null, suspended_until = null where user_id = auth.uid() and status_reason = 'deletion requested';
  perform app.log_audit('account.deletion_cancelled', 'user', auth.uid());
end;
$$;
grant execute on function public.cancel_account_deletion() to authenticated;

-- Purge: identity gone, content anonymised, reported threads kept under the pseudonymous id (pilot §7).
create or replace function app.purge_deleted_accounts()
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  perform set_config('app.definer', 'on', true);
  perform set_config('app.identity_update', 'on', true);
  for r in select d.user_id from public.deletion_requests d where d.purged_at is null and d.cancelled_at is null and d.scheduled_for < now() loop
    update public.posts set author_id = null where author_id = r.user_id;
    update public.comments set author_id = null where author_id = r.user_id;
    update public.profiles set display_name = 'Former member', initials = '', campus_username = 'deleted-' || left(replace(r.user_id::text, '-', ''), 8), bio = null, privacy_mode = true,
      meal_plan_attested_term = null, meal_plan_attested_at = null where user_id = r.user_id;
    update public.users set email = 'deleted-' || replace(r.user_id::text, '-', '') || '@invalid.campus-wide', email_domain = 'invalid.campus-wide',
      campus_username = 'deleted-' || left(replace(r.user_id::text, '-', ''), 8), declared_given_name = null, declared_family_name = null, updated_at = now() where id = r.user_id;
    delete from public.blocks where blocker_id = r.user_id or blocked_id = r.user_id;
    delete from public.mutes where muter_id = r.user_id or muted_id = r.user_id;
    delete from public.notifications where user_id = r.user_id;
    delete from public.push_subscriptions where user_id = r.user_id;
    delete from public.space_memberships where user_id = r.user_id;
    delete from public.post_participants where user_id = r.user_id;
    delete from public.poll_votes where user_id = r.user_id;
    delete from public.reactions where user_id = r.user_id;
    update public.memberships set status = 'banned', status_reason = 'account deleted' where user_id = r.user_id;
    update public.deletion_requests set purged_at = now() where user_id = r.user_id;
    perform app.log_audit('account.purged', 'user', r.user_id);
    return next r.user_id;
  end loop;
  perform set_config('app.definer', 'off', true);
  perform set_config('app.identity_update', 'off', true);
end;
$$;

create or replace function public.run_maintenance()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'expired', app.expire_posts(),
    'restored', app.restore_suspensions(),
    'purged', coalesce((select jsonb_agg(u) from app.purge_deleted_accounts() u), '[]'::jsonb))
$$;
revoke all on function public.run_maintenance() from public;
grant execute on function public.run_maintenance() to service_role;

-- Re-consent: only the newest version of each required policy counts. Superseded versions are never
-- asked for again, so accepting the current text always clears the list.
create or replace function public.pending_consents()
returns table (id uuid, slug text, version text, title text, summary text)
language sql
stable
security invoker
set search_path = public
as $$
  select latest.id, latest.slug, latest.version, latest.title, latest.summary
  from (
    select distinct on (pv.slug) pv.id, pv.slug, pv.version, pv.title, pv.summary
    from public.policy_versions pv
    where pv.required
      and (pv.university_id is null or pv.university_id = app.current_university_id())
      and pv.effective_at <= now()
      and pv.slug <> 'meal-sharing'
    order by pv.slug, pv.effective_at desc
  ) latest
  where not exists (
    select 1 from public.consent_records c
    where c.user_id = auth.uid() and c.policy_version_id = latest.id and c.accepted
  )
  order by latest.slug
$$;
grant execute on function public.pending_consents() to authenticated;
