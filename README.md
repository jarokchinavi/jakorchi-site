# Jakorchi

Free food guide for travelers in Japan, Korea and China: restaurants on a map, halal / vegan filters,
reviews with prices in local money, 9 languages (en nl de fr es zh ja ko ar).

- **Live:** https://jakorchinavigation.jakorchi.workers.dev
- **Publishing:** every push to `main` goes live by itself (Cloudflare Workers Builds, Worker `jakorchinavigation`).
- **Repository:** public on purpose (it holds no secrets and must never hold any). The owner can make it private in GitHub → Settings → Change visibility; publishing keeps working. The Claude and Cloudflare apps have access to this repository only.
- **Front end:** being rebuilt screen by screen (front page and settings are done). The old version is kept in git as tag `old-app-final`.

## Folders

| Folder | What it is |
|---|---|
| `public/` | the website. `index.html` (page), `css/` (look), `js/` (app code, small files), `lang/*.json` (texts per language, `foods.json` = food names in every language), `places/` (restaurant files per map square), icons, `logo.svg`, `sw.js` (offline helper), `_headers` (security rules) |
| `tools/` | `bump-version.py` (new version number everywhere), `build_places.py` + `make-restaurants.bat` (make restaurant files from OpenStreetMap on a PC), `split_places.py`, `clean_names.py` |
| `database/` | the Supabase setup, in the order it was applied (see `database/README.md`) |
| `docs/` | short notes on the app, database, data, checks and status |

## Changing the app

1. Edit the files in `public/`.
2. Run `python tools/bump-version.py` so phones load the new version.
3. Push to `main`. Cloudflare publishes it within a minute or two; open apps reload by themselves.

## Safety

- Strict Content-Security-Policy: no inline scripts; only our own files may run (cdnjs and unpkg are allowed in `public/_headers` for the map libraries that come back later, always with integrity checks).
- Only the public (publishable) Supabase key is ever used in the app. The database rules decide what visitors can do: add only, never change or delete.
- Data: map and places © OpenStreetMap contributors (ODbL). No Google / Yelp / Tripadvisor / Naver / Dianping data.
