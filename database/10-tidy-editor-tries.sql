-- 2026-11-09: main key for private.editor_tries + clearer note on place_ratings (applied)
alter table private.editor_tries add column if not exists id bigint generated always as identity;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='private.editor_tries'::regclass and contype='p') then
    alter table private.editor_tries add primary key (id);
  end if;
end $$;
comment on table private.editor_tries is 'Wrong editor-code attempts (for the 1-hour lock). Not visible to the app.';
comment on view public.place_ratings is '👁 App reads this: per place the number of reviews, total stars, and the average price visitors paid (sum_price / n_price). Read-only.';
