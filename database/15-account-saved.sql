-- 15: saved places + lists of a signed-in visitor (account sync, free: Supabase Auth + one table)
-- One row per account. Only the signed-in owner of the row can read or change it. Visitors who are not signed in see nothing.

create table if not exists public.user_saved (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_saved_small check (octet_length(data::text) <= 400000)
);
comment on table public.user_saved is '👤 saved places + lists of one account (jk_favs, jk_lists, jk_favobj); own row only';

-- the time is always set by the database, never by the phone
create or replace function public.user_saved_touch() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
revoke all on function public.user_saved_touch() from public, anon, authenticated;

drop trigger if exists user_saved_touch on public.user_saved;
create trigger user_saved_touch before insert or update on public.user_saved
  for each row execute function public.user_saved_touch();

alter table public.user_saved enable row level security;

revoke all on public.user_saved from anon, public;
grant select, insert, update, delete on public.user_saved to authenticated;

drop policy if exists user_saved_select on public.user_saved;
drop policy if exists user_saved_insert on public.user_saved;
drop policy if exists user_saved_update on public.user_saved;
drop policy if exists user_saved_delete on public.user_saved;
create policy user_saved_select on public.user_saved for select to authenticated using (user_id = (select auth.uid()));
create policy user_saved_insert on public.user_saved for insert to authenticated with check (user_id = (select auth.uid()));
create policy user_saved_update on public.user_saved for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy user_saved_delete on public.user_saved for delete to authenticated using (user_id = (select auth.uid()));
