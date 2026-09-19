-- Phase 7: hand new notifications to the app for Web Push, through pg_net when it is available.
do $$
begin
  begin
    create extension if not exists pg_net with schema extensions;
  exception when others then
    raise notice 'pg_net not available here: %', sqlerrm;
  end;
end;
$$;

create or replace function app.after_notification_insert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_secret text;
begin
  select value into v_url from public.platform_settings where key = 'push_dispatch_url';
  select value into v_secret from public.platform_settings where key = 'push_dispatch_secret';
  if v_url is null or v_secret is null then
    return null;
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    return null;
  end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
    body := jsonb_build_object('notification_id', new.id, 'user_id', new.user_id),
    timeout_milliseconds := 5000);
  return null;
exception when others then
  return null;
end;
$$;
drop trigger if exists notifications_after_insert on public.notifications;
create trigger notifications_after_insert after insert on public.notifications
  for each row execute function app.after_notification_insert();
