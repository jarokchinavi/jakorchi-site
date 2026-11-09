-- Jakorchi: new restaurants (confirmed by 3 phones), menu photos, restaurant info (phone + note).
-- Paste ALL of this in Supabase > SQL Editor > Run (once). Safe to run again. Does not delete any data.
-- Tested on a copy of your database layout first.
--
-- How it works:
--  1) New restaurant: a visitor adds it (name, spot, kind, food type, halal / vegan / vegetarian). That counts as 1 "yes".
--     When 2 other phones say "yes, it's here", it shows for everyone. 3 "no" (and more no than yes) hides it.
--     A place that is still not confirmed after 90 days disappears by itself.
--  2) Menu photos: same photo storage and same reports as review photos (hidden after 2 reports).
--  3) Restaurant info: the restaurant adds a phone number and/or a note, shown as "from the restaurant, not checked".
--     Hidden after 3 visitor reports.
--  You can hide anything yourself: Table Editor > pick the table > set "hidden" to true.
--  Spam brakes, per phone per day: 5 new places, 60 confirmations, 20 menu photos, 5 restaurant infos, 60 reports.
--  For the whole app: new places 30/hour and 150/day, confirmations 600/hour, menu photos 60/hour,
--  restaurant infos 50/hour and 300/day, reports 300/hour. Photo uploads also keep the old storage brake.

