# Jakorchi

Free food guide for travelers in Japan, Korea and China: restaurants on a map, halal / vegan filters,
reviews with prices in local money, 9 languages (en nl de fr es zh ja ko ar).

- **Live:** https://jakorchinavigation.jakorchi.workers.dev
- **Publishing:** every push to `main` goes live by itself (Cloudflare Workers Builds, Worker `jakorchinavigation`).
- **Private repository.** Only the owner can change it. The Claude and Cloudflare apps have access to this repository only.

## Folders

| Folder | What it is |
|---|---|
| `public/` | the website. `index.html` (page), `css/app.css` (look), `js/app.js` (app code), `lang/*.json` (texts per language, `foods.json` = food names in every language), `places/` (restaurant files per map square), icons, `sw.js` (offline helper), `_headers` (security rules) |
| `tools/` | `bump-version.py` (new version number everywhere), `build_places.py` + `make-restaurants.bat` (make restaurant files from OpenStreetMap on a PC) |
| `database/` | the Supabase setup, in the order it was applied (see `database/README.md`) |
| `docs/` | short notes on the app, database, data, checks and status |

## Changing the app

1. Edit the files in `public/`.
2. Run `python tools/bump-version.py` so phones load the new version.
3. Push to `main`. Cloudflare publishes it within a minute or two; open apps reload by themselves.

## Safety

- Strict Content-Security-Policy: only our own files, Leaflet (cdnjs) and MapLibre (unpkg) may run, all with integrity checks; no inline scripts.
- The Supabase key in `js/app.js` is the public (publishable) key. The database rules decide what visitors can do: add only, never change or delete.
- Data: map and places © OpenStreetMap contributors (ODbL). No Google / Yelp / Tripadvisor / Naver / Dianping data.
