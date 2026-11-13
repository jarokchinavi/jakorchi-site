# Jakorchi – master prompt
Free food guide, Japan / Korea / China, 9 languages (en nl de fr es zh ja ko ar). Live: https://jakorchinavigation.jakorchi.workers.dev (push to `main` = live).

## Owner
- Not a programmer, Dutch. Replies in **English**: plain, short, numbered steps, no fluff, no echo.
- **Free only.** No money, paid plan or paid key without a clear yes.
- Data = OpenStreetMap + visitors. Never Google Places / Yelp / Tripadvisor / Naver / Dianping. Never invent restaurant facts.
- Ask first: deleting, anything irreversible. Never type passwords, create accounts, show secret keys.
- Simple edit: just do it. Big/unclear: ask once. Full test only after a big task.
- Vital info missing: say what (1–2 sentences) and stop.
- End of task: what changed (short) · honest findings · what owner must do (often nothing).
- Docs: update only when something lasting changed; replace old lines, no history, no doubles.
- Keep Supabase test rows (reviews, new places, votes, owner info) unless owner says clear.
- New screen: 2–3 design options (PNG/JPG via `SendUserFile`, light + dark) → owner picks → build → test → screenshots → release after owner's OK. Palette not fixed (`docs/app.md`). No words the owner did not ask for.

## Work lean
- Read this file + ONE `docs/` file per task: `app` · `old-app` · `database` · `data` · `checks` (testing) · `release` (publish, rollback, new data, DB change) · `status`. No full scans, no old chats. Current code = truth.
- Never open `public/places/` (31 MB): use `ls`, `head`, count scripts.
- Small files: `index.html` · `css/` · `js/` · `lang/`. Front end is rebuilt screen by screen; old app only in git tag `old-app-final`, read only when porting. Before map / list / card / filters / search / review screens read `docs/old-app.md`.
- Every async call has a fallback. No new library without need. Rare code loads on demand. Start < 1 s on Wi-Fi.
- New text → all 9 languages in the same update (`lang/<code>.json`; food names also `lang/foods.json`).
- Can't test (real iPhone, owner's phone): ask screenshot + numbers from tapping version in Settings → About. No blind fixes.

## Safety (never weaken)
- CSP `script-src 'self'`; extra hosts (cdnjs, unpkg) only with integrity hashes. No inline scripts, no `on…=` attributes.
- Remote text through `esc()` (`JK.ui.esc`). Check photo paths and links when map/review screens return (old `PHRE` / `webUrl()` in tag).
- Repo is PUBLIC: never commit keys, secrets, codes, personal data, emails. App uses only the publishable Supabase key.
- Outside file/package/download: quick scan; looks wrong → skip, tell owner; unverified → ask first.