-- 1) Tables -------------------------------------------------------------------------------------------
create table if not exists public.new_places (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  lat double precision not null check (lat between 18 and 54),
  lng double precision not null check (lng between 73 and 146),
  cat text not null default 'restaurant' check (cat in ('restaurant','coffee','dessert','drinks','fast')),
  cuisine text not null default '' check (cuisine ~ '^[a-z &/()-]{0,40}$'),
  halal boolean not null default false,
  vegan boolean not null default false,
  vegetarian boolean not null default false,
  device text not null check (char_length(device) between 8 and 40),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.new_places add column if not exists halal boolean not null default false;
alter table public.new_places add column if not exists vegan boolean not null default false;
alter table public.new_places add column if not exists vegetarian boolean not null default false;
create index if not exists new_places_ll_idx on public.new_places (lat, lng);
create index if not exists new_places_dev_idx on public.new_places (device, created_at);
create index if not exists new_places_created_idx on public.new_places (created_at);

create table if not exists public.new_place_votes (
  id bigint generated always as identity primary key,
  place_id bigint not null references public.new_places(id) on delete cascade,
  verdict text not null check (verdict in ('yes','no')),
  device text not null check (char_length(device) between 8 and 40),
  created_at timestamptz not null default now(),
  unique (place_id, device)
);
create index if not exists new_place_votes_dev_idx on public.new_place_votes (device, created_at);
create index if not exists new_place_votes_created_idx on public.new_place_votes (created_at);

create table if not exists public.menu_photos (
  id bigint generated always as identity primary key,
  place_id text not null check (place_id ~ '^[A-Za-z0-9_]{1,60}$'),
  path text not null unique check (path ~ '^[a-z0-9_]{1,60}/[a-z0-9-]{8,40}\.(jpg|webp)$'),
  device text not null check (char_length(device) between 8 and 40),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists menu_photos_place_idx on public.menu_photos (place_id, created_at desc);
create index if not exists menu_photos_dev_idx on public.menu_photos (device, created_at);
create index if not exists menu_photos_created_idx on public.menu_photos (created_at);

create table if not exists public.owner_info (
  id bigint generated always as identity primary key,
  place_id text not null check (place_id ~ '^[A-Za-z0-9_]{1,60}$'),
  phone text check (phone is null or phone ~ '^[+0-9 ()-]{5,30}$'),
  note text check (note is null or char_length(note) <= 300),
  device text not null check (char_length(device) between 8 and 40),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint owner_info_not_empty check (phone is not null or note is not null)
);
create index if not exists owner_info_place_idx on public.owner_info (place_id, created_at desc);
create index if not exists owner_info_dev_idx on public.owner_info (device, created_at);
create index if not exists owner_info_created_idx on public.owner_info (created_at);

create table if not exists public.owner_info_reports (
  id bigint generated always as identity primary key,
  info_id bigint not null references public.owner_info(id) on delete cascade,
  device text not null check (char_length(device) between 8 and 40),
  created_at timestamptz not null default now(),
  unique (info_id, device)
);
create index if not exists owner_info_reports_info_idx on public.owner_info_reports (info_id);
create index if not exists owner_info_reports_dev_idx on public.owner_info_reports (device, created_at);
create index if not exists owner_info_reports_created_idx on public.owner_info_reports (created_at);

-- 2) Who may do what: visitors can read only the harmless columns (never the phone id "device"),
--    add rows with only the fields the app sends, and never change or delete anything.
alter table public.new_places enable row level security;
alter table public.new_place_votes enable row level security;
alter table public.menu_photos enable row level security;
alter table public.owner_info enable row level security;
alter table public.owner_info_reports enable row level security;
revoke all on public.new_places, public.new_place_votes, public.menu_photos, public.owner_info, public.owner_info_reports from anon, authenticated;

grant select (id, name, lat, lng, cat, cuisine, halal, vegan, vegetarian, hidden, created_at) on public.new_places to anon, authenticated;
grant select (place_id, verdict) on public.new_place_votes to anon, authenticated;
grant select (id, place_id, path, hidden, created_at) on public.menu_photos to anon, authenticated;
grant select (id, place_id, phone, note, hidden, created_at) on public.owner_info to anon, authenticated;

grant insert (name, lat, lng, cat, cuisine, halal, vegan, vegetarian, device) on public.new_places to anon, authenticated;
grant insert (place_id, verdict, device) on public.new_place_votes to anon, authenticated;
grant insert (place_id, path, device) on public.menu_photos to anon, authenticated;
grant insert (place_id, phone, note, device) on public.owner_info to anon, authenticated;
grant insert (info_id, device) on public.owner_info_reports to anon, authenticated;

drop policy if exists "read visible" on public.new_places;
create policy "read visible" on public.new_places for select to anon, authenticated using (not hidden);
drop policy if exists "visitors can add" on public.new_places;
create policy "visitors can add" on public.new_places for insert to anon, authenticated with check (not hidden);
drop policy if exists "read votes" on public.new_place_votes;
create policy "read votes" on public.new_place_votes for select to anon, authenticated using (true);
drop policy if exists "visitors can vote" on public.new_place_votes;
create policy "visitors can vote" on public.new_place_votes for insert to anon, authenticated with check (true);
drop policy if exists "read visible" on public.menu_photos;
create policy "read visible" on public.menu_photos for select to anon, authenticated using (not hidden);
drop policy if exists "visitors can add" on public.menu_photos;
create policy "visitors can add" on public.menu_photos for insert to anon, authenticated with check (not hidden);
drop policy if exists "read visible" on public.owner_info;
create policy "read visible" on public.owner_info for select to anon, authenticated using (not hidden);
drop policy if exists "restaurants can add" on public.owner_info;
create policy "restaurants can add" on public.owner_info for insert to anon, authenticated with check (not hidden);
drop policy if exists "visitors can report" on public.owner_info_reports;
create policy "visitors can report" on public.owner_info_reports for insert to anon, authenticated with check (true);

-- 3) Spam brakes and checks (they run with the database owner's rights, so they can count every row)
create or replace function public.new_places_rate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.new_places where device = new.device and created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many new places today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.new_places where created_at > now() - interval '1 hour') >= 30
     or (select count(*) from public.new_places where created_at > now() - interval '1 day') >= 150 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  new.name := btrim(new.name);
  return new;
end $$;
drop trigger if exists new_places_rate_trg on public.new_places;
create trigger new_places_rate_trg before insert on public.new_places for each row execute function public.new_places_rate();

create or replace function public.new_place_votes_rate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
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
  if (select count(*) from public.new_place_votes where created_at > now() - interval '1 hour') >= 600 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists new_place_votes_rate_trg on public.new_place_votes;
create trigger new_place_votes_rate_trg before insert on public.new_place_votes for each row execute function public.new_place_votes_rate();

create or replace function public.menu_photos_rate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.menu_photos where device = new.device and created_at > now() - interval '1 day') >= 20 then
    raise exception 'too many menu photos today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.menu_photos where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists menu_photos_rate_trg on public.menu_photos;
create trigger menu_photos_rate_trg before insert on public.menu_photos for each row execute function public.menu_photos_rate();

