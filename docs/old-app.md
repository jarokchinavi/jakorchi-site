# OLD app: behaviour and fixes to keep (the design and the places of buttons change, the rules below stay)
Read this before building the map, list, card, filters, search or review screens. The real code is in tag `old-app-final` (`git show old-app-final:public/js/app.js`).

## Behaviour numbers that stay
- zoom up to 21 (the plain-map backup stretches from zoom 19) · bubbles at zoom ≤14 (cell 140 px at ≤13, 112 px at 14; max 24 on a phone, 40 on PC; tap = zoom in 2) · single pins from zoom 15 (zoom 15 max ~60, 16 ~95) · pins redrawn at most every 200 ms · visitor/team places always get their own pin · card open = bubbles hidden · zoom guide below zoom 13
- search: normal match first, typo / spelling-variant matching only with fewer than 3 hits (`fold`, `near`, `fuzzyHit`) · live while typing (350 ms pause) · list = places on screen, nearest first (typed search or "Top rated" sorts by rating) · city search: ~60 local cities + OpenStreetMap on Enter, Photon as backup, answers kept 30 days
- prices: local money per country (JP ¥ 1,500/4,000/10,000 · KR ₩ 13,000/30,000/80,000 · CN ¥ 50/150/400), slider 1–20 (20 = any) · "closed" label from 3 yes and more yes than no
- map labels: language set before drawing (`styleLang`), style kept 7 days, plain OSM tiles only as backup after 6 s · map language setting `jk_maplet` = auto | latin | code

## Hard-won fixes (bugs we already solved)
1. iPhone home-screen app is laid out short by the status-bar height → measured once (`fixIosGap`, `html.iosgap`); layers with `position:fixed` get cut off, so stage/sheet/menu live inside `<body>` as `absolute` on the map screen.
2. iOS 26 blurs the strip under the clock (seen on the old app and on the new front page, home-screen app only). No web way to switch it off was found (2026-11-10: the WebKit change is for native apps that embed a web view). Moving the top bar 48 px lower removed it, but the owner did not want that and it was undone. Page background = the map colour so the band matches; `theme-color` follows light/dark. Options left: accept the soft blur, a smaller shift, or the solid-bar status-bar style (needs the icon to be re-added to the Home Screen).
3. Typing: the "keep map at top" scroll guard pauses while a field is focused; `--kb` (keyboard height) keeps the field above the keyboard; inputs are 16 px so the iPhone does not zoom.
4. Text selection and the long-press menu are off everywhere except typing fields.
5. Back button: one guard history step while any layer is open; the phone back button closes the layer.
6. Filters open = map gestures off. Tap stars on a card = open full card + scroll to reviews.
7. Slow or broken services (Supabase, OpenStreetMap) must never break the app: fallbacks everywhere, ask less often when slow, "Reviews can't load right now" (`noRev`), clear posting-limit messages (`sbWhy`).
8. Clear cache = only `jk_c_*`; clear saved map data = only `/places/` files + saved map style. Favorites, lists, settings, app files are never touched.
9. No system emoji (own icons) · no orange · gold only for ratings and Plus · service worker: app files network first, places saved copy first.
10. The browser test pane pauses map drawing while hidden: map labels cannot be judged there.

# (old notes in full)
- vanilla JS, no build step · `index.html` (page + inline start-screen CSS only) · `css/app.css` · `js/app.js` · Leaflet from cdnjs with integrity
- version: `const BUILD` at the top of `js/app.js` = `?v=` in index.html = `version.json` (use tools/bump-version.py) · menu shows it · app reloads itself when version.json differs (not while typing / sheet open)
- texts: `T(key)` · English = the key itself · `lang/<code>.json` = all texts of one language (only the chosen one is downloaded by `loadLang`) · `lang/foods.json` = food names (`c:…`) + category names of every language (search in any language via `cuisAll`) · languages: en nl de fr es zh ja ko ar (ar = right-to-left, map stays left-to-right)
- new text: add the English key in code, then the same key in all 8 `lang/<code>.json` files (+ `foods.json` if it is a `c:` food name)
- place row, 18 cols: id, name, localName, cat, cuisine, lat, lng, halal, vegan, hours, addr, web, (empty: area removed), country, vegetarian, phone, nm, sub
- safety: esc() remote text · PHRE photo paths · webUrl() links · strict CSP (no inline scripts)
- names: real name · English only if OSM has it or known chain (BRANDS) · no made-up Latin
- food type: OSM cuisine or FOODS word list (≈ guessed) · filter panel = type-to-search box (fCuisine + datalist)
- price: reviews carry price 1–4 · `PRC` = local money per country (JP ¥ 1,500/4,000/10,000 · KR ₩ 13,000/30,000/80,000 · CN ¥ 50/150/400) · slider 1–20 (20 = any) · `prLoad` bulk-loads priced places from place_ratings
- pins: pinScore (rating > info) · fewer when zoomed out (tier table in syncMarkers)
- map: OpenFreeMap vector style, labels set to the app language **before** drawing (styleLang, style kept 7 days in localStorage) · plain OSM tiles only as backup after 6 s
- start screen: logo 2 s (from first paint) · CSS fallback hides it after 4 s
- screen: map fills under the status bar and home bar; controls use env(safe-area-inset-*) · theme-color follows light/dark
- iPhone home-screen app: iOS lays the page out short by the status-bar height (band at the bottom in the page background colour). `fixIosGap` measures it once → `html.iosgap`; on the map screen (`html.exv`) the page is made screen-tall and stage / sheet / menu / start screen sit inside `<body>` (absolute), because layers pinned with position:fixed are cut off at the short viewport. Tap the version number in the menu = screen measurements (for phones we cannot test).
- menu: All Asia · Find a city (Nominatim) · Add a restaurant · Install the app · Editor mode
- reports (`openFlag`): closed / halal / vegan-vegetarian yes-no + food type · "closed" label (`closedTag`) from 3 yes and more yes than no
- About & privacy page (`#about`, menu → More): what is saved; `CONTACT` in js/app.js = contact email ("" hides the line) · the text names the outside services, keep it true when services change
- saved places + lists only on the phone
- `sw.js`: navigation + css/js/lang = network first (saved copy offline) · places = saved copy first, refresh in background · bump `V` when the caching rules change

