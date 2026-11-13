# Checks (only when a big task is finished)
- PC: Windows · git and python are installed, node is not (skip `node --check`) · python needs `-I` · put `C:\Program Files\Git\cmd` on PATH in the shell
- local test: `python -m http.server 8099` in `public/` → open `http://127.0.0.1:8099/` in the browser pane at 390×780 and 320×568 · stop the server afterwards · clear the `jk_*` keys you set
- check: light + dark · all 9 languages (no missing text, no sideways scroll, Arabic right-to-left) · signed out + signed in (`JKAuth.signIn({name,email})`, `signOut()`) · popups close with back / Esc / button · no console errors (the pane cannot register `sw.js`: its one error is normal)
- screenshots for the owner: `SendUserFile` (the inline preview did not show for the owner: send PNG/JPG files) · mock-ups: Edge headless `--screenshot` of a local HTML file
- new texts: script with python, compact JSON; check every used key exists in all 8 `lang/<code>.json`
- SQL: local Postgres 16 (su postgres · /tmp/pgdata · port 5544) · anon tests in one DO block ending with raise (undoes all) · then apply_migration · get_advisors security = 0
- phones we cannot test: ask for a screenshot + the numbers shown by tapping the version number in Settings
- code-length audit (only on request, changed files only): same logic twice → one function · unused code/CSS/replaced features → delete (search refs first) · helper used once → remove · `js/` file > ~150 lines or two jobs → split · library for one tiny feature → replace · behaviour unchanged, report lines removed
