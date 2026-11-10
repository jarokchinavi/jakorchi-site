# Status (2026-11-10 · front-end rebuild, front page)

## Done
- ✅ GitHub = source · automatic publishing via Cloudflare Workers Builds · version number + self-update
- ✅ New front page (navy/cream/gold, light + dark, 9 languages, signed-in hides Sign in / Create account) – see `docs/app.md`
- ✅ Old front end removed from the working tree, kept in git tag `old-app-final` · database, `places/` (160 files + 208 split files in `places/14`, about 122,000 places), `lang/`, tools untouched · DB advisor 0
- ✅ Supabase test rows (reviews, new places, votes, owner info) are kept on purpose

## Next (owner picks the order)
- Settings page built (version 2026-11-10.13, tested locally, not yet released) · Change email / password / Sign out are placeholders until accounts exist
- Map screen · list · place card · filters · search · accounts (then call `JKAuth.signIn`) · later in settings: delete account, contact/feedback, privacy page, units, directions
- Map and List buttons show "Coming soon" until then

## Owner to do
0. GitHub repo stays public (owner's choice, nothing private inside) · iPhone: the top of the page fades a little → send a screenshot + the numbers from tapping Settings → Version
1. Check the new tagline / "Create account" wording in the 8 languages (nl, de, fr, es, zh, ja, ko, ar)
2. iPhone: screenshot of the front page (top and bottom) after the release
3. Turn on 2-step login (2FA) for GitHub, Cloudflare and Supabase
4. Send the contact email for an About & privacy page (later)
