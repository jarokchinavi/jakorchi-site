# Release (every change)
1. Edit `public/` → `node --check` changed js (PC has no node: skip) → quick browser check (`docs/checks.md`)
2. `python tools/bump-version.py` (app code, `?v=`, `version.json`)
3. Commit + `git push origin main` (author Claude + Co-Authored-By; if it asks sign-in: owner runs it in Terminal panel; never type passwords) → live in ~1 min
4. Live check: `/version.json` = new · files 200 · no console errors · CSP header present · `/old/` not served
5. Backup: `robocopy public\ → Desktop jakorchi-site /E` (never /MIR: no deleting). Tell owner the version (Settings → Version)

If the Cloudflare build fails with no reason (check on GitHub: commit > Checks, or the Workers Builds log in the dashboard, owner login): push an empty commit to retry once; still failing → rollback.

## Rollback
`git revert`, push, check `/version.json`. Tell owner: what happened, what was undone, what next. Then find cause.

## New restaurant data
Cloud build (`.github/workflows/build-places.yml`, start by changing `tools/build-request.txt`) → data branch → check the job summary → merge the branch into `main` → bump version → push → live check (map shows places, `/places/_index.json` 200). Details: `docs/data.md`.

## Database change
New numbered file in `database/` → test on local Postgres first → `apply_migration` → `get_advisors` security = 0.
