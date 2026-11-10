-- 13: refuse a new place when the same name already exists within 15 metres (visitors and editor).
-- Name match = lower case, spaces and punctuation removed (Japanese / Korean / Chinese letters are kept).
create or replace function public.new_places_dupe() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare k text := lower(regexp_replace(coalesce(new.name,''), '[[:space:][:punct:]]+', '', 'g'));
begin
  if k <> '' and exists (
    select 1 from public.new_places p
    where not p.hidden
      and abs(p.lat - new.lat) < 0.0002 and abs(p.lng - new.lng) < 0.0003
      and lower(regexp_replace(p.name, '[[:space:][:punct:]]+', '', 'g')) = k
      and sqrt(power((p.lat - new.lat) * 111320, 2) + power((p.lng - new.lng) * 111320 * cos(radians(new.lat)), 2)) <= 15
  ) then
    raise exception 'already on the map' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists new_places_dupe_trg on public.new_places;
create trigger new_places_dupe_trg before insert on public.new_places for each row execute function public.new_places_dupe();
revoke all on function public.new_places_dupe() from public, anon, authenticated;
