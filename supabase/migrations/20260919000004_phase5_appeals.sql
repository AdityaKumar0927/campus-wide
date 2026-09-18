-- Phase 5: appeals, decided by a different moderator (or an admin).

create or replace function public.appeal(p_action_id uuid, p_text text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action public.moderation_actions%rowtype;
  v_id uuid;
  v_mod uuid;
begin
  select * into v_action from public.moderation_actions a where a.id = p_action_id;
  if v_action.id is null or v_action.subject_id <> auth.uid() then raise exception 'not your decision to appeal' using errcode = '42501'; end if;
  if v_action.reversed_at is not null then raise exception 'already reversed' using errcode = '22023'; end if;
  if v_action.created_at < now() - interval '14 days' then raise exception 'the appeal window has closed' using errcode = '22023'; end if;
  insert into public.appeals (university_id, action_id, appellant_id, text) values (v_action.university_id, p_action_id, auth.uid(), p_text) returning id into v_id;
  for v_mod in select app.moderator_ids(v_action.university_id) loop
    if v_mod <> v_action.moderator_id then
      perform app.notify(v_mod, 'moderation', null, 'appeal', v_id, 'An appeal to review', left(p_text, 200), '/mod/appeals');
    end if;
  end loop;
  perform app.log_audit('appeal.filed', 'moderation_action', p_action_id, jsonb_build_object('appeal_id', v_id));
  return v_id;
end;
$$;
grant execute on function public.appeal(uuid, text) to authenticated;

create or replace function public.decide_appeal(p_appeal_id uuid, p_outcome public.appeal_status, p_reasons text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appeal public.appeals%rowtype;
  v_action public.moderation_actions%rowtype;
begin
  if not app.has_role('moderator') then raise exception 'moderators only' using errcode = '42501'; end if;
  select * into v_appeal from public.appeals a where a.id = p_appeal_id and a.status = 'open';
  if v_appeal.id is null then raise exception 'appeal not found' using errcode = '22023'; end if;
  select * into v_action from public.moderation_actions a where a.id = v_appeal.action_id;
  if v_action.moderator_id = auth.uid() and not app.has_role('university_admin') then
    raise exception 'a different moderator must decide' using errcode = '42501';
  end if;
  if p_outcome not in ('upheld', 'overturned') or length(coalesce(p_reasons, '')) < 10 then raise exception 'give a decision and reasons' using errcode = '22023'; end if;
  update public.appeals set status = p_outcome, reviewed_by = auth.uid(), decision_reasons = p_reasons, resolved_at = now() where id = p_appeal_id;
  if p_outcome = 'overturned' then
    perform app.apply_effect('restore', v_action.target_type, v_action.target_id, v_action.subject_id, v_action.university_id, null, null);
    update public.moderation_actions set reversed_at = now(), reversed_by = auth.uid() where id = v_action.id;
  end if;
  perform app.notify(v_appeal.appellant_id, 'moderation', null, 'appeal', p_appeal_id,
    case when p_outcome = 'overturned' then 'Your appeal succeeded' else 'Your appeal was reviewed and the decision stands' end, left(p_reasons, 300), '/appeals/' || v_action.id);
  perform app.log_audit('appeal.' || p_outcome::text, 'appeal', p_appeal_id, jsonb_build_object('action_id', v_action.id));
end;
$$;
grant execute on function public.decide_appeal(uuid, public.appeal_status, text) to authenticated;
