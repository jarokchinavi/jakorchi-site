# Jakorchi – master prompt for Claude

Free food guide for travelers in Japan, Korea and China (map, halal / vegan filters, reviews, prices, 9 languages).
Live: https://jakorchinavigation.jakorchi.workers.dev · this repo = the source of truth · details in `docs/`.

## Owner (always)
- Not a programmer, Dutch, wants replies in **English**: plain words, short, numbered steps, no fluff, no echo.
- **Free only.** Never spend money, start a paid plan or use a paid key without a clear yes.
- Data = OpenStreetMap + visitors. Never Google Places / Yelp / Tripadvisor / Naver / Dianping data. Never invent restaurant facts.
- Ask first: unverified downloads, deleting things, anything that can't be undone. Never type passwords, create accounts or show secret keys.
- Simple edits: just do them. Big or unclear: ask once. Full test only when a big task is finished.
- End of a task: what changed (short) · honest findings · what the owner must do next (often nothing).
- Update `docs/` only when something lasting changed or the owner asks. Don't mention the notes in every reply.

## Work efficiently
- Start from this file and the one `docs/` file the task needs. Don't scan everything, don't re-read old chats.
- The current code is the truth; drop replaced features and old notes.
- Keep code modular and lean: page in `index.html`, look in `css/app.css`, logic in `js/app.js`, texts in `lang/`.
- Every async call has a fallback (the app must never break). Mind phone speed and memory.

## Where things are
| What | Where |
|---|---|
| website | `public/` → `index.html`, `css/app.css`, `js/app.js`, `lang/<code>.json` + `lang/foods.json`, `places/`, `sw.js`, `_headers`, icons, `version.json` |
| tools | `tools/bump-version.py` · `tools/build_places.py` + `make-restaurants.bat` (owner runs the Desktop copy) |
| database | Supabase project `jsegdbtefxsforphluyc` · setup in `database/01…NN-*.sql` (all applied, in order) |
| hosting | Cloudflare Worker `jakorchinavigation` (account subdomain `jakorchi`), Workers Builds from this repo |
| backup | owner's Desktop `jakorchi-site\` (keep in sync after a release) · Desktop `jakorchi-tools\` |
| notes | `docs/app.md` · `docs/database.md` · `docs/data.md` · `docs/checks.md` · `docs/status.md` |

## Release (every change)
1. Edit in `public/` → `node --check public/js/app.js` → quick Playwright check for what changed (see `docs/checks.md`).
2. `python tools/bump-version.py` (version in app code, page links `?v=` and `version.json`).
3. Commit + push to `main` → Cloudflare publishes in about a minute → check `/version.json` on the live site.
4. Copy changed files to the Desktop backup (device_commit_files). Tell the owner the new version number (shown in the menu).
- New restaurant data: owner runs `make-restaurants.bat` → files land in Desktop `places\` → validate (JSON, right square) → copy to `public/places/` + `_done.json` → push.
- Database change: new numbered file in `database/`, test on local Postgres first, then apply_migration, then get_advisors (must stay 0).

## Safety (never weaken)
- CSP `script-src 'self'` + cdnjs (Leaflet) + unpkg (MapLibre), all with integrity hashes. **No inline scripts or `on…=` attributes**; set handlers in `js/app.js`.
- All remote text through `esc()`; photo paths checked (PHRE); links through `webUrl()`.
- Only the publishable Supabase key in the app. Visitors may only add rows (with spam limits), never change or delete. Never commit secrets (the editor code is set by the owner in the SQL Editor only).
- Quick safety scan of any outside file or package before using it; skip and tell the owner if it looks wrong.
- Repo stays private. The Claude and Cloudflare GitHub apps have access to this repo only.
