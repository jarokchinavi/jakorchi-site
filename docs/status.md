# Status (2026-11-10 · version 2026-11-10.10)

## Done
- ✅ GitHub = source · automatic publishing via Cloudflare Workers Builds · version number + self-update
- ✅ page / css / js (`app.js` + `icons.js` + `more.js`) / lang files · strict CSP without inline scripts · 9 languages incl. Arabic
- ✅ start screen on every launch (theme switch, settings gear, Log in / Sign up = "coming soon", Plus preview) · Start · Map · List switch at the bottom
- ✅ Settings page in 6 closed groups (profile, preferences, language & region, storage, Plus, about)
- ✅ map: label-pill bubbles (max 24 on a phone), own food-icon pins with price tag, zoom guide pill, zoom to 21, list = places on screen, nearest first
- ✅ search: live, typo-friendly · city search with ~60 cities + spelling mistakes · phone back button · no orange, gold ratings
- ✅ data: Seoul · Tokyo area · Kyoto/Osaka area · 5 Kyoto halal team places · duplicate check (same name within 15 m) · DB advisor 0

## Owner to do
1. Send the contact email for the About & privacy page (then set `CONTACT` in js/app.js)
2. iPhone: screenshot of the top of the map screen and of the open menu (the fade through the search bar) + tap the version number
3. Turn on 2-step login (2FA) for GitHub, Cloudflare and Supabase
4. Optional: delete from Desktop jakorchi-tools: kansai.osm.pbf, kanto.osm.pbf, old-address\, START-HERE.txt, JAKORCHI-HANDOVER.md
5. Optional: Google Search Console + Bing for the live address · Arabic speaker checks the wording

## Open ideas (ask first)
- drop Google Fonts for the phone's own fonts (faster start, one outside service less; look changes a little)
- Supabase free plan pauses a project with almost no use for 7 days (warning email first; "Resume project" within 90 days)

## Later
- more cities · own domain (jakorchi.com ~$10/yr, only with owner's yes) · Google Play ($25 once, only with owner's yes)
