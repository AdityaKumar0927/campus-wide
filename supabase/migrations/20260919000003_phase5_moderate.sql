-- Phase 5: moderation actions with a statement of reasons. Humans only; nothing here is automatic.

create or replace function app.apply_effect(p_kind public.moderation_kind, p_target_type public.report_target, p_target_id uuid, p_subject uuid, p_university uuid, p_days integer, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.definer', 'on', true);
  perform set_config('app.identity_update', 'on', true);
  if p_kind in ('hide', 'remove') then
    if p_target_type = 'post' then update public.posts set status = 'removed' where id = p_target_id and university_id = p_university; end if;
    if p_target_type = 'comment' then update public.comments set status = 'removed' where id = p_target_id and university_id = p_university; end if;
    if p_target_type = 'thread' then update public.relay_threads set state = 'closed' where id = p_target_id and university_id = p_university; end if;
  elsif p_kind = 'restore' then
    if p_target_type = 'post' then update public.posts set status = 'active' where id = p_target_id and university_id = p_university; end if;
    if p_target_type = 'comment' then update public.comments set status = 'active' where id = p_target_id and university_id = p_university; end if;
    if p_subject is not null then update public.memberships set status = 'active', suspended_until = null, status_reason = null where user_id = p_subject and university_id = p_university and status in ('suspended', 'banned'); end if;
  elsif p_kind = 'suspend' then
    update public.memberships set status = 'suspended', suspended_until = now() + make_interval(days => coalesce(p_days, 7)), status_reason = p_reason where user_id = p_subject and university_id = p_university;
  elsif p_kind = 'ban' then
    update public.memberships set status = 'banned', suspended_until = null, status_reason = p_reason where user_id = p_subject and university_id = p_university;
  elsif p_kind = 'privacy_mode' then
    update public.profiles set privacy_mode = true where user_id = p_subject and university_id = p_university;
  end if;
  perform set_config('app.definer', 'off', true);
  perform set_config('app.identity_update', 'off', true);
end;
$$;

create or replace function public.moderate(p_report_id uuid, p_target_type public.report_target, p_target_id uuid, p_subject uuid, p_kind public.moderation_kind, p_facts text, p_ground text, p_days integer default null, p_redress text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_university uuid := app.current_university_id();
  v_action uuid;
  v_statement jsonb;
  v_title text;
begin
  if not app.has_role('moderator') then raise exception 'moderators only' using errcode = '42501'; end if;
  if p_subject = auth.uid() then raise exception 'you cannot moderate yourself' using errcode = '22023'; end if;
  if p_kind <> 'dismiss' and (length(coalesce(p_facts, '')) < 10 or length(coalesce(p_ground, '')) < 3) then
    raise exception 'a statement of reasons needs facts and a ground' using errcode = '22023';
  end if;
  v_statement := jsonb_build_object(
    'facts', p_facts, 'ground', p_ground, 'automated', false,
    'redress', coalesce(p_redress, 'You can appeal once, within 14 days, from the notice in your inbox. A different moderator decides.'),
    'issued_at', now(), 'duration_days', p_days);

  perform app.apply_effect(p_kind, p_target_type, p_target_id, p_subject, v_university, p_days, p_ground);

  insert into public.moderation_actions (university_id, report_id, moderator_id, subject_id, target_type, target_id, kind, statement_of_reasons, expires_at)
  values (v_university, p_report_id, auth.uid(), p_subject, p_target_type, p_target_id, p_kind, v_statement, case when p_kind = 'suspend' then now() + make_interval(days => coalesce(p_days, 7)) end)
  returning id into v_action;

  if p_report_id is not null then
    update public.reports set status = case when p_kind = 'dismiss' then 'dismissed' else 'actioned' end::public.report_status, resolved_at = now(), assigned_to = auth.uid()
    where id = p_report_id and university_id = v_university;
  end if;

  if p_kind <> 'dismiss' and p_subject is not null then
    v_title := case p_kind
      when 'hide' then 'A notice of yours was hidden'
      when 'remove' then 'A notice of yours was removed'
      when 'warn' then 'A warning from the moderators'
      when 'suspend' then 'Your account is suspended for ' || coalesce(p_days, 7) || ' days'
      when 'ban' then 'Your account has been banned'
      when 'restore' then 'A moderation decision was reversed'
      when 'privacy_mode' then 'Privacy mode was switched on for you'
      else 'A moderation decision' end;
    perform app.notify(p_subject, 'moderation', null, 'moderation_action', v_action, v_title, left(p_facts, 300), '/appeals/' || v_action);
  end if;
  perform app.log_audit('moderation.' || p_kind::text, p_target_type::text, p_target_id, jsonb_build_object('action_id', v_action, 'report_id', p_report_id, 'subject', p_subject));
  return v_action;
end;
$$;
grant execute on function public.moderate(uuid, public.report_target, uuid, uuid, public.moderation_kind, text, text, integer, text) to authenticated;
