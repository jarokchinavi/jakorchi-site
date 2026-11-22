# Status (2026-11-18 · front-end rebuild: intro, map, card, List, Add a restaurant live)

## Done
- Auto publishing (Cloudflare) · version + self-update · front page, settings, profile in the green / cream / gold design (light / dark, 9 languages) · new logo + icons · old front end only in tag `old-app-final` · DB advisor 0
- Intro at app start · map (opens instantly) · place card · search · filters (incl. Top rated, Price, Open now, Halal split) · lists · List screen · Add a restaurant + confirm votes · team places (5 Kyoto halal). Details: `docs/app.md`.

## Next (owner picks the order)
- Still to build from the old app: owner info ("I own or work at this restaurant", note for visitors) · Add a tip (+ share, must-try dish, how to order, show-staff phrases) · "Show on map" in the card · photo reporting + photo viewer · English menu tag + filter · live "Search this area" (Overpass) · editor mode (team adds places verified at once) · list rename / delete / share · blue dot / nearest address / location-off message · Useful phrases · "A new version is ready" notice · offline maps
- Search rules still missing: match on dish, romanized name, names in other languages; food suggestions from the area; ~60 cities with local names (now 8 + Nominatim on Enter); Photon place suggestions
- Filters we CANNOT offer without data (Halal Navi has them): pork-free, alcohol-free, prayer space, halal certificate. They need a new database field = owner decision.
- Whole-country data: JAPAN is live (211,668 places, cloud build). Next: south-korea (whole country; now only the Seoul area), then china, each on its own data branch via `tools/build-request.txt` (`docs/data.md`), merged after the owner's OK. Clean up the old data branches (`data/kansai-…`, `data/japan-…`) with the owner's yes
- China has no data files yet (places/) · ratings exist for very few places (so Top rated, Price and the price sorts show little)
- Accounts: sign in / create account / skip + saved places sync are built (`docs/app.md`). Still open: forgot-password mail (needs an e-mail service), Change name / email / password and Delete account (placeholders), biometric login (passkeys), reviews per account
- Directions = links to the visitor's own maps app (`docs/old-app.md` Directions); no own navigation

## Owner to do
0. iPhone top blur (iOS 26, home-screen app): top bar moved 16 px lower; check on the phone, more / less = `--shift` in base.css (`docs/old-app.md` fix 2)
1. Check the newest texts in the 8 languages (list in `docs/app.md` > Texts)
2. Try on a real phone (iPhone + Android): pins, card swipe, Navigate links (Korea: Naver / Kakao; China: Amap, shifted coordinates, not yet tested), Add a restaurant (send one clearly fake test place), List
3. Turn on 2-step login (2FA) for GitHub, Cloudflare and Supabase
3b. Supabase dashboard > Authentication > Providers > Email: turn "Confirm email" OFF (accounts work at once, free)
4. Send the contact email for the About & privacy page (it also answers "how do I get my review removed / my account deleted")
