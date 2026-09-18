-- Phase 3 counters and notification fan-out.

create or replace function app.after_comment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev text := coalesce(current_setting('app.definer', true), '');
  v_post public.posts%rowtype;
  v_parent_author uuid;
  v_actor_name text;
begin
  perform set_config('app.definer', 'on', true);
  select * into v_post from public.posts p where p.id = coalesce(new.post_id, old.post_id);
  update public.posts p
     set comment_count = (select count(*) from public.comments c where c.post_id = p.id and c.status = 'active'),
         last_activity_at = case when tg_op = 'INSERT' then now() else p.last_activity_at end
   where p.id = v_post.id;

  if tg_op = 'INSERT' then
    select pr.display_name into v_actor_name from public.profiles pr where pr.user_id = new.author_id;
    perform app.notify(
      v_post.author_id,
      case when v_post.type = 'question' then 'answer' else 'comment' end::public.notification_kind,
      new.author_id, 'post', v_post.id,
      coalesce(v_actor_name, 'Someone') || case when v_post.type = 'question' then ' answered your question' else ' replied to your notice' end,
      left(new.body, 140),
      '/p/' || v_post.id || '#c-' || new.id);
    if new.parent_id is not null then
      select c.author_id into v_parent_author from public.comments c where c.id = new.parent_id;
      if v_parent_author is not null and v_parent_author <> v_post.author_id then
        perform app.notify(v_parent_author, 'comment', new.author_id, 'comment', new.id,
          coalesce(v_actor_name, 'Someone') || ' replied to you', left(new.body, 140), '/p/' || v_post.id || '#c-' || new.id);
      end if;
    end if;
  end if;
  perform set_config('app.definer', v_prev, true);
  return null;
end;
$$;
create trigger comments_after_change after insert or update of status on public.comments
  for each row execute function app.after_comment_change();

-- Reactions: verify the target is on the caller's campus, roll up counters, tell the recipient.
create or replace function app.before_reaction_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_university uuid;
begin
  if new.target_type = 'post' then
    select p.university_id into v_university from public.posts p where p.id = new.target_id and p.status in ('active', 'resolved', 'expired');
  else
    select c.university_id into v_university from public.comments c where c.id = new.target_id and c.status = 'active';
  end if;
  if v_university is null then
    raise exception 'target not found' using errcode = '22023';
  end if;
  if auth.uid() is not null then
    new.user_id := auth.uid();
    perform app.check_rate_limit('reaction', 60, 3600);
  end if;
  new.university_id := v_university;
  new.created_at := now();
  return new;
end;
$$;
create trigger reactions_before_insert before insert on public.reactions
  for each row execute function app.before_reaction_insert();

create or replace function app.after_reaction_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev text := coalesce(current_setting('app.definer', true), '');
  r public.reactions%rowtype;
  v_delta integer := case when tg_op = 'INSERT' then 1 else -1 end;
  v_author uuid;
  v_post uuid;
  v_title text;
  v_actor_name text;
begin
  perform set_config('app.definer', 'on', true);
  if tg_op = 'INSERT' then r := new; else r := old; end if;
  if r.target_type = 'post' then
    update public.posts p set thanks_count = greatest(0, p.thanks_count + v_delta) where p.id = r.target_id
      returning p.author_id, p.id, p.title into v_author, v_post, v_title;
  else
    update public.comments c set thanks_count = greatest(0, c.thanks_count + v_delta) where c.id = r.target_id
      returning c.author_id, c.post_id into v_author, v_post;
  end if;
  if v_author is not null then
    update public.profiles pr set thanks_count = greatest(0, pr.thanks_count + v_delta) where pr.user_id = v_author;
    if tg_op = 'INSERT' then
      select pr.display_name into v_actor_name from public.profiles pr where pr.user_id = r.user_id;
      perform app.notify(v_author, 'thanks', r.user_id, r.target_type::text, r.target_id,
        coalesce(v_actor_name, 'Someone') || ' thanked you', coalesce(v_title, 'For your answer'), '/p/' || v_post);
    end if;
  end if;
  perform set_config('app.definer', v_prev, true);
  return null;
end;
$$;
create trigger reactions_after_change after insert or delete on public.reactions
  for each row execute function app.after_reaction_change();

-- Only read_at may change from the inbox.
create or replace function app.protect_notification()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.user_id := old.user_id;
    new.university_id := old.university_id;
    new.kind := old.kind;
    new.actor_id := old.actor_id;
    new.target_type := old.target_type;
    new.target_id := old.target_id;
    new.title := old.title;
    new.body := old.body;
    new.href := old.href;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
create trigger notifications_protect before update on public.notifications
  for each row execute function app.protect_notification();

create or replace function app.after_space_membership_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.spaces s
     set member_count = (select count(*) from public.space_memberships sm where sm.space_id = s.id)
   where s.id = coalesce(new.space_id, old.space_id);
  return null;
end;
$$;
create trigger space_memberships_after_change after insert or delete on public.space_memberships
  for each row execute function app.after_space_membership_change();

create trigger spaces_touch before update on public.spaces for each row execute function app.touch_updated_at();

-- Realtime for the inbox only (RLS applies: a user receives their own rows).
alter publication supabase_realtime add table public.notifications;
