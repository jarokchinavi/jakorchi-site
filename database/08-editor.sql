-- Editor mode: the owner (or an agent) adds restaurants that show right away ("added by the Jakorchi team").
-- The editor code is set by the owner only, stored as a salted hash in the private schema. 10 wrong tries = locked for 1 hour.
alter table public.new_places add column if not exists verified boolean not null default false;
grant select (verified) on public.new_places to anon, authenticated;

create or replace function public.new_places_rate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.name := btrim(new.name);
  if new.verified then return new; end if;  -- editor places skip the visitor rules
  if new.photo is null then
    raise exception 'a photo of the outside is required' using errcode = 'P0001';
  end if;
  if (select count(*) from public.new_places where device = new.device and created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many new places today' using errcode = 'P0001';
  end if;
  if (select count(*) from public.new_places where created_at > now() - interval '1 hour') >= 30
     or (select count(*) from public.new_places where created_at > now() - interval '1 day') >= 150 then
    raise exception 'busy, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace view public.new_places_public with (security_invoker = true) as
  select p.id, p.name, p.lat, p.lng, p.cat, p.cuisine, p.created_at,
         (1 + coalesce(v.yes, 0))::integer as yes, coalesce(v.no, 0)::integer as no,
         p.halal, p.vegan, p.vegetarian,
         case when p.photo is not null and private.photo_report_count(p.photo) < 2 then p.photo end as photo,
         p.verified
  from public.new_places p
  left join (select place_id, count(*) filter (where verdict = 'yes') as yes, count(*) filter (where verdict = 'no') as no
             from public.new_place_votes group by place_id) v on v.place_id = p.id
  where not p.hidden
    and (p.verified or not (coalesce(v.no, 0) >= 3 and coalesce(v.no, 0) >= 1 + coalesce(v.yes, 0)))
    and (p.verified or 1 + coalesce(v.yes, 0) >= 3 or p.created_at > now() - interval '90 days');
revoke all on public.new_places_public from anon, authenticated;
grant select on public.new_places_public to anon, authenticated;

create schema if not exists private;
create table if not exists private.editor (id integer primary key default 1 check (id = 1), salt text not null, hash text not null, updated_at timestamptz not null default now());
create table if not exists private.editor_tries (at timestamptz not null default now(), ok boolean not null);
revoke all on private.editor, private.editor_tries from public, anon, authenticated;

-- owner only (SQL Editor):  select private.set_editor_code('your own long code');
create or replace function private.set_editor_code(code text) returns text
language plpgsql security definer set search_path = pg_catalog, private as $$
declare s text := replace(gen_random_uuid()::text, '-', '');
begin
  if code is null or char_length(code) < 12 then raise exception 'use at least 12 characters'; end if;
  insert into private.editor (id, salt, hash) values (1, s, encode(sha256(convert_to(s || code, 'UTF8')), 'hex'))
  on conflict (id) do update set salt = excluded.salt, hash = excluded.hash, updated_at = now();
  return 'editor code saved';
end $$;

create or replace function private.editor_ok(code text) returns boolean
language plpgsql security definer set search_path = pg_catalog, private as $$
declare e private.editor; good boolean;
begin
  if (select count(*) from private.editor_tries where not ok and at > now() - interval '1 hour') >= 10 then return false; end if;
  select * into e from private.editor where id = 1;
  good := e.hash is not null and code is not null and char_length(code) between 12 and 200
          and e.hash = encode(sha256(convert_to(e.salt || code, 'UTF8')), 'hex');
  insert into private.editor_tries (ok) values (good);
  delete from private.editor_tries where at < now() - interval '1 day';
  return good;
end $$;

create or replace function private.editor_add(code text, p_name text, p_lat double precision, p_lng double precision, p_cat text,
  p_cuisine text, p_halal boolean, p_vegan boolean, p_vegetarian boolean, p_photo text) returns bigint
language plpgsql security definer set search_path = pg_catalog, public, private as $$
declare nid bigint;
begin
  if not private.editor_ok(code) then raise exception 'wrong editor code' using errcode = 'P0001'; end if;
  insert into public.new_places (name, lat, lng, cat, cuisine, halal, vegan, vegetarian, photo, device, verified)
  values (p_name, p_lat, p_lng, coalesce(p_cat, 'restaurant'), coalesce(p_cuisine, ''), coalesce(p_halal, false),
          coalesce(p_vegan, false), coalesce(p_vegetarian, false), nullif(p_photo, ''), 'jakorchi-editor', true)
  returning id into nid;
  return nid;
end $$;

revoke all on function private.set_editor_code(text) from public, anon, authenticated;
revoke all on function private.editor_ok(text), private.editor_add(text, text, double precision, double precision, text, text, boolean, boolean, boolean, text) from public;
grant execute on function private.editor_ok(text), private.editor_add(text, text, double precision, double precision, text, text, boolean, boolean, boolean, text) to anon, authenticated;

-- what the app calls (normal functions; the checks happen in the private ones)
create or replace function public.editor_check(code text) returns boolean
language sql set search_path = pg_catalog, private as $$ select private.editor_ok(code) $$;
create or replace function public.editor_add_place(code text, p_name text, p_lat double precision, p_lng double precision, p_cat text,
  p_cuisine text, p_halal boolean, p_vegan boolean, p_vegetarian boolean, p_photo text) returns bigint
language sql set search_path = pg_catalog, private as $$ select private.editor_add(code, p_name, p_lat, p_lng, p_cat, p_cuisine, p_halal, p_vegan, p_vegetarian, p_photo) $$;
revoke all on function public.editor_check(text), public.editor_add_place(text, text, double precision, double precision, text, text, boolean, boolean, boolean, text) from public;
grant execute on function public.editor_check(text), public.editor_add_place(text, text, double precision, double precision, text, text, boolean, boolean, boolean, text) to anon, authenticated;
comment on column public.new_places.verified is 'true = added by the Jakorchi team (shown right away)';
notify pgrst, 'reload schema';
