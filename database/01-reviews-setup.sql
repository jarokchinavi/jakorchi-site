-- jakorchi: shared reviews. Paste ALL of this in Supabase > SQL Editor > Run.
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  place_id text not null check (char_length(place_id) <= 60),
  stars int not null check (stars between 1 and 5),
  name text check (char_length(name) <= 40),
  text text check (char_length(text) <= 600),
  approved boolean not null default true,   -- set to false in the table to hide a review
  created_at timestamptz not null default now()
);
create index if not exists reviews_place_idx on public.reviews (place_id, created_at desc);
alter table public.reviews enable row level security;
drop policy if exists "anyone can read approved" on public.reviews;
drop policy if exists "anyone can add" on public.reviews;
create policy "anyone can read approved" on public.reviews for select using (approved = true);
create policy "anyone can add" on public.reviews for insert with check (approved = true);
create or replace view public.place_ratings as
  select place_id, count(*)::int as n, sum(stars)::int as sum_stars
  from public.reviews where approved = true group by place_id;
grant select on public.place_ratings to anon;
grant select, insert on public.reviews to anon;
