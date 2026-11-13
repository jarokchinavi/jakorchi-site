# Safety (never weaken)
Read when touching js / html / `_headers`, showing remote text, or using an outside file / package / download.
- CSP `script-src 'self'`; extra hosts (cdnjs, unpkg for map libs) only with integrity hashes. No inline scripts, no `on…=` attributes: set handlers in `js/`.
- Remote text through `esc()` (`JK.ui.esc`). Check photo paths and links when map / review screens return (old `PHRE` / `webUrl()` in tag `old-app-final`).
- App uses only the publishable Supabase key. Visitors add rows only (see `docs/database.md`).
- Repo is PUBLIC (owner's choice, 2026-11-10): never commit keys, codes, personal data, emails. Editor code is set by the owner in the SQL Editor only.
- Outside file / package / download: quick scan (secrets, odd scripts, odd network calls). Looks wrong → skip, tell owner. Unverified source → ask first.
