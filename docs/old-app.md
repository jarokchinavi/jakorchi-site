# OLD app: behaviour + fixes to keep (look and button places are new; rules below stay)
Read before map / list / card / filters / search / review screens. Code: tag `old-app-final` (`git show old-app-final:public/js/app.js`; also `js/more.js`, `js/icons.js`, `css/app.css`). Vanilla JS, no build, Leaflet from cdnjs with integrity.

## Map
- Zoom up to 21 (raster backup stretches from 19) · OpenFreeMap vector style; labels set to app language BEFORE drawing (`styleLang`), style kept 7 days; plain OSM tiles only as backup after 6 s
- Bubbles at zoom ≤ 14 (`syncCl`, `clIcon`): cell 140 px at ≤13, 112 px at 14 · max 24 on phone, 40 on PC · tap = zoom in 2 · card open = bubbles hidden · zoom guide below zoom 13
- Single pins from zoom 15 (15 max ~60, 16 ~95; `pinScore` rating > info; tiers in `syncMarkers`) · redraw at most every 200 ms (`syncSoon`) · visitor/team places always own pin · squares load nearest to middle first

## Search + list
- Normal match first; typo / spelling variants (`fold`, `near`, `fuzzyHit`; ramen/raamen) only with < 3 hits; no library · live while typing (350 ms pause)
- List = places on screen, nearest first (to you, else map middle); typed search or "Top rated" sorts by rating · status pill only while loading or on a problem
- City search: ~60 local cities with local names + old spellings (`CT` in more.js, typo-tolerant); other text on Enter → OSM Nominatim, Photon backup; answers kept 30 days (`jk_c_city_*`); typing hides fixed city buttons
- Food filter: type-to-search box (`fCuisine` + datalist) with tappable examples (`drawFex`)

## Places, texts, data
- Place row, 18 cols: id, name, localName, cat, cuisine, lat, lng, halal, vegan, hours, addr, web, (empty: area removed), country, vegetarian, phone, nm, sub
- Names: real name · English only if OSM has it or known chain (`BRANDS`) · no made-up Latin
- Food type: OSM cuisine or `FOODS` word list (≈ guessed) · search in any language via `cuisAll` (`foods.json`: `c:` food names + category names)
- Texts: `T(key)`, English = key · only the chosen `lang/<code>.json` is downloaded (`loadLang`) · `lang/phrases.json` loads when opened · ar = right-to-left, map stays left-to-right
- Reports (`openFlag`): closed / halal / vegan-vegetarian yes-no + food type · "closed" label (`closedTag`) from 3 yes and more yes than no
- Prices: reviews carry price 1–4 · `PRC` local money (JP ¥ 1,500/4,000/10,000 · KR ₩ 13,000/30,000/80,000 · CN ¥ 50/150/400) · slider 1–20 (20 = any) · `prLoad` bulk-loads from `place_ratings`
- Saved places + lists only on the phone · directions walk/transit/car (`trMode`) · Jakorchi Plus "coming soon"
- Editor mode hidden: open app with `#editor` at end of address (stays in menu once the code is on)
- About & privacy (`#about`): names the outside services, keep it true; `CONTACT` in js/app.js = contact email ("" hides the line)
- `sw.js`: navigation + css/js/lang = network first (saved copy offline) · places = saved copy first, refresh in background · bump `V` when caching rules change

## Hard-won fixes
1. iPhone home-screen app is laid out short by the status-bar height → measured once (`fixIosGap`, `html.iosgap`); `position:fixed` layers get cut off, so on the map screen stage / sheet / menu live inside `<body>` as `absolute`; map fills under status bar and home bar (`env(safe-area-inset-*)`).
2. iOS 26 blurs the strip under the clock (home-screen app only, no web way to switch off). Now: top bar / back button sit `--shift` (16 px) lower (owner, 2026-11-13); page background = map colour so the band matches; `theme-color` follows light/dark. If still blurry: raise `--shift` in base.css (48 px removed it fully but the owner found it too low).
3. Typing: "keep map at top" scroll guard pauses while a field is focused; `--kb` (keyboard height) keeps the field above the keyboard; inputs 16 px so iPhone does not zoom.
4. Text selection + long-press menu off everywhere except typing fields.
5. Back button: one guard history step while any layer is open; phone back closes the layer; never call `history.back()` directly elsewhere.
6. Filters open = map gestures off. Tap stars on a card = open full card + scroll to reviews.
7. Slow or broken services (Supabase, OSM) never break the app: fallbacks everywhere, ask less often when slow, "Reviews can't load right now" (`noRev`), clear posting-limit messages (`sbWhy`).
8. No system emoji (own icons).
9. The browser test pane pauses map drawing while hidden: map labels cannot be judged there.
