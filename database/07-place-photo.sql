-- New restaurants must come with a photo of the outside (same photo storage + reports as other photos).
alter table public.new_places add column if not exists photo text check (photo is null or photo ~ '^[a-z0-9_]{1,60}/[a-z0-9-]{8,40}\.(jpg|webp)$');
grant select (photo) on public.new_places to anon, authenticated;
grant insert (photo) on public.new_places to anon, authenticated;
create or replace function public.new_places_rate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
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
  new.name := btrim(new.name);
  return new;
end $$;
create or replace view public.new_places_public with (security_invoker = true) as
  select p.id, p.name, p.lat, p.lng, p.cat, p.cuisine, p.created_at,
         (1 + coalesce(v.yes, 0))::integer as yes, coalesce(v.no, 0)::integer as no,
         p.halal, p.vegan, p.vegetarian,
         case when p.photo is not null and private.photo_report_count(p.photo) < 2 then p.photo end as photo
  from public.new_places p
  left join (select place_id, count(*) filter (where verdict = 'yes') as yes, count(*) filter (where verdict = 'no') as no
             from public.new_place_votes group by place_id) v on v.place_id = p.id
  where not p.hidden
    and not (coalesce(v.no, 0) >= 3 and coalesce(v.no, 0) >= 1 + coalesce(v.yes, 0))
    and (1 + coalesce(v.yes, 0) >= 3 or p.created_at > now() - interval '90 days');
revoke all on public.new_places_public from anon, authenticated;
grant select on public.new_places_public to anon, authenticated;
comment on view public.new_places_public is '👁 App reads this: new restaurants with yes/no counts and outside photo. Read-only.';
comment on column public.new_places.photo is 'photo of the outside (required for new places)';
notify pgrst, 'reload schema';
