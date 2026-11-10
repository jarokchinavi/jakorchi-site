-- 14 · Higher whole-app limits, so 1000 visitors at the same time can post.
-- Per-phone limits stay the same (they stop spam). Only the "whole app" numbers go up (old → new):
--   reviews 100/h 600/d → 1000/h 5000/d · reports 2000/h 20000/d → 10000/h 100000/d · photo reports 200/h → 1000/h
--   photo uploads 60/h 300/d → 300/h 1500/d (total 2000 stays: free storage is 1 GB)
--   new places 30/h 150/d → 150/h 750/d · votes 600/h → 3000/h · menu photos 60/h → 300/h
--   owner info 50/h 300/d → 250/h 1500/d · info reports 300/h → 1500/h
-- Error texts stay the same: 'busy, try again later' = whole app full, 'too many … today' = this phone's limit.

create or replace function public.reviews_rate() returns trigger
 language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
begin
  if new.device is not null and (select count(*) from public.reviews where device = new.device and created_at > now() - interval '1 day') >= 15 then
    raise exception 'too many reviews today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.reviews where created_at > now() - interval '1 hour') >= 1000
     or (select count(*) from public.reviews where created_at > now() - interval '1 day') >= 5000 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $function$;

create or replace function public.place_flags_rate() returns trigger
 language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
begin
  if (select count(*) from public.place_flags where device = new.device and created_at > now() - interval '1 day') >= 120 then
    raise exception 'too many reports today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.place_flags where created_at > now() - interval '1 hour') >= 10000
     or (select count(*) from public.place_flags where created_at > now() - interval '1 day') >= 100000 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $function$;

create or replace function public.photo_reports_rate() returns trigger
 language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
begin
  if (select count(*) from public.photo_reports where device = new.device and created_at > now() - interval '1 day') >= 60 then
    raise exception 'too many photo reports today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.photo_reports where created_at > now() - interval '1 hour') >= 1000 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $function$;

create or replace function private.photo_quota_ok() returns boolean
 language sql stable security definer set search_path to 'pg_catalog', 'storage' as $function$
  select (select count(*) from storage.objects where bucket_id = 'review-photos' and created_at > now() - interval '1 hour') < 300
     and (select count(*) from storage.objects where bucket_id = 'review-photos' and created_at > now() - interval '1 day') < 1500
     and (select count(*) from storage.objects where bucket_id = 'review-photos') < 2000
$function$;

create or replace function public.new_places_rate() returns trigger
 language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
begin
  new.name := btrim(new.name);
  if new.verified then return new; end if;
  if new.photo is null then
    raise exception 'a photo of the outside is required' using errcode = 'P0001';
  end if;
  if (select count(*) from public.new_places where device = new.device and created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many new places today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.new_places where created_at > now() - interval '1 hour') >= 150
     or (select count(*) from public.new_places where created_at > now() - interval '1 day') >= 750 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $function$;

create or replace function public.new_place_votes_rate() returns trigger
 language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
begin
  if not exists (select 1 from public.new_places where id = new.place_id and not hidden) then
    raise exception 'unknown place' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.new_places where id = new.place_id and device = new.device) then
    raise exception 'you added this place yourself' using errcode = 'P0001';
  end if;
  if (select count(*) from public.new_place_votes where device = new.device and created_at > now() - interval '1 day') >= 60 then
    raise exception 'too many confirmations today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.new_place_votes where created_at > now() - interval '1 hour') >= 3000 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $function$;

create or replace function public.menu_photos_rate() returns trigger
 language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
begin
  if (select count(*) from public.menu_photos where device = new.device and created_at > now() - interval '1 day') >= 20 then
    raise exception 'too many menu photos today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.menu_photos where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $function$;

create or replace function public.owner_info_rate() returns trigger
 language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
begin
  new.phone := nullif(btrim(new.phone), '');
  new.note := nullif(btrim(new.note), '');
  if (select count(*) from public.owner_info where device = new.device and created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.owner_info where created_at > now() - interval '1 hour') >= 250
     or (select count(*) from public.owner_info where created_at > now() - interval '1 day') >= 1500 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $function$;

create or replace function public.owner_info_reports_rate() returns trigger
 language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
begin
  if (select count(*) from public.owner_info_reports where device = new.device and created_at > now() - interval '1 day') >= 60 then
    raise exception 'too many reports today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.owner_info_reports where created_at > now() - interval '1 hour') >= 1500 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $function$;
