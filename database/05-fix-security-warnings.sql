-- Jakorchi: removes the 3 red "Security Definer View" warnings in Supabase (Advisor).
-- Paste ALL of this in Supabase > SQL Editor > Run (once). Safe to run again. Does not delete any data.
-- Run it AFTER security-hardening.sql (that one is already done).
--
-- What changes: the 3 public views (reviews_public, place_ratings, place_flag_counts) used to run with the
-- rights of the database owner. Now they run with the rights of the visitor, which is what Supabase asks for.
-- Visitors may read only the harmless columns they need. The private phone id ("device") stays unreadable for
-- everyone, and the list of photo reports stays closed (a small private helper does the counting).

-- 1) Private helper: how many times was this photo reported? (lives in the private schema, not reachable from the internet)
create schema if not exists private;
grant usage on schema private to anon, authenticated;
create or replace function private.photo_report_count(p text) returns integer
language sql stable security definer set search_path = pg_catalog, public as $$
  select count(*)::integer from public.photo_reports where path = p
$$;
revoke all on function private.photo_report_count(text) from public;
grant execute on function private.photo_report_count(text) to anon, authenticated;
create index if not exists photo_reports_path_idx on public.photo_reports (path);

-- 2) Visitors may read these columns only (never "device"), and only approved reviews.
grant select (id, place_id, stars, name, text, approved, created_at, photos) on public.reviews to anon, authenticated;
grant select (place_id, kind, verdict) on public.place_flags to anon, authenticated;

drop policy if exists "anyone can read approved" on public.reviews;
create policy "anyone can read approved" on public.reviews for select to anon, authenticated
  using (approved = true);
drop policy if exists "anyone can read flags" on public.place_flags;
create policy "anyone can read flags" on public.place_flags for select to anon, authenticated
  using (true);

-- 3) The views: same columns and same answers as before, but they now run with the visitor's rights.
create or replace view public.reviews_public as
  select r.id, r.place_id, r.stars, r.name, r.text, r.created_at,
         coalesce((select array_agg(p.p) from unnest(r.photos) as p(p) where private.photo_report_count(p.p) < 2), '{}'::text[]) as photos
  from public.reviews r
  where r.approved = true;

alter view public.reviews_public set (security_invoker = true);
alter view public.place_ratings set (security_invoker = true);
alter view public.place_flag_counts set (security_invoker = true);

-- Views stay read-only for visitors.
revoke all on public.reviews_public, public.place_ratings, public.place_flag_counts from anon, authenticated;
grant select on public.reviews_public, public.place_ratings, public.place_flag_counts to anon, authenticated;

notify pgrst, 'reload schema';
