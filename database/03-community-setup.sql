-- Jakorchi: food-type votes, review photos, photo reports and spam limits (run once in Supabase > SQL Editor).
-- Safe to run again.

-- 1) visitor reports may also be a food type vote (kind = 'food:<type>', a fixed list in the app, no free text)
alter table public.place_flags drop constraint if exists place_flags_kind_check;
alter table public.place_flags add constraint place_flags_kind_check
  check (kind in ('halal','vegan','vegetarian') or kind ~ '^food:[a-z_]{2,24}$');
-- one food-type vote per device per place
create unique index if not exists place_flags_one_food_per_device on public.place_flags (place_id, device) where kind like 'food:%';
create index if not exists place_flags_device_idx on public.place_flags (device, created_at);

-- 2) spam limit: one device can send at most 120 reports a day
create or replace function public.place_flags_rate() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.place_flags where device = new.device and created_at > now() - interval '1 day') >= 120 then
    raise exception 'too many reports today' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists place_flags_rate_trg on public.place_flags;
create trigger place_flags_rate_trg before insert on public.place_flags for each row execute function public.place_flags_rate();

-- 3) reviews: up to 3 photos, a device id (for the spam limit), view that hides reported photos automatically
alter table public.reviews add column if not exists photos text[] not null default '{}';
alter table public.reviews add column if not exists device text check (device is null or char_length(device) between 8 and 40);
alter table public.reviews drop constraint if exists reviews_photos_max;
alter table public.reviews add constraint reviews_photos_max check (cardinality(photos) <= 3);
create index if not exists reviews_device_idx on public.reviews (device, created_at);
create or replace function public.reviews_rate() returns trigger language plpgsql as $$
begin
  if new.device is not null and (select count(*) from public.reviews where device = new.device and created_at > now() - interval '1 day') >= 15 then
    raise exception 'too many reviews today' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists reviews_rate_trg on public.reviews;
create trigger reviews_rate_trg before insert on public.reviews for each row execute function public.reviews_rate();

create table if not exists public.photo_reports (
  id bigint generated always as identity primary key,
  path text not null check (char_length(path) <= 140),
  device text not null check (char_length(device) between 8 and 40),
  created_at timestamptz not null default now(),
  unique (path, device)
);
alter table public.photo_reports enable row level security;
drop policy if exists "visitors can report photos" on public.photo_reports;
create policy "visitors can report photos" on public.photo_reports for insert to anon, authenticated with check (true);
grant insert on public.photo_reports to anon, authenticated;

-- what the app reads: approved reviews, with photos that 2 or more visitors reported removed
create or replace view public.reviews_public as
  select r.id, r.place_id, r.stars, r.name, r.text, r.created_at,
         coalesce((select array_agg(p) from unnest(r.photos) p
                   where (select count(*) from public.photo_reports x where x.path = p) < 2), '{}') as photos
  from public.reviews r where r.approved = true;
grant select on public.reviews_public to anon, authenticated;

-- 4) photo storage: public read, upload only (no list, no delete), JPEG/WebP up to 400 KB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 400000, array['image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 400000, allowed_mime_types = array['image/jpeg','image/webp'];
drop policy if exists "visitors can upload review photos" on storage.objects;
create policy "visitors can upload review photos" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'review-photos' and name ~ '^[a-z0-9_]{1,60}/[a-z0-9-]{8,40}\.(jpg|webp)$');

notify pgrst, 'reload schema';
