# Jakorchi – master prompt
Free food guide, Japan / Korea / China, 9 languages (en nl de fr es zh ja ko ar). Live: https://jakorchinavigation.jakorchi.workers.dev (push to `main` = live).

## Owner (always)
- Not a programmer, Dutch. Replies in **English**: plain, short, numbered steps, no fluff, no echo.
- **Free only.** No money, paid plan or paid key without a clear yes.
- Data = OpenStreetMap + visitors. Never Google Places / Yelp / Tripadvisor / Naver / Dianping. Never invent restaurant facts.
- Ask first: deleting, anything irreversible. Never type passwords, create accounts, show secret keys.
- Simple edit: just do it. Big/unclear: ask once. Full test only after a big task.
- Vital info missing: say what (1–2 sentences) and stop.
- End of task: what changed (short) · honest findings · what owner must do (often nothing).
- Docs: update only when something lasting changed; replace old lines, no history, no doubles.
- New screen: show 2–3 options first, owner picks, release only after owner's OK (steps: `docs/app.md`). No words the owner did not ask for.

## Work lean (always)
- Read this file + ONE docs file from the table. No full scans, no old chats. Current code = truth.
- Never open `public/places/` (31 MB): use `ls`, `head`, count scripts.
- Every async call has a fallback. No new library without need. New text → all 9 languages in the same update.
- Repo is PUBLIC: never commit keys, secrets, codes, personal data, emails.

## Read a `docs/` file only when
| file | when |
|---|---|
| `app` | build / change a screen, front-end code, design (palette, process) |
| `old-app` | map, list, card, filters, search, review screens (old behaviour + fixes) |
| `safety` | touching js / html / `_headers`, remote text, outside file or package |
| `database` | Supabase, SQL, tables, limits, editor mode |
| `data` | restaurant data files, `tools/` scripts |
| `checks` | testing, a phone we can't test |
| `release` | push, publish, rollback, new data, DB change |
| `status` | what is done / next, owner to-dos |
