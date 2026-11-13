# Jakorchi – master prompt
Free food guide for travelers in Japan, Korea, China: map, halal/vegan filters, reviews, prices, 9 languages (en nl de fr es zh ja ko ar).
Live: https://jakorchinavigation.jakorchi.workers.dev · this repo = source of truth.

## Owner
- Not a programmer, Dutch. Replies in **English**: plain, short, numbered steps, no fluff, no echo.
- **Free only.** No money, paid plan or paid key without a clear yes.
- Data = OpenStreetMap + visitors. Never Google Places / Yelp / Tripadvisor / Naver / Dianping. Never invent restaurant facts.
- Ask first: unverified downloads, deleting, anything irreversible. Never type passwords, create accounts, show secret keys.
- Simple edit: just do it. Big/unclear: ask once. Full test only after a big task.
- Vital info missing: say what (1–2 sentences) and stop.
- End of task: what changed (short) · honest findings · what owner must do (often nothing).
- Docs: update only when something lasting changed; replace old lines, no history.
- Keep Supabase test rows (reviews, new places, votes, owner info). Never clear without a new yes.
- New screen: 2–3 design options (PNG/JPG via `SendUserFile`, light + dark) → owner picks → build small files → test → screenshots → release after owner's OK. Colours are not fixed: designer may propose a better palette (see `docs/app.md`). No words the owner did not ask for.

## Work lean
- Read this file + ONE `docs/` file for the task. No full scans, no old chats. Current code = truth.
- Never open `public/places/` (31 MB, 160 files): use `ls`, `head`, count scripts.
- Modular: `index.html` page · `css/` look · small `js/` files · `lang/` texts. Front end is rebuilt screen by screen. Old app only in git tag `old-app-final` (`git show old-app-final:public/js/app.js`): read only when porting a feature.
- Before map / list / card / filters / search / review screens: read `docs/old-app.md` + matching old code.
- Every async call has a fallback. Mind phone speed. No new library without need. `js/` files small; rare parts load on demand. Start < 1 s on Wi-Fi.
- New text → all 9 languages in the same update (`lang/<code>.json`; food names also `lang/foods.json`).
- Can't test (real iPhone, owner's phone): ask screenshot + numbers from tapping version in Settings → About. No blind fixes.
- Release breaks live app: `git revert`, push, tell owner plainly, then find cause.

## Where
- website `public/` (files: `docs/app.md`) · tools `tools/` · database Supabase `jsegdbtefxsforphluyc`, `database/NN-*.sql` · hosting Cloudflare Worker `jakorchinavigation`, Workers Builds on push to `main` · backup owner's Desktop `jakorchi-site\` + `jakorchi-tools\`
- docs (read one): `app` · `old-app` · `database` · `data` · `checks` (testing) · `release` (publish, rollback, new data, DB change) · `status`

## Safety (never weaken)
- CSP `script-src 'self'`; `_headers` also allows cdnjs + unpkg (map libs) only with integrity hashes. No inline scripts, no `on…=` attributes.
- Remote text through `esc()` (`JK.ui.esc`). Photo paths and links checked again when map/review screens return (old `PHRE` / `webUrl()` in tag).
- Only publishable Supabase key in app. Visitors add rows only (spam limits), never change/delete. Never commit secrets; editor code is set by owner in SQL Editor.
- Outside file/package: quick scan first; looks wrong → skip, tell owner.
- Repo is PUBLIC (owner's choice, 2026-11-10): never commit keys, codes, personal data, emails. Can be made private later (GitHub → Settings → Change visibility; Cloudflare keeps working).
