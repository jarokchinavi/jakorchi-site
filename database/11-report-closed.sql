-- 2026-11-09: visitors can report that a place has closed or is not there (kind 'closed': yes = closed, no = still open).
-- Same table, limits and view as the halal / vegan reports; the app shows a warning label from 3 "yes".
alter table public.place_flags drop constraint if exists place_flags_kind_check;
alter table public.place_flags add constraint place_flags_kind_check
  check (kind in ('halal','vegan','vegetarian','closed') or kind ~ '^food:[a-z_]{2,24}$');
comment on table public.place_flags is '🚩 Visitor answers: halal / vegan / vegetarian yes-no, food type votes, and "closed" reports.';
