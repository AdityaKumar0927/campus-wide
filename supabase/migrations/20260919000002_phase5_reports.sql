-- Phase 5: notice-and-action reports with evidence snapshots (DSA Art. 16), moderation with a
-- statement of reasons (Art. 17). All writes go through these functions.

create or replace function app.moderator_ids(p_university uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.user_id from public.memberships m
  where m.university_id = p_university and m.status = 'active' and m.campus_role in ('moderator', 'university_admin')
$$;

create or replace function app.handles(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select jsonb_build_object('user_id', p.user_id, 'campus_username', p.campus_username, 'display_name', p.display_name) from public.profiles p where p.user_id = p_user), '{}'::jsonb)
$$;

create or replace function public.file_report(p_target_type public.report_target, p_target_id uuid, p_category public.report_category, p_note text default null, p_escalation boolean default false)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_university uuid := app.current_university_id();
  v_subject uuid;
  v_evidence jsonb := '{}'::jsonb;
  v_case text := 'CW-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
  v_id uuid;
  v_mod uuid;
  v_thread public.relay_threads%rowtype;
begin
  if auth.uid() is null or v_university is null then raise exception 'not signed in' using errcode = '28000'; end if;
  perform app.check_rate_limit('report', 10, 86400);

  if p_target_type = 'post' then
    select p.author_id, jsonb_build_object('post', jsonb_build_object('id', p.id, 'type', p.type, 'title', p.title, 'body', p.body, 'payload', p.payload, 'images', p.images, 'status', p.status, 'created_at', p.created_at))
      into v_subject, v_evidence from public.posts p where p.id = p_target_id and p.university_id = v_university;
  elsif p_target_type = 'comment' then
    select c.author_id, jsonb_build_object('comment', jsonb_build_object('id', c.id, 'body', c.body, 'status', c.status, 'created_at', c.created_at, 'post_id', c.post_id, 'post_title', (select title from public.posts where id = c.post_id)))
      into v_subject, v_evidence from public.comments c where c.id = p_target_id and c.university_id = v_university;
  elsif p_target_type = 'thread' then
    select * into v_thread from public.relay_threads t where t.id = p_target_id and t.university_id = v_university and (t.initiator_id = auth.uid() or t.owner_id = auth.uid());
    if v_thread.id is not null then
      v_subject := case when v_thread.initiator_id = auth.uid() then v_thread.owner_id else v_thread.initiator_id end;
      v_evidence := jsonb_build_object('thread', public.export_relay_thread(v_thread.id));
    end if;
  elsif p_target_type = 'profile' then
    select p.user_id, jsonb_build_object('profile', app.handles(p.user_id)) into v_subject, v_evidence from public.profiles p where p.user_id = p_target_id and p.university_id = v_university;
  end if;
  if v_evidence = '{}'::jsonb then raise exception 'target not found' using errcode = '22023'; end if;
  if v_subject = auth.uid() then raise exception 'you cannot report yourself' using errcode = '22023'; end if;

  v_evidence := v_evidence || jsonb_build_object(
    'reporter', app.handles(auth.uid()),
    'subject', app.handles(v_subject),
    'reporter_blocked_subject', exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = v_subject),
    'reporter_muted_subject', exists (select 1 from public.mutes m where m.muter_id = auth.uid() and m.muted_id = v_subject),
    'urgent', p_category in ('harassment', 'stalking'),
    'captured_at', now());

  insert into public.reports (university_id, case_number, reporter_id, subject_id, target_type, target_id, category, note, evidence, escalation_consent)
  values (v_university, v_case, auth.uid(), v_subject, p_target_type, p_target_id, p_category, left(p_note, 4000), v_evidence, coalesce(p_escalation, false))
  returning id into v_id;

  for v_mod in select app.moderator_ids(v_university) loop
    perform app.notify(v_mod, 'moderation', null, 'report', v_id, 'New report ' || v_case || case when p_category in ('harassment', 'stalking') then ' (urgent)' else '' end, initcap(replace(p_category::text, '_', ' ')), '/mod/reports/' || v_id);
  end loop;
  perform app.log_audit('report.filed', 'report', v_id, jsonb_build_object('category', p_category, 'target_type', p_target_type));
  return v_case;
end;
$$;
grant execute on function public.file_report(public.report_target, uuid, public.report_category, text, boolean) to authenticated;
