# App (public/) – front-end rebuild, front page only
The map app (search, filters, list, reviews, prices, pins) is being rebuilt screen by screen. The old version is in `old/` and its notes in `docs/old-app.md` (behaviour to keep: zoom to 21, number bubbles, pin limits per zoom, typo-friendly search, filters, list, back button, local-money prices). Delete `old/` only when the owner says so. Database, `places/`, `lang/`, tools and the safety rules are unchanged.

## Files
- `index.html` (page + SEO, no inline scripts) · `css/base.css` (colours light/dark, fonts) · `css/home.css` (front page, popup layer)
- `js/theme.js` (runs first: saved theme `jk_theme`, theme-color, "wait" flag for non-English) · `js/auth.js` (runs first: signed in → class `in` on `<html>` hides Sign in / Create account) · `js/app.js` (`const BUILD`, fonts, self-reload on new version, service worker) · `js/i18n.js` (`T`, `JK.i18n.set`) · `js/home.js` (theme buttons, popups, settings = language)
- `sw.js` (network first for app files, saved copy offline; bump `V` when caching rules change) · `logo.svg` (old logo, from icon.svg) · `version.json`
- version: `const BUILD` in js/app.js = `?v=` in index.html = version.json (`python tools/bump-version.py`)

## Design (chosen by the owner)
- Navy / cream / gold. Light: bg #F6F1E6, ink #0A1226. Dark: bg #070D1F, ink #F3EBDB. No black, no orange, no pattern, no extra marketing words.
- Fonts (Google Fonts): Fraunces (name, tagline, popup titles), Inter Tight (buttons, small text), Lora only for the letter J of the name (Fraunces' J looked odd). zh/ja/ko/ar use the phone's own font for the tagline; the name stays Fraunces.
- Front page order: Light · Dark · System + Settings · old logo · Jakorchi · 日本 · 대한민국 · 中国 (own languages, never translated, always left-to-right) · tagline · Sign in / Create account · Start · Map · List.
- Signed in = Sign in and Create account are gone. Accounts are not live yet; `JKAuth.signIn(user)` / `JKAuth.signOut()` (key `jk_user`) or a Supabase session (`sb-…-auth-token`) turns it on.
- Sign in / Create account / Map / List show a "Coming soon" popup for now. Back button closes a popup (one history step).
- Short phones (≤680 px high) get tighter spacing so nothing scrolls.

## Texts
- English = the key itself; every new text gets all 8 other `lang/<code>.json`. Added: "Create account", "Discover authentic dining across Japan, South Korea and China" (owner should check the translations).
