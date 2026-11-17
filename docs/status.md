# Status (2026-11-16 · front-end rebuild: front page, settings, profile, map, place card)

## Done
- Auto publishing (Cloudflare) · version + self-update · front page + settings + profile in the green/cream/gold design (light/dark, 9 languages) · new logo + icons · old front end only in tag `old-app-final` · DB advisor 0
- Map screen + place card + search + filters + lists + food type typing (2026-11-16, details in `docs/app.md`). Home Map button opens the map.

## Next (owner picks the order)
- Still to build from the old app (gap list, owner decides): owner info ("I own or work at this restaurant", note for visitors) · Add a tip (+ share, must-try dish, how to order, show-staff phrases) · Show on map + distance · "Is this place really here?" · photo reporting + photo viewer · English menu tag + filter · Price slider filter · Top rated / Nearest first sorting · live "Search this area" (Overpass) · Add a restaurant (visitor) + editor mode · list rename / delete / share · List screen · blue dot / nearest address / location-off message · Useful phrases · About & privacy · "A new version is ready" notice · offline maps
- When the List screen is built: tapping a list under "My places" (Favorites, Want to go, own lists) must ALSO open a popup list of those places (owner, 2026-11-17); today it only filters the map
- Search rules still missing: match on dish, romanized name, names in other languages; food suggestions from the area; ~60 cities with local names (now 8 + Nominatim on Enter); Photon place suggestions
- China has no data files yet (places/) · ratings exist for very few places
- Accounts (then call `JKAuth.signIn`) · Change name / email / password and Delete account are placeholders · Sign in / Create account / Plus = "Coming soon"
- Directions = links to the visitor's own maps app (`docs/old-app.md` Directions); no own navigation

## Owner to do
0. iPhone top blur (iOS 26, home-screen app): top bar moved 16 px lower (2026-11-13); owner to check on the phone, more/less = `--shift` in base.css (`docs/old-app.md` fix 2)
1. Check the new texts in the 8 languages (nl, de, fr, es, zh, ja, ko, ar): tagline, Create account, Want to go, Bakery, Coffee, Closed, Copy address, Copy coordinates, Other map apps, Reviews, Saved, Share
2. Try the map on a real phone (iPhone + Android): pins, swipe row, Navigate links (Korea: Naver / Kakao; China: Amap, shifted coordinates, not yet tested on a real phone)
3. Turn on 2-step login (2FA) for GitHub, Cloudflare and Supabase
4. Send the contact email for an About & privacy page (later)