create or replace function public.owner_info_rate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.phone := nullif(btrim(new.phone), '');
  new.note := nullif(btrim(new.note), '');
  if (select count(*) from public.owner_info where device = new.device and created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.owner_info where created_at > now() - interval '1 hour') >= 50
     or (select count(*) from public.owner_info where created_at > now() - interval '1 day') >= 300 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists owner_info_rate_trg on public.owner_info;
create trigger owner_info_rate_trg before insert on public.owner_info for each row execute function public.owner_info_rate();

create or replace function public.owner_info_reports_rate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.owner_info_reports where device = new.device and created_at > now() - interval '1 day') >= 60 then
    raise exception 'too many reports today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.owner_info_reports where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists owner_info_reports_rate_trg on public.owner_info_reports;
create trigger owner_info_reports_rate_trg before insert on public.owner_info_reports for each row execute function public.owner_info_reports_rate();

revoke all on function public.new_places_rate(), public.new_place_votes_rate(), public.menu_photos_rate(),
  public.owner_info_rate(), public.owner_info_reports_rate() from public, anon, authenticated;

-- Private helper: how many times was this restaurant info reported? (not reachable from the internet)
create schema if not exists private;
grant usage on schema private to anon, authenticated;
create or replace function private.owner_info_report_count(i bigint) returns integer
language sql stable security definer set search_path = pg_catalog, public as $$
  select count(*)::integer from public.owner_info_reports where info_id = i
$$;
revoke all on function private.owner_info_report_count(bigint) from public;
grant execute on function private.owner_info_report_count(bigint) to anon, authenticated;

-- 4) What the app reads (read-only, run with the visitor's rights)
create or replace view public.new_places_public with (security_invoker = true) as
  select p.id, p.name, p.lat, p.lng, p.cat, p.cuisine, p.created_at,
         (1 + coalesce(v.yes, 0))::integer as yes, coalesce(v.no, 0)::integer as no,
         p.halal, p.vegan, p.vegetarian
  from public.new_places p
  left join (select place_id, count(*) filter (where verdict = 'yes') as yes, count(*) filter (where verdict = 'no') as no
             from public.new_place_votes group by place_id) v on v.place_id = p.id
  where not p.hidden
    and not (coalesce(v.no, 0) >= 3 and coalesce(v.no, 0) >= 1 + coalesce(v.yes, 0))
    and (1 + coalesce(v.yes, 0) >= 3 or p.created_at > now() - interval '90 days');

create or replace view public.menu_photos_public with (security_invoker = true) as
  select m.id, m.place_id, m.path, m.created_at
  from public.menu_photos m
  where not m.hidden and private.photo_report_count(m.path) < 2;

create or replace view public.owner_info_public with (security_invoker = true) as
  select distinct on (o.place_id) o.id, o.place_id, o.phone, o.note, o.created_at
  from public.owner_info o
  where not o.hidden and private.owner_info_report_count(o.id) < 3
  order by o.place_id, o.created_at desc;

revoke all on public.new_places_public, public.menu_photos_public, public.owner_info_public from anon, authenticated;
grant select on public.new_places_public, public.menu_photos_public, public.owner_info_public to anon, authenticated;

-- 5) Short labels, so every table is easy to recognise in the Table Editor
comment on table public.new_places is '📍 New restaurants added by visitors. Shown after 3 yes. Hide one: set hidden = true.';
comment on table public.new_place_votes is '📍✔ Yes/no answers on new restaurants (is it really there?).';
comment on table public.menu_photos is '🍽 Menu photos. Hide one: set hidden = true (2 photo reports also hide it).';
comment on table public.owner_info is '🏪 Phone + note from restaurants (not checked). Hide one: set hidden = true (3 reports also hide it).';
comment on table public.owner_info_reports is '🏪🚩 Reports on restaurant info. 3 reports = hidden.';
comment on view public.new_places_public is '👁 App reads this: new restaurants with yes/no counts. Read-only.';
comment on view public.menu_photos_public is '👁 App reads this: visible menu photos. Read-only.';
comment on view public.owner_info_public is '👁 App reads this: latest visible restaurant info per place. Read-only.';
comment on column public.new_places.hidden is 'true = hidden from the app';
comment on column public.menu_photos.hidden is 'true = hidden from the app';
comment on column public.owner_info.hidden is 'true = hidden from the app';

notify pgrst, 'reload schema';
