# Checks (only when a big task is finished)
- code: `node --check public/js/app.js`
- app: Playwright on a local copy · real Leaflet CDN is blocked in the sandbox → replace the leaflet <script> with a small fake-leaflet.js stand-in · fake Supabase answers with page.route
- compare old vs new: same `document.body.innerText`, menu and filter texts in en / nl / ar / ja · no page errors · no CSP "Refused" errors
- start screen: logo visible < 0.1 s, fades ~2 s · speed: pins per zoom + longest freeze (longtask)
- SQL: local Postgres 16 (su postgres · /tmp/pgdata · port 5544) · anon tests in one DO block ending with raise (undoes all) · then apply_migration · get_advisors security = 0
- live: after push wait for `/version.json` = new version · browser pane on the live site: files 200, chosen language loaded, CSP header present · REST checks with the page key
- the browser pane pauses map drawing while hidden → map label rendering can't be watched there
