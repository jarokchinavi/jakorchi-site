---
name: jakorchi-debug
description: Use only when the Jakorchi app is broken, blank, slow, wrong on a phone, or a release failed.
---

# Debug

Test steps: `docs/checks.md`. Rollback: `docs/release.md`. Phone rule: `CLAUDE.md`.

1. Symptom: page, device, language, light/dark, signed in/out.
2. Evidence before fix: console, network, Supabase logs, Cloudflare build, live `/version.json` vs repo.
3. Last change first: `git log -3`, diff.
4. One suspect at a time; read only that small file.
5. Smallest fix for the cause; no refactor.
6. Test once.

2 failed tries -> stop, say what was tried and what is unknown.
