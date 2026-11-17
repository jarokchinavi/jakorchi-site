# Safety (never weaken)
Read when touching js / html / `_headers`, showing remote text, or using an outside file / package / download.
- CSP `script-src 'self'` + unpkg only (the MapLibre file is loaded with its SRI fingerprint in `js/maplib.js`; a changed file is refused). Keep the CSP in `public/_headers` (real) and the meta tag in `index.html` the same; list only hosts the code really uses (add Overpass / Photon back only when "Search this area" / place suggestions are built). Known gap: the Arabic text plugin `mapbox-gl-rtl-text@0.2.3` (unpkg, pinned version) has no fingerprint; self-hosting it needs the owner's OK. No inline scripts, no `on…=` attributes: set handlers in `js/`.
- Remote text through `esc()` (`JK.ui.esc`). Photo paths go through `JK.sb.okPath`; links must start with http(s).
- App uses only the publishable Supabase key. Visitors add rows only (see `docs/database.md`).
- Repo is PUBLIC: rules in `CLAUDE.md`. Editor code is set by the owner in the SQL Editor only.
- Outside file / package / download: quick scan (secrets, odd scripts, odd network calls). Looks wrong → skip, tell owner. Unverified source → ask first.
