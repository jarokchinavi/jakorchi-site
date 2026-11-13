# Status (2026-11-10 · front-end rebuild, front page)

## Done
- Auto publishing (Cloudflare) · version + self-update · new front page (light/dark, 9 languages) · old front end only in tag `old-app-final` · DB advisor 0

## Next (owner picks the order)
- Settings page built (version 2026-11-10.13, tested locally, not yet released) · Change email / password / Sign out are placeholders until accounts exist
- Map screen · list · place card · filters · search · accounts (then call `JKAuth.signIn`) · later in settings: delete account, contact/feedback, privacy page, units, directions
- Map and List buttons show "Coming soon" until then

## Owner to do
0. iPhone top blur (iOS 26, home-screen app): owner accepts it for now (2026-11-10); options in `docs/old-app.md` fix 2
1. Check the new tagline / "Create account" wording in the 8 languages (nl, de, fr, es, zh, ja, ko, ar)
2. iPhone: screenshot of the front page (top and bottom) after the release
3. Turn on 2-step login (2FA) for GitHub, Cloudflare and Supabase
4. Send the contact email for an About & privacy page (later)
