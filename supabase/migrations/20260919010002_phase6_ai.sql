-- Phase 6: duplicate-question matching, and a rate-limit wrapper for the optional server AI.

-- Nearest open or answered questions on the caller's campus (RLS applies: security invoker).
create or replace function public.match_questions(p_embedding extensions.vector(384), p_limit integer default 3, p_exclude uuid default null)
returns table (id uuid, title text, status public.post_status, comment_count integer, accepted_comment_id uuid, similarity double precision)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select p.id, p.title, p.status, p.comment_count, p.accepted_comment_id, 1 - (p.embedding <=> p_embedding) as similarity
  from public.posts p
  where p.type = 'question'
    and p.status in ('active', 'resolved')
    and p.embedding is not null
    and (p_exclude is null or p.id <> p_exclude)
  order by p.embedding <=> p_embedding
  limit least(greatest(p_limit, 1), 10)
$$;
grant execute on function public.match_questions(extensions.vector(384), integer, uuid) to authenticated;

-- Server-side AI calls count against a daily quota per member (labels and summaries only).
create or replace function public.take_rate_limit(p_action text, p_max integer, p_window_seconds integer)
returns void
language sql
security definer
set search_path = public
as $$ select app.check_rate_limit(p_action, p_max, p_window_seconds) $$;
grant execute on function public.take_rate_limit(text, integer, integer) to authenticated;

-- Moderators may attach triage labels to a report (suggestions only).
create or replace function public.set_report_triage(p_report_id uuid, p_triage jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app.has_role('moderator') then raise exception 'moderators only' using errcode = '42501'; end if;
  update public.reports set triage = p_triage where id = p_report_id and university_id = app.current_university_id();
end;
$$;
grant execute on function public.set_report_triage(uuid, jsonb) to authenticated;
