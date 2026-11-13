# Release (every change)
1. Edit `public/` → `node --check` changed js (PC has no node: skip) → quick browser check (`docs/checks.md`)
2. `python tools/bump-version.py` (app code, `?v=`, `version.json`)
3. Commit + `git push origin main` (author Claude + Co-Authored-By; if it asks sign-in: owner runs it in Terminal panel; never type passwords) → live in ~1 min
4. Live check: `/version.json` = new · files 200 · no console errors · CSP header present · `/old/` not served
5. Backup: `robocopy public\ → Desktop jakorchi-site /E` (never /MIR: no deleting). Tell owner the version (Settings → Version)

## Rollback
`git revert`, push, check `/version.json`. Tell owner: what happened, what was undone, what next. Then find cause.

## New restaurant data
Owner runs `make-restaurants.bat` → files in Desktop `places\` → validate (JSON, right square) → copy to `public/places/` + `_done.json` → `python tools/clean_names.py` → `python tools/split_places.py` → push. Details: `docs/data.md`.

## Database change
New numbered file in `database/` → test on local Postgres first → `apply_migration` → `get_advisors` security = 0.
