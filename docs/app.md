# App (public/) – front-end rebuild, front page only
The map app (search, filters, list, reviews, prices, pins) is being rebuilt screen by screen. The old version was removed from the working tree (owner's decision, 2026-11-10); it stays in git as tag `old-app-final` (`git show old-app-final:public/js/app.js`, also `more.js`, `icons.js`, `css/app.css`) and its notes are in `docs/old-app.md` (behaviour to keep: zoom to 21, number bubbles, pin limits per zoom, typo-friendly search, filters, list, back button, local-money prices). Read the old code only when porting a feature. Database, `places/`, `lang/`, tools and the safety rules are unchanged.

## Files
- `index.html` (page + SEO, no inline scripts) · `css/base.css` (colours light/dark, fonts) · `css/home.css` (front page, popup layer)
- `js/theme.js` (runs first: saved theme `jk_theme`, theme-color, "wait" flag for non-English) · `js/auth.js` (runs first: signed in → class `in` on `<html>` hides Sign in / Create account) · `js/app.js` (`const BUILD`, fonts, self-reload on new version, service worker) · `js/i18n.js` (`T`, `JK.i18n.set`) · `js/home.js` (theme buttons, popups, settings = language)
- Settings page: `css/settings.css` + `js/settings.js` (full page `#settings`, opened by the gear; one history step, phone back closes it). Order: Profile (signed out: Not signed in + Sign in / Create account; signed in: avatar + name/email from `jk_user`, Change email, Change password, Sign out; none of these exist signed out) · Jakorchi Plus (one row-sized membership bar: navy, thin gold line, gold name, "Coming soon"; tap = "Coming soon" popup; no plus sign; still empty) · Appearance · Language + Map language (`jk_maplet` = auto | latin | language code, same values as the old app; the map must read it) · Storage (Clear cache = only `jk_c_*`; Clear saved map data = only `/places/` in the phone cache + `jk_style1`, tap twice) · About (version, description; tap the version = a toast with screen numbers for phones we cannot test: window, screen, standalone, safe-area top/bottom, bar colour, background). Small touches: gold rod on top, double gold line, gold diamond headings (the red 設 seal was removed at the owner's request). Shared popup layer = `JK.ui` in home.js.
- `sw.js` (network first for app files, saved copy offline; bump `V` when caching rules change) · `logo.svg` (old logo, from icon.svg) · `version.json`
- version: `const BUILD` in js/app.js = `?v=` in index.html = version.json (`python tools/bump-version.py`)

## Design (current; palette NOT fixed)
- Now: navy / cream / gold. Light bg #F6F1E6 ink #0A1226 · dark bg #070D1F ink #F3EBDB. Designer may propose a better 2–3 colour palette (60-30-10); owner picks; then replace these lines (one palette only).
- Fonts (Google Fonts): Fraunces (name, tagline, popup titles), Inter Tight (buttons, small text), Lora only for the J of the name. zh/ja/ko/ar tagline = phone's own font; name stays Fraunces.
- Front page order: Light · Dark · System + Settings · old logo · Jakorchi · 日本 · 대한민국 · 中国 (own languages, never translated, always left-to-right) · tagline · Sign in / Create account · Start · Map · List.
- Signed in = Sign in and Create account gone. Accounts not live; `JKAuth.signIn(user)` / `signOut()` (key `jk_user`) or a Supabase session (`sb-…-auth-token`) turns it on.
- Sign in / Create account / Map / List = "Coming soon" popup for now. Back button closes a popup (one history step).
- Short phones (≤680 px high): tighter spacing, no scroll.

## Texts
- English = the key itself; every new text gets all 8 other `lang/<code>.json`. Added: "Create account", "Discover authentic dining across Japan, South Korea and China", "Change email", "Sign out", "Map language", "Choose the language of the names on the map." (owner should check the translations).
