# Jakorchi – master prompt for Claude

Free food guide for travelers in Japan, Korea and China (map, halal / vegan filters, reviews, prices, 9 languages).
Live: https://jakorchinavigation.jakorchi.workers.dev · this repo = the source of truth · details in `docs/`.

## Owner (always)
- Not a programmer, Dutch, wants replies in **English**: plain words, short, numbered steps, no fluff, no echo.
- **Free only.** Never spend money, start a paid plan or use a paid key without a clear yes.
- Data = OpenStreetMap + visitors. Never Google Places / Yelp / Tripadvisor / Naver / Dianping data. Never invent restaurant facts.
- Ask first: unverified downloads, deleting things, anything that can't be undone. Never type passwords, create accounts or show secret keys.
- Simple edits: just do them. Big or unclear: ask once. Full test only when a big task is finished.
- If vital information is missing: say what is missing in 1–2 simple sentences and stop.
- End of a task: what changed (short) · honest findings · what the owner must do next (often nothing).
- Update `docs/` only when something lasting changed or the owner asks. Don't mention the notes in every reply.
- Process for every new screen: show the design first (2–3 options as PNG/JPG files via `SendUserFile`, light + dark) → owner picks → build in small files → test → show screenshots → release only after the owner's OK. Design: navy / cream / gold, see `docs/app.md`; no words the owner did not ask for.
- The owner keeps the Supabase test rows (reviews, new places, votes, owner info). Never clear them without a new yes.

## Work efficiently
- Start from this file and the one `docs/` file the task needs. Don't scan everything, don't re-read old chats.
- The current code is the truth; drop replaced features and old notes.
- Keep code modular and lean: page in `index.html`, look in `css/` (`base.css`, `home.css`, more per screen later), logic in small `js/` files (see `docs/app.md`), texts in `lang/`. The front end is being rebuilt screen by screen. The old version is NOT in the working tree any more: it lives only in git (tag `old-app-final`; read a file with `git show old-app-final:public/js/app.js`). Don't read it unless porting a feature.
- Every async call has a fallback (the app must never break). Mind phone speed and memory.

## Quality and speed
- **Can't test it myself (a real iPhone, the owner's phone or PC):** ask for a screenshot first, plus the numbers shown by tapping the version number in Settings (About → Version). No blind fixes.
- **A release breaks the live app:** put the previous version back at once (`git revert`, push). Tell the owner in plain words what happened, what was undone and what comes next. Then find the cause.
- **Small and fast:** no new library without a clear need. Keep every `js/` file small (the old `js/app.js` was 142 KB); rarely used parts go into a file that loads on demand. After a big change check the start (page ready in under 1 second on Wi-Fi).
- **Languages:** every new text gets all 9 languages in the same update (`lang/<code>.json`; food names also in `lang/foods.json`).

## Where things are
| What | Where |
|---|---|
| website | `public/` → `index.html`, `css/`, `js/` (`const BUILD` is in `js/app.js`), `lang/<code>.json` + `lang/foods.json`, `places/`, `sw.js`, `_headers`, icons, `logo.svg`, `version.json` · old front end only in git tag `old-app-final` |
| tools | `tools/bump-version.py` · `tools/split_places.py` · `tools/clean_names.py` · `tools/build_places.py` + `make-restaurants.bat` (owner runs the Desktop copy) |
| database | Supabase project `jsegdbtefxsforphluyc` · setup in `database/01…NN-*.sql` (all applied, in order) |
| hosting | Cloudflare Worker `jakorchinavigation` (account subdomain `jakorchi`), Workers Builds from this repo |
| backup | owner's Desktop `jakorchi-site\` (keep in sync after a release) · Desktop `jakorchi-tools\` |
| notes | `docs/app.md` (new) · `docs/old-app.md` (old behaviour to keep) · `docs/database.md` · `docs/data.md` · `docs/checks.md` · `docs/status.md` |

## Release (every change)
1. Edit in `public/` → `node --check` on the changed js files (if node is installed) → quick browser check for what changed (see `docs/checks.md`).
2. `python tools/bump-version.py` (version in app code, page links `?v=` and `version.json`).
3. Commit + push to `main` → Cloudflare publishes in about a minute → check `/version.json` on the live site.
4. Copy changed files to the Desktop backup (robocopy `public\` → `Desktop\jakorchi-site`). Tell the owner the new version number (Settings → Version).
- Push: `git push origin main` (GitHub sign-in is cached; if it asks again, run it in the Terminal panel so the owner can sign in; never type passwords). Commit author = Claude, with the Co-Authored-By line.
- New restaurant data: owner runs `make-restaurants.bat` → files land in Desktop `places\` → validate (JSON, right square) → copy to `public/places/` + `_done.json` → `python tools/split_places.py` → push.
- Database change: new numbered file in `database/`, test on local Postgres first, then apply_migration, then get_advisors (must stay 0).

## Safety (never weaken)
- CSP `script-src 'self'`; `_headers` also allows cdnjs (Leaflet) and unpkg (MapLibre) for the map screen later, always with integrity hashes. **No inline scripts or `on…=` attributes**; set handlers in the `js/` files.
- All remote text through `esc()` (`JK.ui.esc`); photo paths and links are checked again when the map and review screens come back (old `PHRE` / `webUrl()` are in tag `old-app-final`).
- Only the publishable Supabase key in the app. Visitors may only add rows (with spam limits), never change or delete. Never commit secrets (the editor code is set by the owner in the SQL Editor only).
- Quick safety scan of any outside file or package before using it; skip and tell the owner if it looks wrong.
- The repo is PUBLIC right now (checked 2026-11-10; it holds no secrets). The owner decides about making it private (GitHub → Settings → Change visibility; Cloudflare keeps working). The Claude and Cloudflare GitHub apps have access to this repo only.
