# Status (2026-11-10 · front-end rebuild, front page)

## Done
- ✅ GitHub = source · automatic publishing via Cloudflare Workers Builds · version number + self-update
- ✅ New front page (navy/cream/gold, light + dark, 9 languages, signed-in hides Sign in / Create account) – see `docs/app.md`
- ✅ Old front end kept in `old/` (ask the owner before deleting) · database, `places/`, `lang/`, tools untouched · DB advisor 0
- ✅ Supabase test rows (reviews, new places, votes, owner info) are kept on purpose

## Next (owner picks the order)
- Map screen · list · place card · filters · search · settings page · accounts (then call `JKAuth.signIn`)
- Map and List buttons show "Coming soon" until then

## Owner to do
1. Check the new tagline / "Create account" wording in the 8 languages (nl, de, fr, es, zh, ja, ko, ar)
2. iPhone: screenshot of the front page (top and bottom) after the release
3. Turn on 2-step login (2FA) for GitHub, Cloudflare and Supabase
4. Send the contact email for an About & privacy page (later)
