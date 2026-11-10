# Database (Supabase jsegdbtefxsforphluyc)
Setup files: `database/01…NN-*.sql` (all applied, in this order). New change = new numbered file.

## Tables (label shows in Table Editor)
- ⭐ reviews · price 1–4 (optional) · hide: approved = false
- 🚩 place_flags · kind: halal / vegan / vegetarian / closed (yes = closed, no = still open) / food:<type> votes · one answer per phone per kind
- 📷🚩 photo_reports · 2 = photo hidden
- 📍 new_places · photo of outside required · shown at 3 yes (adder = 1) · 3 no hides · pending > 90 days gone · verified = team place · hide: hidden = true
- 📍✔ new_place_votes · 🍽 menu_photos (hide: hidden = true) · 🏪 owner_info (3 reports hide) · 🏪🚩 owner_info_reports
- 👁 views the app reads (read only): reviews_public · place_ratings (n, sum_stars, n_price, sum_price) · place_flag_counts · new_places_public · menu_photos_public · owner_info_public
- 🗂 storage bucket review-photos · JPEG / WebP ≤ 400 KB

## Access
- dashboard = owner login only (2-step login on)
- publishable key: read views + add rows · never change / delete · phone ids private
- views security_invoker · checks in schema private · public RPC: editor_check, editor_add_place
- after every change: get_advisors security = 0

## Editor mode
- owner sets the code once in the SQL Editor: select private.set_editor_code('…'); · Claude never sees it
- app: menu → Editor mode → code → added restaurants are verified at once
- 10 wrong tries = locked 1 hour
- team place (only real info from the owner): insert into public.new_places (name, lat, lng, cat, cuisine, halal, vegan, vegetarian, photo, device, verified) values (…, 'jakorchi-editor', true)

## Spam limits
- per phone / day: reports 120 · reviews 15 · photo reports 60 · new places 5 · votes 60 · menu photos 20 · owner info 5 · info reports 60
- whole app: reviews 100/h 600/d · reports 2000/h 20000/d · photo reports 200/h · uploads 60/h 300/d 2000 total · new places 30/h 150/d · votes 600/h · menu 60/h · owner info 50/h 300/d · info reports 300/h

- 12-kyoto-halal.sql (applied): 5 team places in Kyoto (GYUMON Gion / Shimogyo / Nakagyo, HALRA, WAGYUZA), halal, verified. Names + coordinates from the owner; GYUMON Shimogyo not yet confirmed on a directory.
