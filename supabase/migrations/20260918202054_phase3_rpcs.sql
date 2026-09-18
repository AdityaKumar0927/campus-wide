-- Phase 3 RPCs, expiry, storage bucket.

-- Accept an answer: only the question author; one accepted answer per post; helped_count for the answerer.
create or replace function public.accept_answer(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment public.comments%rowtype;
  v_post public.posts%rowtype;
  v_previous uuid;
begin
  select * into v_comment from public.comments c where c.id = p_comment_id and c.status = 'active';
  if v_comment.id is null then raise exception 'answer not found' using errcode = '22023'; end if;
  select * into v_post from public.posts p where p.id = v_comment.post_id for update;
  if v_post.author_id <> auth.uid() then raise exception 'only the author can accept an answer' using errcode = '42501'; end if;
  if v_post.type <> 'question' then raise exception 'only questions have accepted answers' using errcode = '22023'; end if;
  if app.is_blocked_either_way(v_comment.author_id) then raise exception 'answer not found' using errcode = '22023'; end if;

  perform set_config('app.definer', 'on', true);
  v_previous := v_post.accepted_comment_id;
  if v_previous is not null and v_previous <> p_comment_id then
    update public.comments set is_accepted = false where id = v_previous;
    update public.profiles set helped_count = greatest(0, helped_count - 1) where user_id = (select author_id from public.comments where id = v_previous);
  end if;
  update public.comments set is_accepted = true where id = p_comment_id;
  update public.posts set accepted_comment_id = p_comment_id, status = 'resolved', resolved_at = now(), last_activity_at = now() where id = v_post.id;
  if v_previous is distinct from p_comment_id then
    update public.profiles set helped_count = helped_count + 1 where user_id = v_comment.author_id;
    perform app.notify(v_comment.author_id, 'accepted', auth.uid(), 'post', v_post.id,
      'Your answer was accepted', left(v_post.title, 140), '/p/' || v_post.id || '#c-' || p_comment_id);
  end if;
  perform app.log_audit('answer.accepted', 'comment', p_comment_id, jsonb_build_object('post_id', v_post.id));
end;
$$;
grant execute on function public.accept_answer(uuid) to authenticated;

-- Toggle a thank-you; returns true when added.
create or replace function public.toggle_thanks(p_target_type public.reaction_target, p_target_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.reactions r where r.user_id = auth.uid() and r.target_type = p_target_type and r.target_id = p_target_id and r.kind = 'thanks';
  get diagnostics v_deleted = row_count;
  if v_deleted > 0 then
    return false;
  end if;
  insert into public.reactions (university_id, user_id, target_type, target_id, kind)
  values (app.current_university_id(), auth.uid(), p_target_type, p_target_id, 'thanks');
  return true;
end;
$$;
grant execute on function public.toggle_thanks(public.reaction_target, uuid) to authenticated;

-- Full-text search inside the caller's campus (RLS applies: security invoker).
create or replace function public.search_posts(q text, p_limit integer default 20)
returns setof public.posts
language sql
stable
security invoker
set search_path = public
as $$
  select p.*
  from public.posts p
  where p.search @@ websearch_to_tsquery('english', q)
    and p.status in ('active', 'resolved')
  order by ts_rank_cd(p.search, websearch_to_tsquery('english', q)) desc, p.created_at desc
  limit least(greatest(p_limit, 1), 50)
$$;
grant execute on function public.search_posts(text, integer) to authenticated;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.notifications n
     set read_at = now()
   where n.user_id = auth.uid() and n.read_at is null and (p_ids is null or n.id = any(p_ids));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

create or replace function public.unread_notification_count()
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::integer from public.notifications n where n.user_id = auth.uid() and n.read_at is null
$$;
grant execute on function public.unread_notification_count() to authenticated;

-- Expiry sweeper (scheduled with pg_cron in Phase 4; callable by the service role until then).
create or replace function app.expire_posts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  perform set_config('app.definer', 'on', true);
  update public.posts set status = 'expired' where status = 'active' and expires_at is not null and expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function app.expire_posts() from public;
grant execute on function app.expire_posts() to service_role;

-- Post images: public-read bucket with unguessable paths; uploads only under the caller's campus folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "post_images_public_read" on storage.objects for select to public using (bucket_id = 'post-images');
create policy "post_images_member_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and app.can_post() and (storage.foldername(name))[1] = app.current_university_id()::text and owner_id::uuid = auth.uid());
create policy "post_images_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and owner_id::uuid = auth.uid());
