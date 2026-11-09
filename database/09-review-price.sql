-- Jakorchi: visitors can add the price they paid (1 cheap … 4 expensive) to a review.
-- The app shows the average per place and uses it in the price filter.
alter table public.reviews add column if not exists price smallint
  constraint reviews_price_check check (price between 1 and 4);
comment on column public.reviews.price is 'Price per person the visitor paid: 1 cheap, 2 mid, 3 high, 4 expensive (money ranges per country are shown in the app)';
grant insert (price) on public.reviews to anon, authenticated;
grant select (price) on public.reviews to anon, authenticated;

create or replace view public.place_ratings with (security_invoker = true) as
 select place_id,
   count(*)::integer as n,
   sum(stars)::integer as sum_stars,
   count(price)::integer as n_price,
   coalesce(sum(price), 0)::integer as sum_price
 from public.reviews
 where approved = true
 group by place_id;
comment on view public.place_ratings is 'Per place: number of reviews, total stars, and the average price visitors paid (sum_price / n_price)';

create or replace view public.reviews_public with (security_invoker = true) as
 select r.id, r.place_id, r.stars, r.name, r.text, r.created_at,
   coalesce((select array_agg(p.p) from unnest(r.photos) p(p) where private.photo_report_count(p.p) < 2), '{}'::text[]) as photos,
   r.price
 from public.reviews r
 where r.approved = true;

create index if not exists reviews_priced_idx on public.reviews (place_id) where approved and price is not null;
