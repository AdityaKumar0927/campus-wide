-- Phase 4 RPCs and the expiry schedule.

-- Poll tallies without exposing who voted what.
create or replace function public.poll_results(p_post_id uuid)
returns table (option_index integer, votes integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.posts p where p.id = p_post_id and p.university_id = app.current_university_id()) then
    return;
  end if;
  return query
    select o::integer, count(*)::integer
    from public.poll_votes v, unnest(v.options) o
    where v.post_id = p_post_id
    group by o
    order by o;
end;
$$;
grant execute on function public.poll_results(uuid) to authenticated;

create or replace function public.cast_poll_vote(p_post_id uuid, p_options integer[])
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.poll_votes (university_id, post_id, user_id, options)
  values (app.current_university_id(), p_post_id, auth.uid(), p_options)
  on conflict (post_id, user_id) do update set options = excluded.options, updated_at = now()
$$;
grant execute on function public.cast_poll_vote(uuid, integer[]) to authenticated;

-- The other party's address, only after both sides opted in. Never readable any other way.
create or replace function public.relay_contact(p_thread_id uuid)
returns table (display_name text, campus_username text, email text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_thread public.relay_threads%rowtype;
  v_other uuid;
begin
  select * into v_thread from public.relay_threads t where t.id = p_thread_id;
  if v_thread.id is null or auth.uid() not in (v_thread.initiator_id, v_thread.owner_id) then
    return;
  end if;
  v_other := case when auth.uid() = v_thread.initiator_id then v_thread.owner_id else v_thread.initiator_id end;
  return query
    select p.display_name, p.campus_username,
           case when v_thread.initiator_share_email and v_thread.owner_share_email then u.email else null end
    from public.profiles p
    join public.users u on u.id = p.user_id
    where p.user_id = v_other;
end;
$$;
grant execute on function public.relay_contact(uuid) to authenticated;

-- Everything a participant may need to hand to Public Safety: the thread, both handles, timestamps.
create or replace function public.export_relay_thread(p_thread_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_thread public.relay_threads%rowtype;
begin
  select * into v_thread from public.relay_threads t where t.id = p_thread_id;
  if v_thread.id is null or (auth.uid() not in (v_thread.initiator_id, v_thread.owner_id) and not app.has_role('moderator')) then
    return null;
  end if;
  return jsonb_build_object(
    'thread_id', v_thread.id,
    'post', (select jsonb_build_object('id', p.id, 'type', p.type, 'title', p.title, 'created_at', p.created_at) from public.posts p where p.id = v_thread.post_id),
    'participants', (select jsonb_agg(jsonb_build_object('user_id', p.user_id, 'campus_username', p.campus_username, 'display_name', p.display_name)) from public.profiles p where p.user_id in (v_thread.initiator_id, v_thread.owner_id)),
    'state', v_thread.state,
    'flagged', v_thread.flagged,
    'exported_at', now(),
    'exported_by', auth.uid(),
    'messages', (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'sender_id', m.sender_id, 'body', m.body, 'flagged_words', m.flagged_words, 'created_at', m.created_at) order by m.created_at), '[]'::jsonb) from public.relay_messages m where m.thread_id = v_thread.id)
  );
end;
$$;
grant execute on function public.export_relay_thread(uuid) to authenticated;

-- Service-role wrapper so the Vercel cron can sweep expiries when pg_cron is unavailable.
create or replace function public.run_expire_posts()
returns integer
language sql
security definer
set search_path = public
as $$ select app.expire_posts() $$;
revoke all on function public.run_expire_posts() from public;
grant execute on function public.run_expire_posts() to service_role;

-- pg_cron: hourly expiry sweep. Guarded so environments without the extension still migrate.
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron not available here: %', sqlerrm;
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'campus-wide-expire-posts';
    perform cron.schedule('campus-wide-expire-posts', '15 * * * *', 'select app.expire_posts()');
  end if;
end;
$$;

-- Term label for the app (meal-plan attestation is per term).
create or replace function public.current_term()
returns text
language sql
stable
as $$ select app.current_term() $$;
grant execute on function public.current_term() to authenticated, anon;
