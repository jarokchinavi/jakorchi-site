# Rules from the old app that still count (look and button places are new)
Read before search, card, filters, report or review work. Map, pins, List, filters and intro are described in `docs/app.md` (it wins). Old code only in git tag `old-app-final` (`git show old-app-final:public/js/app.js`; also `js/more.js`, `js/icons.js`), read only when porting.

## Search
- City search: ~60 local cities with local names + old spellings (`CT` in more.js, typo-tolerant); other text on Enter → OSM Nominatim, Photon backup; answers kept 30 days (`jk_c_city_*`); typing hides fixed city buttons. Not ported yet (now 8 cities).
- Typo / spelling variants (ramen / raamen) only when there are few normal hits; no library; live while typing (350 ms pause).

## Places, texts, data
- Place row, 18 cols: id, name, localName, cat, cuisine, lat, lng, halal, vegan, hours, addr, web, (empty: area removed), country, vegetarian, phone, nm, sub
- Names: real name · English only if OSM has it or known chain (`BRANDS`) · no made-up Latin
- Food type: OSM cuisine or `FOODS` word list (≈ guessed) · search in any language via `foods.json`
- Texts: `T(key)`, English = key · only the chosen `lang/<code>.json` is downloaded · `lang/phrases.json` loads when opened · ar = right-to-left, map stays left-to-right
- Reports: closed / halal / vegan-vegetarian yes-no + food type · "closed" label from 3 yes and more yes than no
- Saved places + lists only on the phone · Jakorchi Plus "coming soon"
- Editor mode hidden: open app with `#editor` at end of address (stays in menu once the code is on)
- About & privacy (`#about`): names the outside services, keep it true; `CONTACT` in js/app.js = contact email ("" hides the line)

## Hard-won fixes
1. iPhone home-screen app is laid out short by the status-bar height → measured once (`fixIosGap`, `html.iosgap`); `position:fixed` layers get cut off, so on the map screen stage / sheet / menu live inside `<body>` as `absolute`; map fills under status bar and home bar (`env(safe-area-inset-*)`).
2. iOS 26 blurs the strip under the clock (home-screen app only, no web way to switch off). Now: top bar / back button sit `--shift` (16 px) lower (owner, 2026-11-13); page background = map colour so the band matches; `theme-color` follows light/dark. If still blurry: raise `--shift` in base.css (48 px removed it fully but the owner found it too low).
3. Typing: "keep map at top" scroll guard pauses while a field is focused; `--kb` (keyboard height) keeps the field above the keyboard; inputs 16 px so iPhone does not zoom.
4. Text selection + long-press menu off everywhere except typing fields.
5. Back button: one guard history step while any layer is open; phone back closes the layer; never call `history.back()` directly elsewhere.
6. Filters open = map gestures off. Tap stars on a card = open full card + scroll to reviews.
7. Slow or broken services (Supabase, OSM) never break the app: fallbacks everywhere, ask less often when slow, "Reviews can't load right now", clear posting-limit messages.
8. No system emoji (own icons).
9. The browser test pane pauses map drawing while hidden: map labels cannot be judged there.

## Directions (owner decided 2026-11-16: NO own navigation, no Google Maps / paid map API)
- The place card gets a Directions row that opens the visitor's own maps app with the restaurant as destination: plain links only, free, no key. Walk / Transit / Car choice (`jk_tr`, default walk). Old code: `links()` in old `js/app.js` (tag `old-app-final`).
- Always: Google Maps `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=walking|transit|driving` · Apple Maps `https://maps.apple.com/?daddr=<lat>,<lng>&dirflg=w|r|d`
- South Korea first: Naver `nmap://route/walk|public|car?dlat&dlng&dname&appname=jakorchi` with web fallback `https://map.naver.com/p/search/<name>?c=<x>,<y>,17,0,0,0,dh` · Kakao `https://map.kakao.com/link/to/<name>,<lat>,<lng>` (no travel mode in this link; the transit option is unreliable on the web link)
- China first: Amap `https://uri.amap.com/navigation?to=<lng>,<lat>,<name>&mode=walk|bus|car&src=jakorchi&callnative=1`. Amap uses GCJ-02 (shifted) coordinates; our places are WGS-84, so convert them ourselves (standard WGS84→GCJ-02 formula, only for points inside China) before building the Amap link, then test on a real phone. Baidu: not added (link form unverified, needs a key); decide after the phone test.
- Use the place name in the country's own language (`localName`) so Naver / Amap find the real listing. "Google reviews" / "Naver reviews" = plain search links only, no Google data used.
- Why not Google Maps in the app: costs money after 10,000 free loads a month, terms limit mixing with other maps and saving data, China is blocked and shifted, South Korea only partly open (2026). Keep the free open map (OpenFreeMap / OpenStreetMap).