## Map pins, search, touch (2026-11-10)
- Zoom 13–14: crowded places become numbered bubbles (`syncCl` in js/app.js, `.cl` in css); tap = zoom in 2 steps. Zoom 15+: single pins as before. Pins are redrawn at most every 200 ms (`syncSoon`).
- Search (`fold`, `near`, `fuzzyHit`): normal match first; with fewer than 3 hits it also accepts small typos and Japanese spelling variants (ramen/raamen). No library.
- Text selection and the long-press menu are off everywhere except typing fields (end of css/app.css).
- (2026-11-10.2) Typing: the "keep map at top" scroll guard pauses while a text field is focused; `--kb` (keyboard height) + panel scroll keeps the field above the keyboard. Food field has tap-able examples (`#fEx`, `drawFex`). Visitor/team places always get their own pin. Zoom guide `#zHint` below zoom 13. Font: Figtree (Google Fonts), lighter weights. Solid band behind the iPhone status bar (`body.ex::before`) against the iOS 26 top blur.
- Accounts: `#account` page is only the look (nothing sent). Editor mode is hidden from the menu; open the app with `#editor` at the end of the address (it stays in the menu once the code is on).
- (2026-11-10.3) Bubbles = design B (`clIcon`, `.clb`): white pill, navy cap with bowl, green dot = has halal, light green = has vegan; max 45 on a phone (70 on PC), wider grouping. Zoom guide is a glass pill under the chips (hides "Search this area"). Max zoom 21 (raster backup stretches from 19). In explore the page background is navy so the iOS 26 status-bar band is navy, not grey.
- (2026-11-10.4) Files: `js/icons.js` (own icons `IC`/`si()`, flags, map pins `pinSvg` + food icons `CU`) loads before app.js; `js/more.js` (start screen `#home`, Start·Map·List switch `#seg`, phone back button via history + MutationObservers, menu extras: directions walk/transit/car `trMode`, clear map data, Jakorchi Plus "coming soon") loads after. Phrases load from `lang/phrases.json` when opened.
- List shows only places on screen, nearest first (to you, else map middle); typed search or "Top rated" sorts by rating. Search updates while typing (350 ms pause). Status pill under the chips only while loading or on a problem. Start screen shows once on the first visit.
- Colours: light #f5f3ee / dark #12161c pairs in `:root`. No system emoji in the app (use `si("name")`).
- (2026-11-10.5) Start screen = one solid colour (ivory light / deep navy dark, vars `--hb…` in css), no city list, Jakorchi Plus preview (3 placeholder benefits, owner to confirm). Sign in / Log in / Sign up = "coming soon" popup (`soon()` in more.js); the account page is gone. Settings page `#settings` (appearance auto/light/dark saved as `jk_theme`, language, map letters, distance, directions, clear map data, Plus, version); the menu only links to it. Behind the iPhone clock the page colour is the map's land colour (#f8f4f0 / dark #292624), no bar. City search: local list of ~60 cities with local names and old spellings (`CT` in more.js), typo-tolerant; Enter on anything else asks OpenStreetMap. Map squares always load nearest to the middle first.
- Back button: one guard history step while any layer is open (more.js); never call history.back() directly elsewhere.
- (2026-11-10.6) Every cold start opens the start screen (not for shared links / #editor). Start screen has theme switch (Light/Dark/System) + settings gear. Settings: Profile (coming soon, no fields), "Clear cache" = only `jk_c_*` lookups, "Clear saved map data" = only `/places/` files in the phone cache + saved map style; app files, favorites, lists and servers are never touched. Inputs are 16px (iPhone no longer zooms the page). Filters open = map gestures off. Tap stars on a card = open full + scroll to reviews. Card open = bubbles hidden. Gold "coming soon" only for Plus.
- (2026-11-10.7) No orange anywhere: buttons use `--pri`/`--prit` (navy + cream in light, cream + navy in dark), same as the start screen. Ratings gold (`--sg`, `.star`, `[data-st]`). Settings = 6 groups (`.acc`), all closed at start, tap header to open. City search: typing hides the fixed city buttons and shows only matches; leaving the field keeps text and list.
- (2026-11-10.8) Load check (1000 visitors): app keeps working when Supabase / OSM services are slow or down, and asks less often then. Card says "Reviews can't load right now." when the database can't be reached (`noRev`). Posting limits give a clear message (`sbWhy`). City search: answers kept 30 days (`jk_c_city_*`), Photon as backup when Nominatim is busy.
- (2026-11-10.9) Start screen: no 'Open the map' button (the bottom switch Map button is the way in), tighter spacing. Bubbles: grouping cell 140 px at zoom ≤13, 112 px at 14; at most 24 bubbles on a phone (40 on PC). Single pins: zoom 15 max ~60, 16 ~95.
