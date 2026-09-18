-- Phase 4 relay: double-blind threads, one-message rule, payment-word flags, mutual reveal.

create or replace function app.before_relay_thread_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts%rowtype;
begin
  select * into v_post from public.posts p where p.id = new.post_id;
  if v_post.id is null or v_post.status not in ('active', 'resolved') then
    raise exception 'this notice is not open' using errcode = '22023';
  end if;
  if v_post.type in ('question', 'poll') then
    raise exception 'this notice has no contact tabs' using errcode = '22023';
  end if;
  if auth.uid() is not null then
    new.initiator_id := auth.uid();
    perform app.check_rate_limit('thread', case when app.account_age_days() < 7 then 5 else 20 end, 86400);
  end if;
  if new.initiator_id = v_post.author_id then
    raise exception 'you cannot take a tab from your own notice' using errcode = '22023';
  end if;
  if app.is_blocked_either_way(v_post.author_id) then
    raise exception 'this notice is not open' using errcode = '22023';
  end if;
  new.owner_id := v_post.author_id;
  new.university_id := v_post.university_id;
  new.state := 'open';
  new.initiator_share_email := false;
  new.owner_share_email := false;
  new.initiator_confirmed_at := null;
  new.owner_confirmed_at := null;
  new.message_count := 0;
  new.flagged := false;
  new.last_message_at := null;
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;
create trigger relay_threads_before_insert before insert on public.relay_threads
  for each row execute function app.before_relay_thread_insert();

-- Participants may only flip their own share switch, confirm once, or close. Everything else is fixed.
create or replace function app.protect_relay_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_definer boolean := coalesce(current_setting('app.definer', true), '') = 'on';
  v_prev text := coalesce(current_setting('app.definer', true), '');
begin
  new.updated_at := now();
  if v_definer or v_actor is null then
    return new;
  end if;
  new.post_id := old.post_id;
  new.university_id := old.university_id;
  new.initiator_id := old.initiator_id;
  new.owner_id := old.owner_id;
  new.message_count := old.message_count;
  new.last_message_at := old.last_message_at;
  new.flagged := old.flagged;
  new.created_at := old.created_at;
  if v_actor = old.initiator_id then
    new.owner_share_email := old.owner_share_email;
    new.owner_confirmed_at := old.owner_confirmed_at;
    if old.initiator_confirmed_at is not null then new.initiator_confirmed_at := old.initiator_confirmed_at; end if;
  else
    new.initiator_share_email := old.initiator_share_email;
    new.initiator_confirmed_at := old.initiator_confirmed_at;
    if old.owner_confirmed_at is not null then new.owner_confirmed_at := old.owner_confirmed_at; end if;
  end if;
  if new.state is distinct from old.state then
    if old.state = 'completed' or new.state <> 'closed' then
      new.state := old.state;
    end if;
  end if;
  if new.initiator_confirmed_at is not null and new.owner_confirmed_at is not null and old.state <> 'completed' then
    new.state := 'completed';
    perform set_config('app.identity_update', 'on', true);
    update public.profiles set helped_count = helped_count + 1 where user_id = old.owner_id;
    perform set_config('app.identity_update', 'off', true);
    perform app.notify(old.owner_id, 'system', old.initiator_id, 'thread', old.id, 'It happened: you helped someone', null, '/t/' || old.id);
  end if;
  return new;
end;
$$;
create trigger relay_threads_protect before update on public.relay_threads
  for each row execute function app.protect_relay_thread();

create or replace function app.before_relay_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread public.relay_threads%rowtype;
  v_other uuid;
begin
  select * into v_thread from public.relay_threads t where t.id = new.thread_id;
  if v_thread.id is null or v_thread.state <> 'open' then
    raise exception 'this thread is closed' using errcode = '22023';
  end if;
  if auth.uid() is not null then
    new.sender_id := auth.uid();
    perform app.check_rate_limit('message', 60, 3600);
  end if;
  v_other := case when new.sender_id = v_thread.initiator_id then v_thread.owner_id else v_thread.initiator_id end;
  if app.is_blocked_either_way(v_other) then
    raise exception 'this thread is closed' using errcode = '22023';
  end if;
  -- One-message rule for strangers: the opener gets one message until the owner replies.
  if new.sender_id = v_thread.initiator_id and v_thread.message_count >= 1
     and not exists (select 1 from public.relay_messages m where m.thread_id = v_thread.id and m.sender_id = v_thread.owner_id) then
    raise exception 'wait_for_reply: one message until they answer' using errcode = '22023';
  end if;
  new.university_id := v_thread.university_id;
  new.flagged_words := app.payment_words(new.body);
  new.created_at := now();
  return new;
end;
$$;
create trigger relay_messages_before_insert before insert on public.relay_messages
  for each row execute function app.before_relay_message_insert();

create or replace function app.after_relay_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread public.relay_threads%rowtype;
  v_other uuid;
  v_title text;
  v_prev text := coalesce(current_setting('app.definer', true), '');
begin
  select * into v_thread from public.relay_threads t where t.id = new.thread_id;
  perform set_config('app.definer', 'on', true);
  update public.relay_threads
     set message_count = message_count + 1,
         last_message_at = new.created_at,
         flagged = flagged or array_length(new.flagged_words, 1) is not null
   where id = new.thread_id;
  perform set_config('app.definer', v_prev, true);
  v_other := case when new.sender_id = v_thread.initiator_id then v_thread.owner_id else v_thread.initiator_id end;
  select p.title into v_title from public.posts p where p.id = v_thread.post_id;
  perform app.notify(v_other, 'relay', new.sender_id, 'thread', v_thread.id, 'New message about ' || coalesce(left(v_title, 80), 'your notice'), left(new.body, 140), '/t/' || v_thread.id);
  return null;
end;
$$;
create trigger relay_messages_after_insert after insert on public.relay_messages
  for each row execute function app.after_relay_message_insert();
