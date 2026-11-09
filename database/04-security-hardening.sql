-- Jakorchi: security hardening. Paste ALL of this in Supabase > SQL Editor > Run (once).
-- Safe to run again. Does not delete any data. Tested on a copy of your database layout before it was written.
--
-- What this fixes (found in the security check of 2026-11-08):
--  1) Anyone with the public app key could CHANGE or DELETE every review through the "reviews_public" view.
--  2) Anyone could read the private phone id ("device") of reviewers straight from the reviews table.
--  3) The daily spam limit for visitor reports never worked (row security hid the rows it had to count).
--  4) A review could be sent without a phone id (skipping the spam limit) or with a made-up date.
--  5) Photo paths inside a review were not checked in the database.
--  6) Emergency brakes for the whole app: one person with many fake phone ids can no longer flood the
--     database or fill your free photo storage. (Numbers are at the bottom of each function, change them later if
--     the app grows. When a brake trips, a visitor just sees "could not send" and can try again later.)

-- 1) The three public views can only be read by visitors, nothing else.
revoke all on public.reviews_public, public.place_ratings, public.place_flag_counts from anon, authenticated;
grant select on public.reviews_public, public.place_ratings, public.place_flag_counts to anon, authenticated;

-- 2) The tables: visitors can only ADD rows, and only the fields the app sends. They can no longer read the tables
--    directly (the app reads the views above), and never change or delete anything.
revoke all on public.reviews, public.place_flags, public.photo_reports from anon, authenticated;
grant insert (place_id, stars, name, text, photos, device) on public.reviews to anon, authenticated;
grant insert (place_id, kind, verdict, device) on public.place_flags to anon, authenticated;
grant insert (path, device) on public.photo_reports to anon, authenticated;

drop policy if exists "anyone can read approved" on public.reviews;   -- nobody reads this table directly any more
drop policy if exists "anyone can add" on public.reviews;
create policy "anyone can add" on public.reviews for insert to anon, authenticated
  with check (approved = true and device is not null);

-- 3) + 6) Spam limits that really work. They now run with the rights of the database owner, so they can count every row.
--    Per phone: 120 reports / 15 reviews / 60 photo reports a day.
--    For the whole app: reviews 100 an hour and 600 a day, reports 2000 an hour and 20000 a day, photo reports 200 an hour.
create index if not exists reviews_created_idx on public.reviews (created_at);
create index if not exists place_flags_created_idx on public.place_flags (created_at);
create index if not exists photo_reports_created_idx on public.photo_reports (created_at);
create index if not exists photo_reports_device_idx on public.photo_reports (device, created_at);

create or replace function public.place_flags_rate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.place_flags where device = new.device and created_at > now() - interval '1 day') >= 120 then
    raise exception 'too many reports today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.place_flags where created_at > now() - interval '1 hour') >= 2000
     or (select count(*) from public.place_flags where created_at > now() - interval '1 day') >= 20000 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace function public.reviews_rate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.device is not null and (select count(*) from public.reviews where device = new.device and created_at > now() - interval '1 day') >= 15 then
    raise exception 'too many reviews today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.reviews where created_at > now() - interval '1 hour') >= 100
     or (select count(*) from public.reviews where created_at > now() - interval '1 day') >= 600 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace function public.photo_reports_rate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.photo_reports where device = new.device and created_at > now() - interval '1 day') >= 60 then
    raise exception 'too many photo reports today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.photo_reports where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists photo_reports_rate_trg on public.photo_reports;
create trigger photo_reports_rate_trg before insert on public.photo_reports for each row execute function public.photo_reports_rate();

revoke all on function public.place_flags_rate(), public.reviews_rate(), public.photo_reports_rate() from public, anon, authenticated;

-- 4) Photo paths in a review must look exactly like the ones the app makes (folder/random-name.jpg).
create or replace function public.photos_ok(a text[]) returns boolean
language sql immutable set search_path = pg_catalog as $$
  select coalesce(bool_and(p ~ '^[a-z0-9_]{1,60}/[a-z0-9-]{8,40}\.(jpg|webp)$'), true) from unnest(a) as p
$$;
alter table public.reviews drop constraint if exists reviews_photos_fmt;
alter table public.reviews add constraint reviews_photos_fmt check (public.photos_ok(photos));

-- 6) Photo storage brake: at most 60 uploads an hour, 300 a day and 2000 photos in total (about 800 MB at the
--    largest size the app allows, so your free storage can never be filled by uploads). The function lives in a
--    private schema, so it is not reachable from the internet as a command.
create schema if not exists private;
grant usage on schema private to anon, authenticated;
create or replace function private.photo_quota_ok() returns boolean
language sql stable security definer set search_path = pg_catalog, storage as $$
  select (select count(*) from storage.objects where bucket_id = 'review-photos' and created_at > now() - interval '1 hour') < 60
     and (select count(*) from storage.objects where bucket_id = 'review-photos' and created_at > now() - interval '1 day') < 300
     and (select count(*) from storage.objects where bucket_id = 'review-photos') < 2000
$$;
revoke all on function private.photo_quota_ok() from public;
grant execute on function private.photo_quota_ok() to anon, authenticated;

drop policy if exists "visitors can upload review photos" on storage.objects;
create policy "visitors can upload review photos" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'review-photos'
              and name ~ '^[a-z0-9_]{1,60}/[a-z0-9-]{8,40}\.(jpg|webp)$'
              and private.photo_quota_ok());

-- 5) New tables and functions you make later are private until you decide otherwise.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

notify pgrst, 'reload schema';
