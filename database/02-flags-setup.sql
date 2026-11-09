-- jakorchi: visitor reports for halal / vegan / vegetarian (already run in Supabase on 2026-11-08)
create table if not exists public.place_flags (
  id bigint generated always as identity primary key,
  place_id text not null check (char_length(place_id) <= 60),
  kind text not null check (kind in ('halal','vegan','vegetarian')),
  verdict text not null check (verdict in ('yes','no')),
  device text not null check (char_length(device) between 8 and 40),
  created_at timestamptz not null default now(),
  unique (place_id, kind, device)
);
create index if not exists place_flags_place_idx on public.place_flags (place_id);
alter table public.place_flags enable row level security;
create policy "visitors can add flags" on public.place_flags for insert to anon, authenticated with check (true);
create or replace view public.place_flag_counts as
  select place_id, kind,
         (count(*) filter (where verdict = 'yes'))::int as "yes",
         (count(*) filter (where verdict = 'no'))::int as "no"
  from public.place_flags group by place_id, kind;
grant insert on public.place_flags to anon, authenticated;
grant select on public.place_flag_counts to anon, authenticated;
notify pgrst, 'reload schema';
